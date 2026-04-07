import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Integration, Schedule, Plan } from '@soma-ai/db'
import { CompanyStatus } from '@soma-ai/shared'
import { authenticate, adminOnly } from '../plugins/auth'

export default async function companiesRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { role, companyId } = request.user!

    if (role === 'superadmin' || role === 'support') {
      const companies = await Company.find().populate('plan_id').sort({ createdAt: -1 }).lean()
      return reply.send({ companies })
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

  // ── POST / (admin only) ───────────────────────
  app.post<{
    Body: {
      name: string
      slug: string
      niche: string
      city: string
      state: string
      responsible_name: string
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
        access_enabled: false,
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

      // Create default schedule
      await Schedule.create({
        company_id: company._id,
        active: false,
        weekly_slots: [],
      })

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
        },
        { new: true },
      ).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      return reply.send({ ...company, message: 'Acesso desbloqueado' })
    },
  )
}
