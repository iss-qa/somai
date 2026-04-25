import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Post, Notification, Gamificacao } from '@soma-ai/db'
import { PostStatus } from '@soma-ai/shared'
import { authenticate, adminOnly } from '../../plugins/auth'

const CREDITOS_BAIXOS_LIMITE = 10

export default async function adminDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /summary ──────────────────────────────
  app.get('/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Count by status
    const [
      activeCount,
      trialCount,
      setupPendingCount,
      pendingSubCount,
      blockedCount,
      cancelledCount,
      overdueCount,
      allCompanies,
      postsToday,
      failedPostsToday,
    ] = await Promise.all([
      Company.countDocuments({ status: 'active' }),
      Company.countDocuments({ status: 'trial' }),
      Company.countDocuments({ status: 'setup_pending' }),
      Company.countDocuments({ status: 'pending_subscription' }),
      Company.countDocuments({ status: 'blocked' }),
      Company.countDocuments({ status: 'cancelled' }),
      Company.countDocuments({ 'billing.status': 'overdue' }),
      Company.find({
        status: { $in: ['active', 'trial', 'pending_subscription'] },
      })
        .select('billing.monthly_amount')
        .lean(),
      Post.countDocuments({
        status: PostStatus.Published,
        published_at: { $gte: todayStart, $lte: todayEnd },
      }),
      Post.countDocuments({
        status: PostStatus.Failed,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
    ])

    // Monthly revenue from active + trial companies
    const monthlyRevenue = allCompanies.reduce(
      (sum, c: any) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    // Alerts
    const alerts = await Notification.find({
      target: 'admin',
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const formattedAlerts = alerts.map((a: any) => ({
      id: String(a._id),
      title: a.title || a.type,
      description: a.message,
      level:
        a.type?.includes('failed') || a.type?.includes('blocked')
          ? 'critical'
          : a.type?.includes('overdue') || a.type?.includes('pending')
            ? 'warning'
            : a.type?.includes('received') || a.type?.includes('completed')
              ? 'success'
              : 'info',
      timestamp: a.createdAt || a.created_at,
    }))

    // Empresas com creditos baixos — CTA pra upgrade PRO
    const gamsBaixos: any[] = await Gamificacao.find({
      creditos: { $lt: CREDITOS_BAIXOS_LIMITE },
    })
      .select('company_id creditos creditosMes')
      .sort({ creditos: 1 })
      .limit(20)
      .lean()

    const companyIds = gamsBaixos.map((g) => g.company_id)
    const companiesMap = new Map<string, any>()
    if (companyIds.length) {
      const cs: any[] = await Company.find({ _id: { $in: companyIds } })
        .select('name responsible_name plan_id whatsapp status')
        .populate('plan_id', 'name slug')
        .lean()
      cs.forEach((c) => companiesMap.set(String(c._id), c))
    }

    const lowCreditsCompanies = gamsBaixos
      .map((g) => {
        const c = companiesMap.get(String(g.company_id))
        if (!c) return null
        return {
          _id: String(c._id),
          name: c.name,
          responsible_name: c.responsible_name,
          plan: c.plan_id?.name || 'Sem plano',
          planSlug: c.plan_id?.slug || null,
          status: c.status,
          whatsapp: c.whatsapp,
          creditos: g.creditos || 0,
          creditosMes: g.creditosMes || 0,
        }
      })
      .filter(Boolean)

    return reply.send({
      metrics: {
        activePartners: activeCount + trialCount + pendingSubCount,
        monthlyRevenue,
        pendingSetups: setupPendingCount,
        pendingSubscriptions: pendingSubCount,
        overdue: overdueCount,
        postsToday,
        failedPostsToday,
        lowCredits: lowCreditsCompanies.length,
      },
      alerts: formattedAlerts,
      statusDistribution: {
        active: activeCount,
        trial: trialCount,
        setupPending: setupPendingCount,
        pendingSubscription: pendingSubCount,
        blocked: blockedCount,
      },
      totalPartners: activeCount + trialCount + setupPendingCount + pendingSubCount + blockedCount,
      lowCreditsCompanies,
    })
  })

  // ── GET /alerts ───────────────────────────────
  app.get('/alerts', async (_request: FastifyRequest, reply: FastifyReply) => {
    const alerts = await Notification.find({
      target: 'admin',
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return reply.send({ alerts })
  })
}
