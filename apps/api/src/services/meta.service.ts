import { Integration } from '@soma-ai/db'
import { EncryptionService } from './encryption.service'
import { StorageService } from './storage.service'

const GRAPH_API = 'https://graph.facebook.com/v25.0'

async function getIntegration(companyId: string) {
  const integration: any = await Integration.findOne({ company_id: companyId }).lean()
  if (!integration?.meta?.access_token) {
    throw new Error('Meta integration nao configurada para esta empresa')
  }

  const token = EncryptionService.decrypt(integration.meta.access_token)

  return {
    token,
    igUserId: integration.meta.instagram_account_id as string,
    fbPageId: integration.meta.facebook_page_id as string,
  }
}

/**
 * Ensures media URL is a public HTTP URL.
 * If it's a base64 data URL, uploads it to R2 first.
 */
async function ensurePublicUrl(mediaUrl: string): Promise<string> {
  if (mediaUrl.startsWith('data:')) {
    return StorageService.uploadBase64Media(mediaUrl)
  }
  return mediaUrl
}

/**
 * Polls the Instagram media container until it's ready to publish (status FINISHED).
 * Videos podem levar mais tempo que imagens, por isso o maxAttempts e configuravel.
 */
async function waitForContainer(
  containerId: string,
  token: string,
  maxAttempts = 10,
  intervalMs = 2000,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`,
    )
    const data: any = await res.json()

    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new Error(`Container Instagram com status: ${data.status_code}`)
    }

    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Timeout aguardando container Instagram ficar pronto')
}

export class MetaService {
  /**
   * Publish a feed post to Instagram via Container API.
   */
  static async publishInstagramFeed(
    companyId: string,
    imageUrl: string,
    caption: string,
  ) {
    const { token, igUserId } = await getIntegration(companyId)
    const publicUrl = await ensurePublicUrl(imageUrl)

    // Step 1: Create media container
    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: publicUrl,
        caption,
        access_token: token,
      }),
    })
    const container: any = await containerRes.json()
    if (container.error) {
      throw new Error(`Erro ao criar container IG: ${container.error.message}`)
    }

    // Step 2: Wait for container to be ready
    await waitForContainer(container.id, token)

    // Step 3: Publish container
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    })
    const published: any = await publishRes.json()
    if (published.error) {
      throw new Error(`Erro ao publicar no Instagram: ${published.error.message}`)
    }

    console.log(`[MetaService] Instagram feed publicado: ${published.id}`)
    return {
      success: true,
      instagram_post_id: published.id as string,
      published_at: new Date(),
    }
  }

  /**
   * Publish a story to Instagram via Container API.
   * Detecta automaticamente se e imagem ou video pela extensao/MIME da URL.
   */
  static async publishInstagramStory(
    companyId: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' = 'image',
  ) {
    const { token, igUserId } = await getIntegration(companyId)
    const publicUrl = await ensurePublicUrl(mediaUrl)

    const isVideo = mediaType === 'video' || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(publicUrl)

    // Step 1: Create story container
    const body: Record<string, any> = {
      media_type: 'STORIES',
      access_token: token,
    }
    if (isVideo) {
      body.video_url = publicUrl
    } else {
      body.image_url = publicUrl
    }

    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const container: any = await containerRes.json()
    if (container.error) {
      throw new Error(`Erro ao criar container story: ${container.error.message}`)
    }

    // Step 2: Wait for container (videos levam mais tempo)
    await waitForContainer(container.id, token, isVideo ? 30 : 10, isVideo ? 3000 : 2000)

    // Step 3: Publish story
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    })
    const published: any = await publishRes.json()
    if (published.error) {
      throw new Error(`Erro ao publicar story: ${published.error.message}`)
    }

    console.log(`[MetaService] Instagram story publicado: ${published.id}`)
    return {
      success: true,
      instagram_story_id: published.id as string,
      published_at: new Date(),
    }
  }

  /**
   * Publish a Reels video to Instagram feed via Container API.
   * Tambem usado para posts de video no feed (Meta recomenda REELS para videos curtos).
   */
  static async publishInstagramReels(
    companyId: string,
    videoUrl: string,
    caption: string,
  ) {
    const { token, igUserId } = await getIntegration(companyId)
    const publicUrl = await ensurePublicUrl(videoUrl)

    // Step 1: Create REELS container
    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: publicUrl,
        caption,
        share_to_feed: true,
        access_token: token,
      }),
    })
    const container: any = await containerRes.json()
    if (container.error) {
      throw new Error(`Erro ao criar container Reels: ${container.error.message}`)
    }

    // Step 2: Wait for container (videos levam mais tempo — ate ~90s)
    await waitForContainer(container.id, token, 30, 3000)

    // Step 3: Publish
    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    })
    const published: any = await publishRes.json()
    if (published.error) {
      throw new Error(`Erro ao publicar Reels: ${published.error.message}`)
    }

    console.log(`[MetaService] Instagram Reels publicado: ${published.id}`)
    return {
      success: true,
      instagram_post_id: published.id as string,
      published_at: new Date(),
    }
  }

  /**
   * Publish a photo post to a Facebook Page.
   */
  static async publishFacebookPost(
    companyId: string,
    imageUrl: string,
    message: string,
  ) {
    const { token, fbPageId } = await getIntegration(companyId)
    const publicUrl = await ensurePublicUrl(imageUrl)

    const res = await fetch(`${GRAPH_API}/${fbPageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: publicUrl,
        caption: message,
        access_token: token,
      }),
    })
    const data: any = await res.json()
    if (data.error) {
      throw new Error(`Erro ao publicar no Facebook: ${data.error.message}`)
    }

    console.log(`[MetaService] Facebook post publicado: ${data.post_id || data.id}`)
    return {
      success: true,
      facebook_post_id: (data.post_id || data.id) as string,
      published_at: new Date(),
    }
  }

  /**
   * Verify if the Meta access token is still valid via debug_token.
   */
  static async verifyToken(companyId: string) {
    const integration: any = await Integration.findOne({ company_id: companyId }).lean()
    if (!integration?.meta?.access_token) {
      return { valid: false, expires_at: null }
    }

    const token = EncryptionService.decrypt(integration.meta.access_token)
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      // Can't verify without app credentials, assume valid
      return { valid: true, expires_at: integration.meta.token_expires_at || null }
    }

    const res = await fetch(
      `${GRAPH_API}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`,
    )
    const data: any = await res.json()

    if (data.error || !data.data?.is_valid) {
      return { valid: false, expires_at: null }
    }

    const expiresAt = data.data.expires_at
      ? new Date(data.data.expires_at * 1000)
      : null

    return { valid: true, expires_at: expiresAt }
  }

  /**
   * Fetch analytics for a specific post.
   */
  static async fetchPostAnalytics(companyId: string, postId: string) {
    const { token } = await getIntegration(companyId)

    const res = await fetch(
      `${GRAPH_API}/${postId}/insights?metric=impressions,reach,likes,comments,shares,saved&access_token=${token}`,
    )
    const data: any = await res.json()

    if (data.error) {
      console.warn(`[MetaService] Analytics indisponíveis para ${postId}: ${data.error.message}`)
      return { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, fetched_at: new Date() }
    }

    const metrics: Record<string, number> = {}
    for (const item of data.data || []) {
      metrics[item.name] = item.values?.[0]?.value ?? 0
    }

    return {
      impressions: metrics.impressions ?? 0,
      reach: metrics.reach ?? 0,
      likes: metrics.likes ?? 0,
      comments: metrics.comments ?? 0,
      shares: metrics.shares ?? 0,
      saves: metrics.saved ?? 0,
      fetched_at: new Date(),
    }
  }
}
