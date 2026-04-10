import { Worker, Job } from 'bullmq'
import redis from '../plugins/redis'
import { Company, Card, Post, PostQueue } from '@soma-ai/db'
import { PostStatus, QueueStatus, CardStatus } from '@soma-ai/shared'
import { MetaService } from '../services/meta.service'
import { NotificationService } from '../services/notification.service'
import { LogService } from '../services/log.service'

interface PostJobData {
  queueId: string
  companyId: string
  cardId: string
  videoId?: string
  platforms: string[]
  postType: string
  caption: string
  hashtags: string[]
  imageUrl: string
}

export const postWorker = new Worker<PostJobData>(
  'post-queue',
  async (job: Job<PostJobData>) => {
    const {
      queueId,
      companyId,
      cardId,
      videoId,
      platforms,
      postType,
      caption,
      hashtags,
      imageUrl,
    } = job.data

    const startedAt = Date.now()
    console.log(`[PostWorker] Processing job ${job.id} for company ${companyId}`)

    // ── Verify company access ───────────────
    const company: any = await Company.findById(companyId).lean()
    if (!company) {
      const msg = `Empresa nao encontrada: ${companyId}`
      await LogService.error('worker', 'post.company_not_found', msg, {
        metadata: { job_id: job.id, company_id: companyId },
      })
      throw new Error(msg)
    }

    if (!company.access_enabled || company.status === 'blocked') {
      const msg = `Acesso bloqueado para empresa: ${company.name}`
      await PostQueue.findByIdAndUpdate(queueId, { status: QueueStatus.Failed })
      await LogService.warn('worker', 'post.access_blocked', msg, {
        company_id: companyId,
        company_name: company.name,
        metadata: { job_id: job.id, status: company.status },
      })
      throw new Error(msg)
    }

    await LogService.info('worker', 'post.started', `Iniciando publicacao do job ${job.id}`, {
      company_id: companyId,
      company_name: company.name,
      metadata: { job_id: job.id, queue_id: queueId, platforms, post_type: postType },
    })

    // ── Atomically claim the job (guard against duplicate runs) ──
    const claimed = await PostQueue.findOneAndUpdate(
      { _id: queueId, status: { $in: [QueueStatus.Queued, QueueStatus.Processing] } },
      { status: QueueStatus.Processing },
      { new: true },
    )
    if (!claimed) {
      console.log(`[PostWorker] Job ${job.id} already processed by another runner, skipping`)
      return { skipped: true }
    }

    let instagramPostId = ''
    let facebookPostId = ''
    const fullCaption = `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`

    try {
      // ── Publish to each platform ──────────
      // Frontend sends platforms=['instagram'] with postType='feed'|'stories'|'reels'
      const isInstagram = platforms.includes('instagram')
      const isFacebook = platforms.includes('facebook')

      if (isInstagram) {
        if (postType === 'stories') {
          await LogService.info('worker', 'post.publishing', `Publicando no Instagram Stories`, {
            company_id: companyId,
            company_name: company.name,
            metadata: { job_id: job.id, platform: 'instagram_stories' },
          })
          await MetaService.publishInstagramStory(companyId, imageUrl)
        } else {
          await LogService.info('worker', 'post.publishing', `Publicando no Instagram Feed`, {
            company_id: companyId,
            company_name: company.name,
            metadata: { job_id: job.id, platform: 'instagram_feed' },
          })
          const result = await MetaService.publishInstagramFeed(
            companyId,
            imageUrl,
            fullCaption,
          )
          instagramPostId = result.instagram_post_id
        }
      }

      if (isFacebook) {
        await LogService.info('worker', 'post.publishing', `Publicando no Facebook`, {
          company_id: companyId,
          company_name: company.name,
          metadata: { job_id: job.id, platform: 'facebook' },
        })
        const result = await MetaService.publishFacebookPost(
          companyId,
          imageUrl,
          fullCaption,
        )
        facebookPostId = result.facebook_post_id
      }

      // ── Create Post record ────────────────
      const post = await Post.create({
        company_id: companyId,
        queue_id: queueId,
        card_id: cardId,
        video_id: videoId || null,
        platforms,
        post_type: postType,
        caption,
        hashtags,
        status: PostStatus.Published,
        published_at: new Date(),
        instagram_post_id: instagramPostId,
        facebook_post_id: facebookPostId,
      })

      // ── Update Card status ────────────────
      await Card.findByIdAndUpdate(cardId, {
        status: CardStatus.Posted,
        post_id: post._id,
      })

      // ── Update Queue to done ──────────────
      await PostQueue.findByIdAndUpdate(queueId, {
        status: QueueStatus.Done,
      })

      const durationMs = Date.now() - startedAt
      await LogService.info(
        'worker',
        'post.published',
        `Post publicado com sucesso em ${platforms.join(', ')} para ${company.name}`,
        {
          company_id: companyId,
          company_name: company.name,
          duration_ms: durationMs,
          metadata: {
            job_id: job.id,
            post_id: String(post._id),
            platforms,
            post_type: postType,
            instagram_post_id: instagramPostId || undefined,
            facebook_post_id: facebookPostId || undefined,
          },
        },
      )

      console.log(`[PostWorker] Job ${job.id} completed successfully`)
      return { postId: post._id, status: 'published' }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido ao publicar'

      const durationMs = Date.now() - startedAt

      await LogService.error(
        'worker',
        'post.failed',
        `Falha ao publicar para ${company.name}: ${errorMessage}`,
        {
          company_id: companyId,
          company_name: company.name,
          duration_ms: durationMs,
          metadata: {
            job_id: job.id,
            queue_id: queueId,
            platforms,
            post_type: postType,
            attempts: job.attemptsMade,
            error: errorMessage,
          },
        },
      )

      // ── Create failed Post record ─────────
      await Post.create({
        company_id: companyId,
        queue_id: queueId,
        card_id: cardId,
        video_id: videoId || null,
        platforms,
        post_type: postType,
        caption,
        hashtags,
        status: PostStatus.Failed,
        error_message: errorMessage,
        retry_count: job.attemptsMade,
      })

      // ── Update queue status ───────────────
      await PostQueue.findByIdAndUpdate(queueId, {
        status: QueueStatus.Failed,
        retry_count: job.attemptsMade,
      })

      // ── Notify about failure ──────────────
      await NotificationService.create({
        target: 'company',
        company_id: companyId,
        type: 'post_failed',
        title: 'Falha ao publicar post',
        message: `Erro ao publicar: ${errorMessage}`,
        action_url: `/dashboard/posts`,
      })

      await NotificationService.create({
        target: 'admin',
        type: 'post_failed',
        title: `Post falhou - ${company.name}`,
        message: errorMessage,
        action_url: `/admin/logs`,
      })

      throw err
    }
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 60000, // max 10 jobs per minute
    },
  },
)

postWorker.on('completed', (job) => {
  console.log(`[PostWorker] Job ${job.id} completed`)
})

postWorker.on('failed', (job, err) => {
  console.error(`[PostWorker] Job ${job?.id} failed:`, err.message)
})

export default postWorker
