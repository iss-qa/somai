/**
 * Analisa um perfil do Instagram Business via Graph API para preencher
 * os campos do onboarding v2.0 (marca, público, identidade, estilo visual).
 *
 * Precondição: temos um access_token de Página do Facebook com
 * instagram_business_account vinculado — obtido no OAuth do onboarding.
 */

const GRAPH_VERSION = 'v25.0'

export interface InstagramProfileRaw {
  id: string
  username: string
  name?: string
  biography?: string
  profile_picture_url?: string
  followers_count?: number
  media_count?: number
  website?: string
  category?: string
}

export interface InstagramMediaItem {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

export interface InstagramSnapshot {
  igAccountId: string
  fbPageId: string
  fbPageName: string
  profile: InstagramProfileRaw
  media: InstagramMediaItem[]
}

export class InstagramAnalysisService {
  /**
   * Troca o `code` do OAuth pelo token de Página e retorna tudo que
   * precisamos pra análise. Usa o App Meta global da Soma (env).
   */
  static async connectWithCode(
    code: string,
    redirectUri: string,
  ): Promise<InstagramSnapshot & { pageAccessToken: string }> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      throw new Error(
        'META_APP_ID / META_APP_SECRET nao configurados no servidor',
      )
    }

    // 1. Troca code por short-lived token
    const tokenUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`
    const tokenRes = await fetch(tokenUrl)
    const tokenData: any = await tokenRes.json()
    if (tokenData.error) {
      throw new Error(tokenData.error.message || 'Falha ao trocar codigo')
    }
    const shortLived = tokenData.access_token as string

    // 2. Short-lived → long-lived (60d)
    const longUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${shortLived}`
    const longRes = await fetch(longUrl)
    const longData: any = await longRes.json()
    const userToken = (longData.access_token || shortLived) as string

    // 3. Pega páginas do usuário — filtra a primeira com IG vinculado
    const pagesUrl =
      `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts` +
      `?access_token=${userToken}` +
      `&fields=id,name,access_token,instagram_business_account`
    const pagesRes = await fetch(pagesUrl)
    const pagesData: any = await pagesRes.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error(
        'Nenhuma pagina encontrada. A conta Instagram precisa estar vinculada a uma Pagina do Facebook.',
      )
    }

    const page = pagesData.data.find((p: any) => p.instagram_business_account)
    if (!page) {
      throw new Error(
        'Nenhuma Pagina tem Instagram Business vinculado. Converta sua conta IG para Business ou Creator e vincule a uma Pagina.',
      )
    }

    const pageAccessToken = page.access_token as string
    const igAccountId = page.instagram_business_account.id as string

    // 4. Profile + últimos 12 posts (em paralelo)
    const [profile, media] = await Promise.all([
      this.fetchProfile(igAccountId, pageAccessToken),
      this.fetchRecentMedia(igAccountId, pageAccessToken, 12),
    ])

    return {
      igAccountId,
      fbPageId: page.id,
      fbPageName: page.name,
      pageAccessToken,
      profile,
      media,
    }
  }

  static async fetchProfile(
    igAccountId: string,
    pageAccessToken: string,
  ): Promise<InstagramProfileRaw> {
    const fields = [
      'id',
      'username',
      'name',
      'biography',
      'profile_picture_url',
      'followers_count',
      'media_count',
      'website',
    ].join(',')
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${igAccountId}?fields=${fields}&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data: any = await res.json()
    if (data.error) {
      throw new Error(data.error.message || 'Erro ao buscar perfil IG')
    }
    return data as InstagramProfileRaw
  }

  static async fetchRecentMedia(
    igAccountId: string,
    pageAccessToken: string,
    limit = 12,
  ): Promise<InstagramMediaItem[]> {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'like_count',
      'comments_count',
    ].join(',')
    const url =
      `https://graph.facebook.com/${GRAPH_VERSION}/${igAccountId}/media` +
      `?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data: any = await res.json()
    if (data.error) {
      throw new Error(data.error.message || 'Erro ao buscar midias IG')
    }
    return (data.data || []) as InstagramMediaItem[]
  }
}
