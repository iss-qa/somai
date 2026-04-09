import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Post, Notification } from '@soma-ai/db'
import { PostStatus } from '@soma-ai/shared'
import { authenticate, adminOnly } from '../../plugins/auth'

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

    // Trial companies — for CTA banner
    const trialCompanies = await Company.find({ status: 'trial' })
      .select('name responsible_name trial_expires_at trial_days plan_id whatsapp')
      .populate('plan_id', 'name slug')
      .sort({ trial_expires_at: 1 })
      .lean()

    return reply.send({
      metrics: {
        activePartners: activeCount + trialCount + pendingSubCount,
        monthlyRevenue,
        pendingSetups: setupPendingCount,
        pendingSubscriptions: pendingSubCount,
        overdue: overdueCount,
        postsToday,
        failedPostsToday,
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
      trialCompanies: trialCompanies.map((c: any) => ({
        _id: String(c._id),
        name: c.name,
        responsible_name: c.responsible_name,
        plan: c.plan_id?.name || 'Sem plano',
        trial_expires_at: c.trial_expires_at,
        trial_days: c.trial_days,
        whatsapp: c.whatsapp,
      })),
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
