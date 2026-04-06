import { Worker, Job } from 'bullmq'
import redis from '../plugins/redis'
import { Company, Card, Post, PostQueue } from '@soma-ai/db'
import { PostStatus, QueueStatus, CardStatus } from '@soma-ai/shared'
import { MetaService } from '../services/meta.service'
import { NotificationService } from '../services/notification.service'

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

    console.log(`[PostWorker] Processing job ${job.id} for company ${companyId}`)

    // ── Verify company access ───────────────
    const company: any = await Company.findById(companyId).lean()
    if (!company) {
      throw new Error(`Empresa nao encontrada: ${companyId}`)
    }
    if (!company.access_enabled || company.status === 'blocked') {
      // Update queue status to failed
      await PostQueue.findByIdAndUpdate(queueId, {
        status: QueueStatus.Failed,
      })
      throw new Error(`Acesso bloqueado para empresa: ${company.name}`)
    }

    // ── Update queue to processing ──────────
    await PostQueue.findByIdAndUpdate(queueId, {
      status: QueueStatus.Processing,
    })

    let instagramPostId = ''
    let facebookPostId = ''
    const fullCaption = `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`

    try {
      // ── Publish to each platform ──────────
      for (const platform of platforms) {
        if (platform === 'instagram_feed') {
          const result = await MetaService.publishInstagramFeed(
            companyId,
            imageUrl,
            fullCaption,
          )
          instagramPostId = result.instagram_post_id
        }

        if (platform === 'instagram_stories') {
          await MetaService.publishInstagramStory(companyId, imageUrl)
        }

        if (platform === 'facebook') {
          const result = await MetaService.publishFacebookPost(
            companyId,
            imageUrl,
            fullCaption,
          )
          facebookPostId = result.facebook_post_id
        }
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

      console.log(`[PostWorker] Job ${job.id} completed successfully`)
      return { postId: post._id, status: 'published' }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro desconhecido ao publicar'

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
