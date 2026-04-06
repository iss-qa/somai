import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Post, PostQueue, Notification } from '@soma-ai/db'
import {
  CompanyStatus,
  BillingStatus,
  PostStatus,
  QueueStatus,
} from '@soma-ai/shared'
import { authenticate, adminOnly } from '../../plugins/auth'

export default async function adminDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /summary ──────────────────────────────
  app.get('/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    )

    const [
      activeCompanies,
      setupPending,
      overdueCompanies,
      allCompanies,
      postsToday,
      failedPostsToday,
    ] = await Promise.all([
      Company.countDocuments({ status: CompanyStatus.Active }),
      Company.countDocuments({ status: CompanyStatus.SetupPending }),
      Company.countDocuments({ 'billing.status': BillingStatus.Overdue }),
      Company.find({ status: CompanyStatus.Active })
        .select('billing.monthly_amount')
        .lean(),
      Post.countDocuments({
        status: PostStatus.Published,
        published_at: { $gte: todayStart, $lte: todayEnd },
      }),
      Post.countDocuments({
        status: PostStatus.Failed,
        created_at: { $gte: todayStart, $lte: todayEnd },
      }),
    ])

    // Calculate monthly revenue from active companies
    const monthlyRevenue = allCompanies.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0,
    )

    return reply.send({
      activeCompanies,
      monthlyRevenue: monthlyRevenue,
      setupPending: setupPending,
      overdueCount: overdueCompanies,
      postsToday: postsToday,
      failedPostsToday: failedPostsToday,
    })
  })

  // ── GET /alerts ───────────────────────────────
  app.get('/alerts', async (_request: FastifyRequest, reply: FastifyReply) => {
    const alerts = await Notification.find({
      target: 'admin',
      read: false,
    })
      .sort({ created_at: -1 })
      .limit(50)
      .lean()

    return reply.send({ alerts })
  })
}
