import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Integration, Schedule, Plan, Gamificacao } from '@soma-ai/db'
import { CompanyStatus, PLAN_STARTER, PLAN_PRO, PLAN_ENTERPRISE } from '@soma-ai/shared'
import { authenticate, adminOnly } from '../plugins/auth'
import { StorageService } from '../services/storage.service'

export default async function companiesRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', authenticate)

  // ── GET /plans — List available plans ──────────
  app.get('/plans', async (_request: FastifyRequest, reply: FastifyReply) => {
    const plans = await Plan.find({ active: true }).sort({ monthly_price: 1 }).lean()
    return reply.send(plans)
  })

  // ── POST /plans/sync — admin only, upsert plans from shared constants ──
  app.post(
    '/plans/sync',
    { preHandler: [adminOnly] },
    async (_request, reply) => {
      const results = []
      for (const plan of [PLAN_STARTER, PLAN_PRO, PLAN_ENTERPRISE]) {
        const updated = await Plan.findOneAndUpdate(
          { slug: plan.slug },
          {
            slug: plan.slug,
            name: plan.name,
            setup_price: plan.setup_price,
            monthly_price: plan.monthly_price,
            features: { ...plan.features },
            active: true,
          },
          { upsert: true, new: true },
        )
        results.push({
          slug: updated.slug,
          name: updated.name,
          setup_price: updated.setup_price,
          monthly_price: updated.monthly_price,
        })
      }
      return reply.send({ success: true, plans: results })
    },
  )

  // ── GET / ─────────────────────────────────────
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { role, companyId } = request.user!

    if (role === 'superadmin' || role === 'support') {
      const companies: any[] = await Company.find()
        .populate('plan_id')
        .sort({ createdAt: -1 })
        .lean()

      // Join gamificacao (creditos) e integration (llm provider)
      const ids = companies.map((c) => c._id)
      const [gams, integrations] = await Promise.all([
        Gamificacao.find({ company_id: { $in: ids } })
          .select('company_id creditos creditosMes')
          .lean() as any,
        Integration.find({ company_id: { $in: ids } })
          .select('company_id ai.active ai.provider ai.model ai.usage.request_count ai.usage.total_tokens gemini.active')
          .lean() as any,
      ])

      const gamMap = new Map<string, any>()
      gams.forEach((g: any) => gamMap.set(String(g.company_id), g))
      const intMap = new Map<string, any>()
      integrations.forEach((i: any) => intMap.set(String(i.company_id), i))

      const enriched = companies.map((c) => {
        const g = gamMap.get(String(c._id))
        const i = intMap.get(String(c._id))
        let provider: string | null = null
        let model: string | null = null
        if (i?.ai?.active && i?.ai?.provider) {
          provider = i.ai.provider
          model = i.ai.model || null
        } else if (i?.gemini?.active) {
          provider = 'gemini'
          model = 'gemini-2.0-flash'
        } else if (process.env.GEMINI_API_KEY) {
          provider = 'gemini'
          model = 'gemini-2.0-flash'
        }
        return {
          ...c,
          ai_stats: {
            creditos: g?.creditos || 0,
            creditosMes: g?.creditosMes || 0,
            llm_provider: provider,
            llm_model: model,
            total_tokens: i?.ai?.usage?.total_tokens || 0,
            total_requests: i?.ai?.usage?.request_count || 0,
          },
        }
      })

      return reply.send({ companies: enriched })
    }

    if (!companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada para este usuario' })
    }

    const company = await Company.findById(companyId).populate('plan_id').lean()
    if (!company) {
      return reply.status(404).send({ error: 'Empresa nao encontrada' })
    }

    return reply.send({ companies: [company] })
  })

  // ── GET /:id ──────────────────────────────────
  app.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { role, companyId } = request.user!

      // Non-admin can only view their own company
      if (role !== 'superadmin' && role !== 'support' && companyId !== id) {
        return reply.status(403).send({ error: 'Sem permissao para acessar esta empresa' })
      }

      const company = await Company.findById(id).populate('plan_id').lean()
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send(company)
    },
  )

  // ── GET /:id/ai-stats ─ credits + LLM provider + token usage ─
  app.get(
    '/:id/ai-stats',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { role, companyId } = request.user!

      if (role !== 'superadmin' && role !== 'support' && companyId !== id) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      const [gam, integration] = await Promise.all([
        Gamificacao.findOne({ company_id: id })
          .select('creditos creditosMes promptsRefinados xp nivel')
          .lean() as any,
        Integration.findOne({ company_id: id })
          .select('ai gemini')
          .lean() as any,
      ])

      // Resolve provider/model ativo (mesma logica de ai.service.ts)
      let provider = 'gemini'
      let model = 'gemini-2.0-flash'
      let source: 'integration' | 'legacy' | 'env' = 'env'
      let configured = false

      if (integration?.ai?.active && integration?.ai?.provider && integration?.ai?.api_key) {
        provider = integration.ai.provider
        model = integration.ai.model || model
        source = 'integration'
        configured = true
      } else if (integration?.gemini?.api_key && integration?.gemini?.active) {
        provider = 'gemini'
        model = 'gemini-2.0-flash'
        source = 'legacy'
        configured = true
      } else if (process.env.GEMINI_API_KEY) {
        configured = true
      }

      const usage = integration?.ai?.usage || {
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
        total_tokens: 0,
        request_count: 0,
        monthly: [],
        last_used_at: null,
      }

      return reply.send({
        credits: {
          balance: gam?.creditos || 0,
          thisMonth: gam?.creditosMes || 0,
          promptsRefinados: gam?.promptsRefinados || 0,
          xp: gam?.xp || 0,
          nivel: gam?.nivel || 'INICIANTE',
        },
        llm: { provider, model, source, configured },
        tokens: {
          total: usage.total_tokens || 0,
          prompt: usage.total_prompt_tokens || 0,
          completion: usage.total_completion_tokens || 0,
          requests: usage.request_count || 0,
          lastUsedAt: usage.last_used_at || null,
          monthly: usage.monthly || [],
        },
      })
    },
  )

  // ── POST / (admin only) ───────────────────────
  app.post<{
    Body: {
      name: string
      slug: string
      niche: string
      city: string
      state: string
      responsible_name: string
      document?: string
      whatsapp: string
      email: string
      plan: string
      setupPaid?: boolean
      billingDay?: string
      logo_url?: string
      brand_colors?: { primary: string; secondary: string }
      notes?: string
    }
  }>(
    '/',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { plan, setupPaid, billingDay, ...rest } = request.body

      const planDoc = await Plan.findOne({ slug: plan })

      const company = await Company.create({
        ...rest,
        whatsapp: rest.whatsapp.replace(/\D/g, ''),
        plan_id: planDoc?._id ?? null,
        status: CompanyStatus.SetupPending,
        access_enabled: true,
        setup_paid: setupPaid ?? false,
        setup_amount: planDoc?.setup_price ?? 0,
        billing: {
          monthly_amount: planDoc?.monthly_price ?? 0,
          due_day: parseInt(billingDay ?? '10', 10),
          overdue_days: 0,
          status: 'pending',
        },
      })

      // Create default integration record
      await Integration.create({ company_id: company._id })

      // Inicializa gamificacao (25 creditos iniciais)
      try {
        const { GamificacaoService } = await import('../services/gamificacao.service')
        await (GamificacaoService as any).ensure(company._id)
      } catch (err) {
        console.warn('[companies.create] falha ao inicializar gamificacao:', err)
      }

      // Create default schedule
      await Schedule.create({
        company_id: company._id,
        active: false,
        weekly_slots: [],
      })

      // Send welcome message (fire-and-forget — don't block response)
      import('../services/comunicacao.service')
        .then(({ ComunicacaoService }) => ComunicacaoService.enviarBoasVindas(String(company._id)))
        .catch((err) => console.warn('[companies] WhatsApp welcome failed:', err))

      return reply.status(201).send(company)
    },
  )

  // ── PUT /:id ──────────────────────────────────
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
      const { role, companyId } = request.user!

      if (role !== 'superadmin' && role !== 'support' && companyId !== id) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      const company = await Company.findByIdAndUpdate(id, request.body, {
        new: true,
      }).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send(company)
    },
  )

  // ── POST /:id/logo ── upload de logo/avatar (base64 data URL) ──
  app.post(
    '/:id/logo',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: { dataUrl: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { role, companyId } = request.user!

      if (role !== 'superadmin' && role !== 'support' && companyId !== id) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      const { dataUrl } = request.body || {}
      if (!dataUrl?.startsWith('data:image/')) {
        return reply.status(400).send({ error: 'dataUrl invalido' })
      }

      try {
        const url = await StorageService.uploadBase64Media(dataUrl, 'logos')
        await Company.findByIdAndUpdate(id, { logo_url: url })
        return reply.send({ logo_url: url })
      } catch (err: any) {
        request.log.error(err, '[companies] upload logo falhou')
        return reply
          .status(500)
          .send({ error: err?.message || 'Erro ao enviar imagem' })
      }
    },
  )

  // ── POST /:id/block (admin only) ──────────────
  app.post<{ Params: { id: string } }>(
    '/:id/block',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { id } = request.params

      const company = await Company.findByIdAndUpdate(
        id,
        {
          access_enabled: false,
          status: CompanyStatus.Blocked,
        },
        { new: true },
      ).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send({ ...company, message: 'Acesso bloqueado' })
    },
  )

  // ── POST /:id/unblock (admin only) ────────────
  app.post<{ Params: { id: string } }>(
    '/:id/unblock',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { id } = request.params

      const company = await Company.findByIdAndUpdate(
        id,
        {
          access_enabled: true,
          status: CompanyStatus.Active,
          // Desbloquear implica acesso efetivo — limpa o trial para nao bloquear o frontend
          trial_expires_at: null,
        },
        { new: true },
      ).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send({ ...company, message: 'Acesso desbloqueado' })
    },
  )

  // ── POST /:id/release (admin only) ────────────
  // Libera acesso total, fazendo bypass de setup e assinatura mensal
  app.post<{ Params: { id: string } }>(
    '/:id/release',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { id } = request.params
      const now = new Date()

      const company = await Company.findByIdAndUpdate(
        id,
        {
          access_enabled: true,
          status: CompanyStatus.Active,
          setup_paid: true,
          setup_paid_at: now,
          trial_expires_at: null,
          'billing.status': 'paid',
          'billing.last_paid_at': now,
          'billing.overdue_days': 0,
        },
        { new: true },
      ).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send({ ...company, message: 'Acesso liberado' })
    },
  )
}
