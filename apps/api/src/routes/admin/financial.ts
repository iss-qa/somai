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
    const [
      totalCompanies,
      paidCount,
      pendingCount,
      overdueCount,
      allActive,
    ] = await Promise.all([
      Company.countDocuments({ status: { $ne: 'cancelled' } }),
      Company.countDocuments({ 'billing.status': BillingStatus.Paid }),
      Company.countDocuments({ 'billing.status': BillingStatus.Pending }),
      Company.countDocuments({ 'billing.status': BillingStatus.Overdue }),
      Company.find({ status: CompanyStatus.Active })
        .select('billing.monthly_amount setup_amount setup_paid')
        .lean(),
    ])

    const monthlyRevenue = allActive.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    const setupRevenue = allActive
      .filter((c) => c.setup_paid)
      .reduce((sum, c) => sum + (c.setup_amount || 0), 0)

    return reply.send({
      summary: {
        total_companies: totalCompanies,
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
        monthly_revenue: monthlyRevenue,
        setup_revenue: setupRevenue,
      },
    })
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
