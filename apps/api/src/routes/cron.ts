import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PostQueue, Card, Post } from '@soma-ai/db'
import { QueueStatus, CardStatus, PostStatus } from '@soma-ai/shared'
import { MetaService } from '../services/meta.service'
import { LogService } from '../services/log.service'

export default async function cronRoutes(app: FastifyInstance) {
  /**
   * GET /api/cron/publish-due
   * Called by cron-job.org every minute.
   * Finds all queued posts past their scheduled_at and publishes them.
   */
  app.get(
    '/publish-due',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const secret = process.env.CRON_SECRET
      const header = (request.headers['x-cron-secret'] as string) || ''

      if (secret && header !== secret) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const now = new Date()

      // Find up to 10 posts due for publishing
      const duePosts = await PostQueue.find({
        status: QueueStatus.Queued,
        scheduled_at: { $lte: now },
      })
        .populate('card_id')
        .limit(10)
        .lean()

      if (duePosts.length === 0) {
        return reply.send({ processed: 0, results: [] })
      }

      const results: Array<{ id: string; status: string; error?: string }> = []

      for (const item of duePosts) {
        const queueId = String(item._id)
        const companyId = String(item.company_id)
        const card = item.card_id as any

        try {
          // Mark as processing
          await PostQueue.findByIdAndUpdate(queueId, { status: QueueStatus.Processing })

          const imageUrl: string = card?.generated_image_url || ''
          const caption: string = item.caption || ''
          const hashtags: string[] = item.hashtags || []
          const fullCaption = hashtags.length > 0
            ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
            : caption

          let instagramPostId = ''
          let facebookPostId = ''

          // platforms stored as ['instagram'], ['facebook'], ['instagram','facebook']
          // post_type stored as 'feed', 'stories', 'reels'
          const isInstagram = item.platforms.includes('instagram')
          const isFacebook = item.platforms.includes('facebook')
          const postType = item.post_type

          if (isInstagram) {
            if (postType === 'stories') {
              await MetaService.publishInstagramStory(companyId, imageUrl)
            } else {
              // feed or reels → use feed container API
              const r = await MetaService.publishInstagramFeed(companyId, imageUrl, fullCaption)
              instagramPostId = r.instagram_post_id
            }
          }
          if (isFacebook) {
            const r = await MetaService.publishFacebookPost(companyId, imageUrl, fullCaption)
            facebookPostId = r.facebook_post_id
          }

          // Create Post record
          const post = await Post.create({
            company_id: companyId,
            queue_id: queueId,
            card_id: card?._id || item.card_id,
            platforms: item.platforms,
            post_type: item.post_type,
            caption,
            hashtags,
            status: PostStatus.Published,
            published_at: new Date(),
            instagram_post_id: instagramPostId,
            facebook_post_id: facebookPostId,
          })

          await PostQueue.findByIdAndUpdate(queueId, { status: QueueStatus.Done })
          await Card.findByIdAndUpdate(card?._id || item.card_id, {
            status: CardStatus.Posted,
            post_id: post._id,
          })

          results.push({ id: queueId, status: 'published' })
          console.log(`[Cron] Publicado: ${queueId}`)
          await LogService.info('post', 'post.published', `Post publicado via cron: ${item.post_type} em ${item.platforms.join(', ')}`, {
            company_id: companyId,
            metadata: { queueId, postType: item.post_type, platforms: item.platforms },
          }).catch(() => {})
        } catch (err: any) {
          const msg = err.message || 'Erro desconhecido'
          console.error(`[Cron] Falha ao publicar ${queueId}:`, msg)

          await Post.create({
            company_id: companyId,
            queue_id: queueId,
            card_id: card?._id || item.card_id,
            platforms: item.platforms,
            post_type: item.post_type,
            caption: item.caption,
            hashtags: item.hashtags,
            status: PostStatus.Failed,
            error_message: msg,
          }).catch(() => {})

          const newRetryCount = (item.retry_count || 0) + 1
          const maxRetries = item.max_retries || 3
          await PostQueue.findByIdAndUpdate(queueId, {
            status: newRetryCount < maxRetries ? QueueStatus.Queued : QueueStatus.Failed,
            retry_count: newRetryCount,
          })

          await LogService.error('post', 'post.failed', `Falha ao publicar: ${msg}`, {
            company_id: companyId,
            metadata: { queueId, postType: item.post_type, platforms: item.platforms, error: msg, retryCount: newRetryCount },
          }).catch(() => {})

          results.push({ id: queueId, status: 'failed', error: msg })
        }
      }

      return reply.send({ processed: results.length, results })
    },
  )
}
