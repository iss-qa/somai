import { Worker, Job } from 'bullmq'
import redis from '../plugins/redis'
import { Video, Company, Notification } from '@soma-ai/db'
import { GeminiVideoService } from '../services/gemini-video.service'
import { TTSService } from '../services/tts.service'

const videoWorker = new Worker(
  'video-queue',
  async (job: Job) => {
    const { videoId, companyId } = job.data
    const startTime = Date.now()

    console.log(`[video-worker] Processing video ${videoId}`)

    // 1. Load video and company
    const video: any = await Video.findById(videoId)
    if (!video) throw new Error('Video nao encontrado')

    const company: any = await Company.findById(companyId).lean()
    if (!company?.access_enabled) throw new Error('ACCESS_DISABLED')

    // 2. Update status to generating
    await Video.findByIdAndUpdate(videoId, {
      status: 'generating',
      generation_progress: 10,
    })
    await job.updateProgress(10)

    // 3. Get Gemini API key
    let apiKey: string
    try {
      apiKey = await GeminiVideoService.getApiKey(companyId)
    } catch {
      apiKey = process.env.GEMINI_API_KEY || ''
      if (!apiKey) throw new Error('Nenhuma chave Gemini configurada')
    }

    // 4. Generate script if not provided
    let script = video.gemini_script
    if (!script && video.narration_text) {
      script = video.narration_text
    }

    if (!script) {
      await Video.findByIdAndUpdate(videoId, { generation_progress: 20 })
      await job.updateProgress(20)

      try {
        const scriptResult = await GeminiVideoService.generateScript({
          companyName: company.name,
          niche: company.niche || 'outro',
          template: video.template || 'dica_rapida',
          productName: video.product_name || video.title,
          headline: video.title,
          subtext: video.extra_text || '',
          targetDuration: video.target_duration || 15,
          apiKey,
        })

        script = scriptResult.narration
        const slides = scriptResult.slides.map((s: any) => ({
          order: s.order,
          type: 'text' as const,
          card_id: null,
          title: s.title,
          text: s.text,
          image_url: '',
          duration_ms: s.duration_ms,
        }))

        await Video.findByIdAndUpdate(videoId, {
          gemini_script: script,
          narration_text: script,
          slides: video.slides?.length ? video.slides : slides,
          subtitles: scriptResult.subtitles,
          background_music:
            video.background_music !== 'nenhuma'
              ? video.background_music
              : scriptResult.suggested_music,
          generation_progress: 40,
        })
        await job.updateProgress(40)
      } catch (err: any) {
        console.error('[video-worker] Script generation failed:', err.message)
        // Continue with what we have
        await Video.findByIdAndUpdate(videoId, { generation_progress: 40 })
        await job.updateProgress(40)
      }
    } else {
      await Video.findByIdAndUpdate(videoId, { generation_progress: 40 })
      await job.updateProgress(40)
    }

    // 5. Generate TTS audio estimation
    if (video.narration_text || script) {
      const narration = video.narration_text || script
      const ttsResult = await TTSService.generateSpeech({
        text: narration,
        voice: video.voice_type || 'feminino',
        speed: video.voice_speed || 1.0,
        apiKey,
      })

      await Video.findByIdAndUpdate(videoId, {
        has_audio: true,
        generation_progress: 50,
      })
      await job.updateProgress(50)
    }

    // 6. Generate subtitles if auto mode
    if (video.subtitle_mode === 'auto') {
      const narration = video.narration_text || script || ''
      if (narration) {
        const subtitles = GeminiVideoService.generateSubtitles(
          narration,
          (video.target_duration || 15) * 1000,
        )
        await Video.findByIdAndUpdate(videoId, {
          subtitles,
          generation_progress: 60,
        })
        await job.updateProgress(60)
      }
    } else if (video.subtitle_mode === 'manual' && video.subtitle_text) {
      const subtitles = GeminiVideoService.generateSubtitles(
        video.subtitle_text,
        (video.target_duration || 15) * 1000,
      )
      await Video.findByIdAndUpdate(videoId, {
        subtitles,
        generation_progress: 60,
      })
      await job.updateProgress(60)
    }

    // 7. Generate video with Gemini Veo if requested
    if (video.use_gemini_veo) {
      await Video.findByIdAndUpdate(videoId, { generation_progress: 70 })
      await job.updateProgress(70)

      try {
        const videoResult = await GeminiVideoService.generateVideoWithVeo({
          prompt: `${video.title}. ${video.product_name || ''}. ${script || video.narration_text || ''}`,
          aspectRatio: video.aspect_ratio || '9:16',
          durationSeconds: video.target_duration || 15,
          apiKey,
        })

        await Video.findByIdAndUpdate(videoId, {
          generation_method: 'gemini_veo',
          gemini_model_used: videoResult.model,
          generation_progress: 90,
        })
        await job.updateProgress(90)
      } catch (err: any) {
        console.error('[video-worker] Veo generation failed:', err.message)
        // Fall through to template generation
        await Video.findByIdAndUpdate(videoId, {
          generation_method: 'template',
          generation_progress: 90,
        })
        await job.updateProgress(90)
      }
    } else {
      await Video.findByIdAndUpdate(videoId, {
        generation_method: 'template',
        generation_progress: 90,
      })
      await job.updateProgress(90)
    }

    // 8. Mark as ready
    const generationTimeMs = Date.now() - startTime

    await Video.findByIdAndUpdate(videoId, {
      status: 'ready',
      generation_progress: 100,
      generation_time_ms: generationTimeMs,
      duration_seconds: video.target_duration || 15,
    })
    await job.updateProgress(100)

    // 9. Notify user
    await Notification.create({
      target: 'company',
      company_id: companyId,
      type: 'video_ready',
      title: 'Video pronto!',
      message: `Seu video "${video.title}" foi gerado com sucesso em ${Math.round(generationTimeMs / 1000)}s`,
      action_url: `/app/videos`,
      read: false,
    })

    console.log(
      `[video-worker] Video ${videoId} ready in ${generationTimeMs}ms`,
    )
  },
  {
    connection: redis,
    limiter: {
      max: 5,
      duration: 60000,
    },
    concurrency: 3,
  },
)

videoWorker.on('failed', async (job, error) => {
  console.error(`[video-worker] Job ${job?.id} failed:`, error.message)

  if (job?.data?.videoId) {
    await Video.findByIdAndUpdate(job.data.videoId, {
      status: 'failed',
      error_message: error.message,
      generation_progress: 0,
    })

    await Notification.create({
      target: 'company',
      company_id: job.data.companyId,
      type: 'video_failed',
      title: 'Falha na geracao do video',
      message: `Erro: ${error.message}`,
      action_url: '/app/videos',
      read: false,
    })
  }
})

videoWorker.on('completed', (job) => {
  console.log(`[video-worker] Job ${job.id} completed`)
})

export default videoWorker
