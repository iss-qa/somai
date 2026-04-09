import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company } from '@soma-ai/db'
import {
  BillingStatus,
  CompanyStatus,
  NotificationType,
} from '@soma-ai/shared'
import { authenticate, adminOnly } from '../../plugins/auth'
import { NotificationService } from '../../services/notification.service'

export default async function adminFinancialRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /summary ──────────────────────────────
  app.get('/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    const allCompanies = await Company.find({ status: { $ne: 'cancelled' } })
      .select(
        'name billing setup_paid setup_amount setup_paid_at plan_id status createdAt',
      )
      .populate('plan_id', 'name slug monthly_price')
      .lean()

    const paidCount = allCompanies.filter(
      (c) => c.billing?.status === 'paid',
    ).length
    const pendingCount = allCompanies.filter(
      (c) => c.billing?.status === 'pending' || c.billing?.status === 'pending_subscription',
    ).length
    const overdueCount = allCompanies.filter(
      (c) => c.billing?.status === 'overdue',
    ).length

    // Receita prevista = soma de todas mensalidades de empresas ativas
    const activeCompanies = allCompanies.filter(
      (c) => c.status === 'active' || c.status === 'trial',
    )
    const monthlyRevenue = activeCompanies.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    // Recebido = soma mensalidades das empresas com billing paid
    const paidCompanies = allCompanies.filter(
      (c) => c.billing?.status === 'paid',
    )
    const receivedRevenue = paidCompanies.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    // Setup recebido
    const setupPaidCompanies = allCompanies.filter((c) => c.setup_paid)
    const setupRevenue = setupPaidCompanies.reduce(
      (sum, c) => sum + (c.setup_amount || 0),
      0,
    )

    // Em atraso
    const overdueCompanies = allCompanies.filter(
      (c) => c.billing?.status === 'overdue',
    )
    const overdueAmount = overdueCompanies.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    // Distribuicao por plano (para grafico)
    const planDistribution: Record<string, { name: string; count: number; revenue: number }> = {}
    for (const c of activeCompanies) {
      const planName = (c.plan_id as any)?.name || 'Sem plano'
      if (!planDistribution[planName]) {
        planDistribution[planName] = { name: planName, count: 0, revenue: 0 }
      }
      planDistribution[planName].count++
      planDistribution[planName].revenue += c.billing?.monthly_amount || 0
    }

    // Receita por status (para grafico)
    const statusDistribution = [
      { name: 'Pago', value: receivedRevenue, count: paidCount },
      { name: 'Pendente', value: allCompanies.filter((c) => c.billing?.status === 'pending').reduce((s, c) => s + (c.billing?.monthly_amount || 0), 0), count: pendingCount },
      { name: 'Em atraso', value: overdueAmount, count: overdueCount },
    ]

    return reply.send({
      summary: {
        total_companies: allCompanies.length,
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
        monthly_revenue: monthlyRevenue,
        received_revenue: receivedRevenue,
        setup_revenue: setupRevenue,
        overdue_amount: overdueAmount,
      },
      plan_distribution: Object.values(planDistribution),
      status_distribution: statusDistribution,
    })
  })

  // ── GET /breakdown/receita — detalhes da receita prevista ──
  app.get('/breakdown/receita', async (_req, reply) => {
    const companies = await Company.find({
      status: { $in: ['active', 'trial'] },
    })
      .select('name billing plan_id')
      .populate('plan_id', 'name slug')
      .sort({ 'billing.monthly_amount': -1 })
      .lean()

    const items = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      plan: (c.plan_id as any)?.name || 'Sem plano',
      monthly_amount: c.billing?.monthly_amount || 0,
      due_day: c.billing?.due_day || 0,
      status: c.billing?.status || 'pending',
    }))

    const total = items.reduce((s, i) => s + i.monthly_amount, 0)

    return reply.send({ items, total })
  })

  // ── GET /breakdown/recebido — detalhes do valor recebido ──
  app.get('/breakdown/recebido', async (_req, reply) => {
    const companies = await Company.find({
      'billing.status': 'paid',
      status: { $ne: 'cancelled' },
    })
      .select('name billing plan_id')
      .populate('plan_id', 'name slug')
      .sort({ 'billing.last_paid_at': -1 })
      .lean()

    const items = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      plan: (c.plan_id as any)?.name || 'Sem plano',
      monthly_amount: c.billing?.monthly_amount || 0,
      last_paid_at: c.billing?.last_paid_at,
    }))

    const total = items.reduce((s, i) => s + i.monthly_amount, 0)

    return reply.send({ items, total })
  })

  // ── GET /breakdown/setup — detalhes dos setups recebidos ──
  app.get('/breakdown/setup', async (_req, reply) => {
    const companies = await Company.find({
      setup_paid: true,
      status: { $ne: 'cancelled' },
    })
      .select('name setup_amount setup_paid_at plan_id')
      .populate('plan_id', 'name slug')
      .sort({ setup_paid_at: -1 })
      .lean()

    const items = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      plan: (c.plan_id as any)?.name || 'Sem plano',
      setup_amount: c.setup_amount || 0,
      paid_at: c.setup_paid_at,
    }))

    const total = items.reduce((s, i) => s + i.setup_amount, 0)

    return reply.send({ items, total })
  })

  // ── GET /breakdown/atraso — detalhes dos em atraso ──
  app.get('/breakdown/atraso', async (_req, reply) => {
    const companies = await Company.find({
      'billing.status': 'overdue',
      status: { $ne: 'cancelled' },
    })
      .select('name billing plan_id')
      .populate('plan_id', 'name slug')
      .sort({ 'billing.overdue_days': -1 })
      .lean()

    const items = companies.map((c) => ({
      _id: c._id,
      name: c.name,
      plan: (c.plan_id as any)?.name || 'Sem plano',
      monthly_amount: c.billing?.monthly_amount || 0,
      overdue_days: c.billing?.overdue_days || 0,
      next_due_at: c.billing?.next_due_at,
    }))

    const total = items.reduce((s, i) => s + i.monthly_amount, 0)

    return reply.send({ items, total })
  })

  // ── GET /billing ──────────────────────────────
  app.get(
    '/billing',
    async (
      request: FastifyRequest<{
        Querystring: { status?: string; page?: string; limit?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { status, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {
        status: { $ne: 'cancelled' },
      }

      if (status) {
        query['billing.status'] = status
      }

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [companies, total] = await Promise.all([
        Company.find(query)
          .select(
            'name slug niche status access_enabled billing setup_paid setup_amount plan_id',
          )
          .populate('plan_id', 'name slug monthly_price')
          .sort({ 'billing.overdue_days': -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Company.countDocuments(query),
      ])

      return reply.send({
        companies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )

  // ── POST /billing/:id/confirm ─────────────────
  app.post(
    '/billing/:id/confirm',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params

      const company = await Company.findById(id)
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const now = new Date()

      // Calculate next due date
      const dueDay = company.billing?.due_day || 10
      let nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay)
      if (nextDue <= now) {
        nextDue = new Date(now.getFullYear(), now.getMonth() + 2, dueDay)
      }

      await Company.findByIdAndUpdate(id, {
        'billing.status': BillingStatus.Paid,
        'billing.last_paid_at': now,
        'billing.next_due_at': nextDue,
        'billing.overdue_days': 0,
        access_enabled: true,
        status: CompanyStatus.Active,
      })

      return reply.send({
        message: 'Pagamento confirmado',
        next_due_at: nextDue,
      })
    },
  )

  // ── POST /billing/:id/notify ──────────────────
  app.post(
    '/billing/:id/notify',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params

      const company: any = await Company.findById(id).lean()
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      await NotificationService.create({
        target: 'company',
        company_id: id,
        type: NotificationType.PaymentDue,
        title: 'Lembrete de pagamento',
        message: `Ola ${company.responsible_name}, sua fatura esta pendente. Regularize seu pagamento para continuar usando a plataforma.`,
        action_url: '/dashboard/billing',
      })

      return reply.send({
        message: `Lembrete de pagamento enviado para ${company.name}`,
      })
    },
  )
}
