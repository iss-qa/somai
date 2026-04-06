import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Video, Card, Company, Integration } from '@soma-ai/db'
import { VideoStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import { GeminiVideoService } from '../services/gemini-video.service'
import { TTSService } from '../services/tts.service'
import videoQueue from '../queues/video.queue'

export default async function videosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / — List videos ───────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          status?: string
          template?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { status, template, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {}

      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (status) query.status = status
      if (template) query.template = template

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [videos, total] = await Promise.all([
        Video.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('source_card_id', 'headline subtext generated_image_url')
          .lean(),
        Video.countDocuments(query),
      ])

      return reply.send({
        videos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )

  // ── GET /:id — Get video detail ───────────────
  app.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const video: any = await Video.findById(id)
        .populate('source_card_id')
        .populate('slides.card_id', 'headline subtext generated_image_url')
        .lean()

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(video.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      return reply.send({ video })
    },
  )

  // ── GET /:id/status — Polling status ──────────
  app.get(
    '/:id/status',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const video: any = await Video.findById(id)
        .select('status generation_progress error_message video_url thumbnail_url')
        .lean()

      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' })
      }

      return reply.send({
        status: video.status,
        progress: video.generation_progress,
        error: video.error_message,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
      })
    },
  )

  // ── POST /generate — Create and queue video ───
  app.post(
    '/generate',
    async (
      request: FastifyRequest<{
        Body: {
          title: string
          type: string
          template?: string
          target_duration?: number
          aspect_ratio?: string
          source_card_id?: string

          // Slides
          slides?: {
            type: 'card' | 'text' | 'image'
            card_id?: string
            title?: string
            text?: string
            image_url?: string
          }[]

          // Narration
          narration_text?: string
          voice_type?: string
          voice_speed?: number

          // Visual
          palette?: string
          background_music?: string
          site_link?: string

          // Subtitles
          subtitle_mode?: string
          subtitle_text?: string

          // Images
          product_name?: string
          product_images?: string[]
          price_original?: number
          price_promo?: number
          extra_text?: string

          // Generation flag
          use_gemini_veo?: boolean
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body

      if (!body.title || !body.type) {
        return reply
          .status(400)
          .send({ error: 'Campos obrigatorios: title, type' })
      }

      // Check daily video limit (2 for Gemini Veo)
      if (body.use_gemini_veo) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayCount = await Video.countDocuments({
          company_id: companyId,
          use_gemini_veo: true,
          createdAt: { $gte: today },
        })
        if (todayCount >= 2) {
          return reply.status(429).send({
            error: 'Limite de 2 videos com IA por dia atingido',
            limit: 2,
            used: todayCount,
          })
        }
      }

      // Build slides with order
      const slides = (body.slides || []).map((s, i) => ({
        order: i + 1,
        type: s.type || 'text',
        card_id: s.card_id || null,
        title: s.title || '',
        text: s.text || '',
        image_url: s.image_url || '',
        duration_ms: Math.round(
          ((body.target_duration || 15) * 1000) / Math.max(1, body.slides?.length || 1),
        ),
      }))

      const video = await Video.create({
        company_id: companyId,
        title: body.title,
        type: body.type,
        template: body.template || 'dica_rapida',
        target_duration: body.target_duration || 15,
        aspect_ratio: body.aspect_ratio || '9:16',
        source_card_id: body.source_card_id || null,
        slides,
        narration_text: body.narration_text || '',
        voice_type: body.voice_type || 'feminino',
        voice_speed: body.voice_speed || 1.0,
        palette: body.palette || 'juntix_verde',
        background_music: body.background_music || 'nenhuma',
        site_link: body.site_link || '',
        subtitle_mode: body.subtitle_mode || 'auto',
        subtitle_text: body.subtitle_text || '',
        product_name: body.product_name || '',
        product_images: body.product_images || [],
        price_original: body.price_original || 0,
        price_promo: body.price_promo || 0,
        extra_text: body.extra_text || '',
        use_gemini_veo: body.use_gemini_veo || false,
        status: VideoStatus.Queued,
      })

      // Queue generation job
      const job = await videoQueue.add('generate', {
        videoId: String(video._id),
        companyId,
      })

      return reply.status(201).send({
        video,
        jobId: job.id,
        message: 'Video enfileirado para geracao',
      })
    },
  )

  // ── POST /generate-narration — AI narration ───
  app.post(
    '/generate-narration',
    async (
      request: FastifyRequest<{
        Body: {
          headline: string
          subtext?: string
          template?: string
          target_duration?: number
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { headline, subtext, template, target_duration } = request.body

      if (!headline) {
        return reply.status(400).send({ error: 'headline e obrigatorio' })
      }

      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId)
        const company: any = await Company.findById(companyId).lean()

        const result = await GeminiVideoService.generateNarration({
          headline,
          subtext: subtext || '',
          niche: company?.niche || 'outro',
          template: template || 'dica_rapida',
          targetDuration: target_duration || 15,
          apiKey,
        })

        return reply.send(result)
      } catch (err: any) {
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao gerar narracao' })
      }
    },
  )

  // ── POST /generate-subtitles — Sync subtitles ─
  app.post(
    '/generate-subtitles',
    async (
      request: FastifyRequest<{
        Body: {
          narration_text: string
          duration_ms: number
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { narration_text, duration_ms } = request.body

      if (!narration_text) {
        return reply.status(400).send({ error: 'narration_text e obrigatorio' })
      }

      const subtitles = GeminiVideoService.generateSubtitles(
        narration_text,
        duration_ms || 15000,
      )

      return reply.send({ subtitles })
    },
  )

  // ── POST /generate-script — AI video script ───
  app.post(
    '/generate-script',
    async (
      request: FastifyRequest<{
        Body: {
          template: string
          product_name?: string
          headline?: string
          subtext?: string
          target_duration?: number
          source_card_id?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body
      const company: any = await Company.findById(companyId).lean()

      // If source card, pull data from it
      let headline = body.headline || ''
      let subtext = body.subtext || ''
      let productName = body.product_name || ''

      if (body.source_card_id) {
        const card: any = await Card.findById(body.source_card_id).lean()
        if (card) {
          headline = headline || card.headline
          subtext = subtext || card.subtext
          productName = productName || card.product_name
        }
      }

      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId)

        const script = await GeminiVideoService.generateScript({
          companyName: company?.name || 'Empresa',
          niche: company?.niche || 'outro',
          template: body.template || 'dica_rapida',
          productName,
          headline,
          subtext,
          targetDuration: body.target_duration || 15,
          apiKey,
        })

        return reply.send({ script })
      } catch (err: any) {
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao gerar roteiro' })
      }
    },
  )

  // ── PATCH /:id — Update video ─────────────────
  app.patch(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: Record<string, unknown>
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const existing: any = await Video.findById(id).lean()
      if (!existing) {
        return reply.status(404).send({ error: 'Video nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(existing.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      const { company_id, _id, ...updateData } = request.body as any

      const video = await Video.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean()

      return reply.send({ video })
    },
  )

  // ── DELETE /:id — Delete video ────────────────
  app.delete(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const video: any = await Video.findById(id).lean()
      if (!video) {
        return reply.status(404).send({ error: 'Video nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(video.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      await Video.findByIdAndDelete(id)

      return reply.send({ message: 'Video removido' })
    },
  )

  // ── POST /estimate-tts — Preview narration timing
  app.post(
    '/estimate-tts',
    async (
      request: FastifyRequest<{
        Body: { text: string; speed?: number }
      }>,
      reply: FastifyReply,
    ) => {
      const { text, speed } = request.body
      if (!text) {
        return reply.status(400).send({ error: 'text e obrigatorio' })
      }

      const durationMs = TTSService.estimateDuration(text, speed || 1.0)

      return reply.send({
        duration_ms: durationMs,
        duration_seconds: Math.round(durationMs / 1000),
        word_count: text.split(/\s+/).filter(Boolean).length,
      })
    },
  )
}
