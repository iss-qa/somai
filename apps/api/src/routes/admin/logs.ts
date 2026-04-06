import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Post } from '@soma-ai/db'
import { authenticate, adminOnly } from '../../plugins/auth'

export default async function adminLogsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET / ─────────────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          company_id?: string
          status?: string
          platform?: string
          date_from?: string
          date_to?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const {
        company_id,
        status,
        platform,
        date_from,
        date_to,
        page = '1',
        limit = '30',
      } = request.query

      const query: Record<string, unknown> = {}

      if (company_id) query.company_id = company_id
      if (status) query.status = status
      if (platform) query.platforms = platform

      // Date range filter
      if (date_from || date_to) {
        const dateFilter: Record<string, Date> = {}
        if (date_from) dateFilter.$gte = new Date(date_from)
        if (date_to) {
          const endDate = new Date(date_to)
          endDate.setHours(23, 59, 59, 999)
          dateFilter.$lte = endDate
        }
        query.created_at = dateFilter
      }

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [posts, total] = await Promise.all([
        Post.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('company_id', 'name slug niche')
          .populate('card_id', 'headline format post_type generated_image_url')
          .lean(),
        Post.countDocuments(query),
      ])

      return reply.send({
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )
}
