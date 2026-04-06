import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Campaign, Card, Video, Company } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { GeminiVideoService } from '../services/gemini-video.service'
import { MetaAdsService } from '../services/meta-ads.service'

export default async function campaignsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / — List campaigns ────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          status?: string
          type?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { status, type, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {}

      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (status) query.status = status
      if (type) query.type = type

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [campaigns, total] = await Promise.all([
        Campaign.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Campaign.countDocuments(query),
      ])

      return reply.send({
        campaigns,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )

  // ── GET /:id — Campaign detail ────────────────
  app.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const campaign: any = await Campaign.findById(id)
        .populate('card_ids', 'headline subtext generated_image_url format status')
        .populate('video_ids', 'title thumbnail_url video_url status template')
        .populate('script_ids')
        .lean()

      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(campaign.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      return reply.send({ campaign })
    },
  )

  // ── POST / — Create campaign (draft) ──────────
  app.post(
    '/',
    async (
      request: FastifyRequest<{
        Body: {
          name: string
          description?: string
          type?: string

          // Content
          card_ids?: string[]
          video_ids?: string[]
          ad_copy?: string
          cta_type?: string
          destination_url?: string

          // Targeting
          targeting?: {
            locations?: { city: string; state: string; radius_km: number }[]
            age_min?: number
            age_max?: number
            genders?: string[]
            interests?: { id: string; name: string }[]
          }

          // Budget
          budget?: {
            daily_amount?: number
          }

          // Period
          start_date?: string
          end_date?: string
          duration_days?: number

          // Platforms
          platforms?: {
            meta_ads?: {
              enabled?: boolean
              placements?: string[]
            }
            google_ads?: {
              enabled?: boolean
              campaign_types?: string[]
              keywords?: string[]
            }
          }
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, userId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body

      if (!body.name) {
        return reply
          .status(400)
          .send({ error: 'Nome da campanha e obrigatorio' })
      }

      // Calculate duration and total budget
      let durationDays = body.duration_days || 7
      let startDate = body.start_date ? new Date(body.start_date) : null
      let endDate = body.end_date ? new Date(body.end_date) : null

      if (startDate && endDate) {
        durationDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      } else if (startDate && durationDays) {
        endDate = new Date(
          startDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
        )
      }

      const dailyAmount = body.budget?.daily_amount || 0
      const totalAmount = dailyAmount * durationDays

      // Estimate reach
      let estimates = {
        daily_reach_min: 0,
        daily_reach_max: 0,
        total_reach_min: 0,
        total_reach_max: 0,
      }

      if (dailyAmount > 0) {
        const avgCpm = 10 // Average CPM in Brazil
        const dailyImpressions = (dailyAmount / avgCpm) * 1000
        const dailyReach = dailyImpressions * 0.6
        estimates = {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * durationDays),
          total_reach_max: Math.round(dailyReach * 1.3 * durationDays),
        }
      }

      const campaign = await Campaign.create({
        company_id: companyId,
        name: body.name,
        description: body.description || '',
        type: body.type || 'traffic',
        status: 'draft',

        card_ids: body.card_ids || [],
        video_ids: body.video_ids || [],
        script_ids: [],
        post_ids: [],
        ad_copy: body.ad_copy || '',
        cta_type: body.cta_type || 'LEARN_MORE',
        destination_url: body.destination_url || '',

        targeting: {
          locations: body.targeting?.locations || [],
          age_min: body.targeting?.age_min || 18,
          age_max: body.targeting?.age_max || 65,
          genders: body.targeting?.genders || ['all'],
          interests: body.targeting?.interests || [],
          custom_audience_id: '',
        },

        budget: {
          daily_amount: dailyAmount,
          total_amount: totalAmount,
          currency: 'BRL',
        },

        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,

        platforms: {
          meta_ads: {
            enabled: body.platforms?.meta_ads?.enabled || false,
            placements: body.platforms?.meta_ads?.placements || [],
            campaign_id: '',
            adset_id: '',
            ad_ids: [],
            status: '',
          },
          google_ads: {
            enabled: body.platforms?.google_ads?.enabled || false,
            campaign_types: body.platforms?.google_ads?.campaign_types || [],
            campaign_id: '',
            ad_group_id: '',
            ad_ids: [],
            keywords: body.platforms?.google_ads?.keywords || [],
            status: '',
          },
        },

        estimates,
        created_by: userId || null,
      })

      return reply.status(201).send({ campaign })
    },
  )

  // ── PUT /:id — Update campaign ────────────────
  app.put(
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

      const existing: any = await Campaign.findById(id).lean()
      if (!existing) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(existing.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      // Only allow editing draft or paused campaigns
      if (!['draft', 'paused'].includes(existing.status)) {
        return reply.status(400).send({
          error: 'Apenas campanhas em rascunho ou pausadas podem ser editadas',
        })
      }

      const { company_id, _id, ...updateData } = request.body as any

      // Recalculate estimates if budget changed
      if (updateData.budget?.daily_amount) {
        const days = updateData.duration_days || existing.duration_days || 7
        updateData.budget.total_amount = updateData.budget.daily_amount * days

        const avgCpm = 10
        const dailyImpressions = (updateData.budget.daily_amount / avgCpm) * 1000
        const dailyReach = dailyImpressions * 0.6
        updateData.estimates = {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * days),
          total_reach_max: Math.round(dailyReach * 1.3 * days),
        }
      }

      const campaign = await Campaign.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean()

      return reply.send({ campaign })
    },
  )

  // ── POST /:id/publish — Publish campaign ──────
  app.post(
    '/:id/publish',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (campaign.status !== 'draft' && campaign.status !== 'review') {
        return reply.status(400).send({
          error: 'Apenas campanhas em rascunho podem ser publicadas',
        })
      }

      // Validate required fields
      if (!campaign.card_ids?.length && !campaign.video_ids?.length) {
        return reply.status(400).send({
          error: 'Selecione pelo menos um card ou video para a campanha',
        })
      }

      if (!campaign.budget?.daily_amount || campaign.budget.daily_amount < 6) {
        return reply.status(400).send({
          error: 'Orcamento diario minimo e R$ 6,00',
        })
      }

      // Try to publish on Meta Ads if enabled
      let metaResult = null
      if (campaign.platforms?.meta_ads?.enabled) {
        try {
          const meta = await MetaAdsService.getToken(companyId!)
          if (meta) {
            // Get first card image for creative
            let imageUrl = ''
            if (campaign.card_ids?.length) {
              const card: any = await Card.findById(campaign.card_ids[0]).lean()
              imageUrl = card?.generated_image_url || ''
            }

            metaResult = await MetaAdsService.createCampaign({
              accessToken: meta.token,
              adAccountId: meta.adAccountId,
              pageId: meta.pageId,
              name: campaign.name,
              objective: campaign.type,
              targeting: campaign.targeting,
              dailyBudget: campaign.budget.daily_amount,
              startDate:
                campaign.start_date?.toISOString() || new Date().toISOString(),
              endDate:
                campaign.end_date?.toISOString() ||
                new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              imageUrl,
              adCopy: campaign.ad_copy,
              headline: campaign.name,
              ctaType: campaign.cta_type,
              destinationUrl: campaign.destination_url,
            })
          }
        } catch (err: any) {
          // Don't block campaign creation, just log the error
          console.error('Meta Ads publish error:', err.message)
        }
      }

      // Update campaign status
      const updateData: any = {
        status: 'active',
        published_at: new Date(),
      }

      if (metaResult) {
        updateData['platforms.meta_ads.campaign_id'] = metaResult.campaign_id
        updateData['platforms.meta_ads.adset_id'] = metaResult.adset_id
        updateData['platforms.meta_ads.ad_ids'] = [metaResult.ad_id]
        updateData['platforms.meta_ads.status'] = 'ACTIVE'
      }

      const updated = await Campaign.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean()

      return reply.send({
        campaign: updated,
        meta_ads: metaResult
          ? { status: 'published', ...metaResult }
          : { status: 'skipped' },
      })
    },
  )

  // ── POST /:id/pause — Pause campaign ──────────
  app.post(
    '/:id/pause',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (campaign.status !== 'active') {
        return reply.status(400).send({ error: 'Campanha nao esta ativa' })
      }

      // Pause on Meta Ads
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId!)
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              'PAUSED',
              meta.token,
            )
          }
        } catch {
          // Continue even if Meta API fails
        }
      }

      const updated = await Campaign.findByIdAndUpdate(
        id,
        { status: 'paused', 'platforms.meta_ads.status': 'PAUSED' },
        { new: true },
      ).lean()

      return reply.send({ campaign: updated })
    },
  )

  // ── POST /:id/resume — Resume campaign ────────
  app.post(
    '/:id/resume',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (campaign.status !== 'paused') {
        return reply.status(400).send({ error: 'Campanha nao esta pausada' })
      }

      // Resume on Meta Ads
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId!)
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              'ACTIVE',
              meta.token,
            )
          }
        } catch {
          // Continue
        }
      }

      const updated = await Campaign.findByIdAndUpdate(
        id,
        { status: 'active', 'platforms.meta_ads.status': 'ACTIVE' },
        { new: true },
      ).lean()

      return reply.send({ campaign: updated })
    },
  )

  // ── POST /:id/complete — End campaign ─────────
  app.post(
    '/:id/complete',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      // Pause all ads
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId!)
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              'PAUSED',
              meta.token,
            )
          }
        } catch {
          // Continue
        }
      }

      const updated = await Campaign.findByIdAndUpdate(
        id,
        {
          status: 'completed',
          completed_at: new Date(),
          'platforms.meta_ads.status': 'PAUSED',
        },
        { new: true },
      ).lean()

      return reply.send({ campaign: updated })
    },
  )

  // ── GET /:id/metrics — Fetch latest metrics ───
  app.get(
    '/:id/metrics',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      // Try to fetch fresh metrics from Meta Ads
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId!)
          if (meta) {
            const metrics = await MetaAdsService.fetchMetrics(
              campaign.platforms.meta_ads.campaign_id,
              meta.token,
            )

            // Update stored metrics
            await Campaign.findByIdAndUpdate(id, {
              'metrics.impressions': metrics.impressions,
              'metrics.reach': metrics.reach,
              'metrics.clicks': metrics.clicks,
              'metrics.ctr': metrics.ctr,
              'metrics.cpc': metrics.cpc,
              'metrics.cpm': metrics.cpm,
              'metrics.conversions': metrics.conversions,
              'metrics.total_spent': metrics.spend,
              'metrics.last_synced_at': new Date(),
            })

            return reply.send({ metrics, source: 'live' })
          }
        } catch {
          // Fall through to cached metrics
        }
      }

      return reply.send({
        metrics: campaign.metrics,
        source: 'cached',
      })
    },
  )

  // ── POST /estimate-reach — Reach estimation ───
  app.post(
    '/estimate-reach',
    async (
      request: FastifyRequest<{
        Body: {
          daily_amount: number
          duration_days: number
          targeting?: {
            age_min?: number
            age_max?: number
            interests?: { id: string; name: string }[]
          }
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { daily_amount, duration_days, targeting } = request.body

      if (!daily_amount || daily_amount < 1) {
        return reply.status(400).send({ error: 'Orcamento diario invalido' })
      }

      // Heuristic-based estimation
      const avgCpm = 10
      const dailyImpressions = (daily_amount / avgCpm) * 1000
      const dailyReach = dailyImpressions * 0.6
      const days = duration_days || 7

      return reply.send({
        estimates: {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * days),
          total_reach_max: Math.round(dailyReach * 1.3 * days),
          daily_impressions: Math.round(dailyImpressions),
          total_impressions: Math.round(dailyImpressions * days),
          estimated_cpc: Math.round((daily_amount / (dailyImpressions * 0.025)) * 100) / 100,
        },
        budget: {
          daily: daily_amount,
          total: daily_amount * days,
          currency: 'BRL',
        },
      })
    },
  )

  // ── POST /suggest-interests — AI suggestions ──
  app.post(
    '/suggest-interests',
    async (
      request: FastifyRequest<{
        Body: { campaign_type?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const company: any = await Company.findById(companyId).lean()
      const campaignType = request.body.campaign_type || 'traffic'

      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId)

        const interests = await GeminiVideoService.suggestInterests({
          niche: company?.niche || 'outro',
          campaignType,
          apiKey,
        })

        return reply.send({ interests })
      } catch (err: any) {
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao sugerir interesses' })
      }
    },
  )

  // ── POST /generate-copy — AI ad copy ──────────
  app.post(
    '/generate-copy',
    async (
      request: FastifyRequest<{
        Body: {
          card_id?: string
          campaign_type?: string
          destination_url?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const company: any = await Company.findById(companyId).lean()
      const body = request.body

      let headline = ''
      let subtext = ''

      if (body.card_id) {
        const card: any = await Card.findById(body.card_id).lean()
        if (card) {
          headline = card.headline
          subtext = card.subtext
        }
      }

      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId)

        const copy = await GeminiVideoService.generateAdCopy({
          cardHeadline: headline,
          cardSubtext: subtext,
          companyName: company?.name || 'Empresa',
          niche: company?.niche || 'outro',
          campaignType: body.campaign_type || 'traffic',
          destinationUrl: body.destination_url || '',
          apiKey,
        })

        return reply.send(copy)
      } catch (err: any) {
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao gerar copy' })
      }
    },
  )

  // ── DELETE /:id — Delete campaign ─────────────
  app.delete(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const campaign: any = await Campaign.findById(id).lean()
      if (!campaign) {
        return reply.status(404).send({ error: 'Campanha nao encontrada' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(campaign.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      if (campaign.status === 'active') {
        return reply.status(400).send({
          error: 'Encerre a campanha antes de deletar',
        })
      }

      await Campaign.findByIdAndDelete(id)

      return reply.send({ message: 'Campanha removida' })
    },
  )
}
