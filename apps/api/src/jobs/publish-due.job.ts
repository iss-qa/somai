import { PostQueue, Card, Post } from '@soma-ai/db'
import { QueueStatus, CardStatus, PostStatus } from '@soma-ai/shared'
import { MetaService } from '../services/meta.service'
import { LogService } from '../services/log.service'
import { ComunicacaoService } from '../services/comunicacao.service'

/**
 * Finds all PostQueue items past their scheduled_at that are still
 * "queued" and publishes them directly (no BullMQ dependency).
 *
 * Used by:
 * - GET /api/cron/publish-due (external cron service)
 * - Internal setInterval in server.ts (self-contained fallback)
 */
export async function publishDuePosts(
  limit = 10,
  companyId?: string,
): Promise<{
  processed: number
  results: Array<{ id: string; status: string; error?: string }>
}> {
  const now = new Date()

  const filter: Record<string, unknown> = {
    status: QueueStatus.Queued,
    scheduled_at: { $lte: now },
  }
  if (companyId) filter.company_id = companyId

  const duePosts = await PostQueue.find(filter)
    .populate('card_id')
    .limit(limit)
    .lean()

  if (duePosts.length === 0) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ id: string; status: string; error?: string }> = []

  for (const item of duePosts) {
    const queueId = String(item._id)
    const companyId = String(item.company_id)
    const card = item.card_id as any

    try {
      // Atomically mark as processing to avoid duplicate runs
      const claimed = await PostQueue.findOneAndUpdate(
        { _id: item._id, status: QueueStatus.Queued },
        { status: QueueStatus.Processing },
        { new: true },
      )
      if (!claimed) {
        // Another process already picked this up
        continue
      }

      const mediaType: 'image' | 'video' = card?.media_type === 'video' ? 'video' : 'image'
      const mediaUrl: string =
        mediaType === 'video'
          ? card?.generated_video_url || card?.generated_image_url || ''
          : card?.generated_image_url || ''
      const caption: string = item.caption || ''
      const hashtags: string[] = item.hashtags || []
      const fullCaption =
        hashtags.length > 0
          ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`
          : caption

      let instagramPostId = ''
      let facebookPostId = ''

      const isInstagram = item.platforms.includes('instagram')
      const isFacebook = item.platforms.includes('facebook')
      const postType = item.post_type

      if (isInstagram) {
        if (postType === 'stories') {
          const r = await MetaService.publishInstagramStory(companyId, mediaUrl, mediaType)
          instagramPostId = r.instagram_story_id
        } else if (postType === 'reels' || mediaType === 'video') {
          // Reels ou qualquer video vai pelo endpoint de Reels
          const r = await MetaService.publishInstagramReels(companyId, mediaUrl, fullCaption)
          instagramPostId = r.instagram_post_id
        } else if (postType === 'carousel' && card?.slide_image_urls?.length >= 2) {
          // Carrossel com multiplas imagens
          const r = await MetaService.publishInstagramCarousel(companyId, card.slide_image_urls, fullCaption)
          instagramPostId = r.instagram_post_id
        } else {
          // Feed regular (incluindo carousel com apenas 1 imagem — publica como feed)
          const r = await MetaService.publishInstagramFeed(companyId, mediaUrl, fullCaption)
          instagramPostId = r.instagram_post_id
        }
      }

      if (isFacebook) {
        // Facebook /photos so aceita imagem — para video usaria /videos, por enquanto so publica se imagem
        if (mediaType === 'image') {
          const r = await MetaService.publishFacebookPost(companyId, mediaUrl, fullCaption)
          facebookPostId = r.facebook_post_id
        } else {
          console.warn(`[PublishJob] Facebook video nao suportado ainda — pulando para ${queueId}`)
        }
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

      // WhatsApp notification: Card Publicado
      ComunicacaoService.enviarCardPublicado(
        companyId,
        card?.headline || card?.product_name || item.post_type,
        new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        item.platforms.join(', '),
      ).catch(() => {})

      await LogService.info(
        'post',
        'post.published',
        `Post publicado: ${item.post_type} em ${item.platforms.join(', ')}`,
        {
          company_id: companyId,
          metadata: { queueId, postType: item.post_type, platforms: item.platforms },
        },
      ).catch(() => {})
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido'
      console.error(`[PublishJob] Falha ao publicar ${queueId}:`, msg)

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
        metadata: {
          queueId,
          postType: item.post_type,
          platforms: item.platforms,
          error: msg,
          retryCount: newRetryCount,
        },
      }).catch(() => {})

      results.push({ id: queueId, status: 'failed', error: msg })
    }
  }

  return { processed: results.length, results }
}
