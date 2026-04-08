import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppLog, AuditLog, Post, PostQueue } from '@soma-ai/db'
import { authenticate, adminOnly } from '../../plugins/auth'

export default async function adminAppLogsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /live - last N logs for terminal view (polling) ───────────────
  app.get(
    '/live',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string; since?: string } }>,
      reply: FastifyReply,
    ) => {
      const limit = Math.min(200, Math.max(1, parseInt(request.query.limit || '100')))
      const query: Record<string, unknown> = {}

      if (request.query.since) {
        query.created_at = { $gt: new Date(request.query.since) }
      }

      const logs = await AppLog.find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .lean()

      return reply.send({ logs: logs.reverse() })
    },
  )

  // ── GET /stats - summary stats for cards ─────────────────────────────
  app.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [total24h, errors24h, postsPublished24h, postsFailed24h, queuePending] =
      await Promise.all([
        AppLog.countDocuments({ created_at: { $gte: since24h } }),
        AppLog.countDocuments({ level: 'error', created_at: { $gte: since24h } }),
        Post.countDocuments({ status: 'published', created_at: { $gte: since24h } }),
        Post.countDocuments({ status: 'failed', created_at: { $gte: since24h } }),
        PostQueue.countDocuments({ status: { $in: ['queued', 'processing'] } }),
      ])

    return reply.send({
      total24h,
      errors24h,
      postsPublished24h,
      postsFailed24h,
      queuePending,
    })
  })

  // ── GET / - paginated application logs ───────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          level?: string
          category?: string
          company_id?: string
          date_from?: string
          date_to?: string
          search?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const {
        level,
        category,
        company_id,
        date_from,
        date_to,
        search,
        page = '1',
        limit = '50',
      } = request.query

      const query: Record<string, unknown> = {}

      if (level && level !== 'all') query.level = level
      if (category && category !== 'all') query.category = category
      if (company_id) query.company_id = company_id
      if (search) query.message = { $regex: search, $options: 'i' }

      if (date_from || date_to) {
        const dateFilter: Record<string, Date> = {}
        if (date_from) dateFilter.$gte = new Date(date_from)
        if (date_to) {
          const end = new Date(date_to)
          end.setHours(23, 59, 59, 999)
          dateFilter.$lte = end
        }
        query.created_at = dateFilter
      }

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [logs, total] = await Promise.all([
        AppLog.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        AppLog.countDocuments(query),
      ])

      return reply.send({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )

  // ── GET /audit - admin audit log ─────────────────────────────────────
  app.get(
    '/audit',
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const page = Math.max(1, parseInt(request.query.page || '1'))
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50')))
      const skip = (page - 1) * limit

      const [entries, total] = await Promise.all([
        AuditLog.find()
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .populate('admin_user_id', 'name email')
          .lean(),
        AuditLog.countDocuments(),
      ])

      return reply.send({
        entries,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    },
  )
}
