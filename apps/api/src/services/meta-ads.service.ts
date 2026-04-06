/**
 * Meta Ads (Marketing API) Service
 * Handles creating and managing ad campaigns on Facebook/Instagram
 */

import { Integration } from '@soma-ai/db'
import { EncryptionService } from './encryption.service'

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

interface AdAccount {
  id: string
  name: string
  currency: string
  account_status: number
}

interface ReachEstimate {
  daily_reach_min: number
  daily_reach_max: number
}

interface CampaignResult {
  campaign_id: string
  adset_id: string
  ad_id: string
}

interface CampaignMetrics {
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  spend: number
}

interface Targeting {
  locations: { city: string; state: string; radius_km: number }[]
  age_min: number
  age_max: number
  genders: string[]
  interests: { id: string; name: string }[]
}

// Meta Ads objective mapping
const OBJECTIVE_MAP: Record<string, string> = {
  awareness: 'OUTCOME_AWARENESS',
  traffic: 'OUTCOME_TRAFFIC',
  engagement: 'OUTCOME_ENGAGEMENT',
  leads: 'OUTCOME_LEADS',
  sales: 'OUTCOME_SALES',
  messages: 'OUTCOME_ENGAGEMENT',
  local_store: 'OUTCOME_AWARENESS',
}

export class MetaAdsService {
  /**
   * Get Meta Ads access token for a company
   */
  static async getToken(companyId: string): Promise<{
    token: string
    adAccountId: string
    pageId: string
  } | null> {
    const integration: any = await Integration.findOne({
      company_id: companyId,
    }).lean()

    if (!integration?.meta_ads?.ad_account_id || !integration?.meta?.access_token) {
      return null
    }

    try {
      const token = EncryptionService.decrypt(integration.meta.access_token)
      return {
        token,
        adAccountId: integration.meta_ads.ad_account_id,
        pageId: integration.meta.facebook_page_id || '',
      }
    } catch {
      return null
    }
  }

  /**
   * List ad accounts for a user token
   */
  static async listAdAccounts(accessToken: string): Promise<AdAccount[]> {
    const res = await fetch(
      `${META_GRAPH_URL}/me/adaccounts?fields=id,name,currency,account_status&access_token=${accessToken}`,
    )

    if (!res.ok) {
      throw new Error(`Meta API error: ${res.status}`)
    }

    const data = await res.json()
    return data.data || []
  }

  /**
   * Create a full campaign (campaign + adset + ad)
   */
  static async createCampaign(params: {
    accessToken: string
    adAccountId: string
    pageId: string
    name: string
    objective: string
    targeting: Targeting
    dailyBudget: number
    startDate: string
    endDate: string
    imageUrl?: string
    videoUrl?: string
    adCopy: string
    headline: string
    ctaType: string
    destinationUrl: string
  }): Promise<CampaignResult> {
    const metaObjective = OBJECTIVE_MAP[params.objective] || 'OUTCOME_TRAFFIC'

    // 1. Create Campaign
    const campaignRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Soma.ai — ${params.name}`,
          objective: metaObjective,
          status: 'PAUSED',
          special_ad_categories: [],
          access_token: params.accessToken,
        }),
      },
    )

    if (!campaignRes.ok) {
      const err = await campaignRes.text()
      throw new Error(`Erro ao criar campanha Meta: ${err}`)
    }

    const campaign = await campaignRes.json()
    const campaignId = campaign.id

    // 2. Build targeting spec
    const targetingSpec: any = {
      age_min: params.targeting.age_min,
      age_max: params.targeting.age_max,
    }

    if (params.targeting.genders?.length && !params.targeting.genders.includes('all')) {
      targetingSpec.genders = params.targeting.genders.map((g) =>
        g === 'male' ? 1 : 2,
      )
    }

    if (params.targeting.locations?.length) {
      targetingSpec.geo_locations = {
        cities: params.targeting.locations.map((loc) => ({
          key: loc.city,
          radius: loc.radius_km,
          distance_unit: 'kilometer',
        })),
      }
    }

    if (params.targeting.interests?.length) {
      targetingSpec.interests = params.targeting.interests.map((i) => ({
        id: i.id,
        name: i.name,
      }))
    }

    // 3. Create Ad Set
    const adsetRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/adsets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: `Conjunto — ${params.name}`,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'LINK_CLICKS',
          daily_budget: Math.round(params.dailyBudget * 100), // Centavos
          start_time: params.startDate,
          end_time: params.endDate,
          targeting: targetingSpec,
          status: 'PAUSED',
          access_token: params.accessToken,
        }),
      },
    )

    if (!adsetRes.ok) {
      const err = await adsetRes.text()
      throw new Error(`Erro ao criar conjunto de anuncios: ${err}`)
    }

    const adset = await adsetRes.json()
    const adsetId = adset.id

    // 4. Create Ad Creative
    const creativeBody: any = {
      name: `Criativo — ${params.headline}`,
      object_story_spec: {
        page_id: params.pageId,
        link_data: {
          link: params.destinationUrl,
          message: params.adCopy,
          name: params.headline,
          call_to_action: {
            type: params.ctaType,
            value: { link: params.destinationUrl },
          },
        },
      },
      access_token: params.accessToken,
    }

    if (params.imageUrl) {
      creativeBody.object_story_spec.link_data.image_url = params.imageUrl
    }

    const creativeRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/adcreatives`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeBody),
      },
    )

    if (!creativeRes.ok) {
      const err = await creativeRes.text()
      throw new Error(`Erro ao criar criativo: ${err}`)
    }

    const creative = await creativeRes.json()

    // 5. Create Ad
    const adRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/ads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adset_id: adsetId,
          creative: { creative_id: creative.id },
          name: `Anuncio — ${params.name}`,
          status: 'PAUSED',
          access_token: params.accessToken,
        }),
      },
    )

    if (!adRes.ok) {
      const err = await adRes.text()
      throw new Error(`Erro ao criar anuncio: ${err}`)
    }

    const ad = await adRes.json()

    return {
      campaign_id: campaignId,
      adset_id: adsetId,
      ad_id: ad.id,
    }
  }

  /**
   * Update campaign status (ACTIVE / PAUSED)
   */
  static async updateCampaignStatus(
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED',
    accessToken: string,
  ): Promise<void> {
    await fetch(`${META_GRAPH_URL}/${campaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, access_token: accessToken }),
    })
  }

  /**
   * Fetch campaign metrics/insights
   */
  static async fetchMetrics(
    campaignId: string,
    accessToken: string,
  ): Promise<CampaignMetrics> {
    const res = await fetch(
      `${META_GRAPH_URL}/${campaignId}/insights?fields=impressions,reach,clicks,ctr,cpc,cpm,conversions,spend&access_token=${accessToken}`,
    )

    if (!res.ok) {
      return {
        impressions: 0,
        reach: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        conversions: 0,
        spend: 0,
      }
    }

    const data = await res.json()
    const insight = data.data?.[0] || {}

    return {
      impressions: parseInt(insight.impressions || '0'),
      reach: parseInt(insight.reach || '0'),
      clicks: parseInt(insight.clicks || '0'),
      ctr: parseFloat(insight.ctr || '0'),
      cpc: parseFloat(insight.cpc || '0'),
      cpm: parseFloat(insight.cpm || '0'),
      conversions: parseInt(insight.conversions || '0'),
      spend: parseFloat(insight.spend || '0'),
    }
  }

  /**
   * Estimate reach for a given targeting + budget
   */
  static async estimateReach(params: {
    adAccountId: string
    targeting: Targeting
    dailyBudget: number
    accessToken: string
  }): Promise<ReachEstimate> {
    // Build targeting spec
    const targetingSpec: any = {
      age_min: params.targeting.age_min,
      age_max: params.targeting.age_max,
    }

    if (params.targeting.interests?.length) {
      targetingSpec.interests = params.targeting.interests
    }

    // Estimate based on budget heuristics (fallback)
    // Average CPM in Brazil: R$5-15
    const avgCpm = 10
    const dailyImpressions = (params.dailyBudget / avgCpm) * 1000
    const dailyReach = dailyImpressions * 0.6 // ~60% unique

    return {
      daily_reach_min: Math.round(dailyReach * 0.7),
      daily_reach_max: Math.round(dailyReach * 1.3),
    }
  }

  /**
   * Search interests for targeting
   */
  static async searchInterests(
    query: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; audience_size: number }[]> {
    const res = await fetch(
      `${META_GRAPH_URL}/search?type=adinterest&q=${encodeURIComponent(query)}&access_token=${accessToken}`,
    )

    if (!res.ok) return []

    const data = await res.json()
    return (data.data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      audience_size: item.audience_size || 0,
    }))
  }
}
