import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Card, Post, PostQueue, Video } from '@soma-ai/db'
import { CardStatus, QueueStatus, PostStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const query: Record<string, unknown> = {}
    if (companyId) query.company_id = companyId

    const [postsThisMonth, approvedCards, scheduledToday, videosGenerated] =
      await Promise.all([
        Post.countDocuments({
          ...query,
          status: PostStatus.Published,
          published_at: { $gte: monthStart },
        }),
        Card.countDocuments({ ...query, status: CardStatus.Approved }),
        PostQueue.countDocuments({
          ...query,
          status: QueueStatus.Queued,
          scheduled_at: { $gte: todayStart, $lte: todayEnd },
        }),
        Video.countDocuments({ ...query }),
      ])

    const upcomingPosts = await PostQueue.find({
      ...query,
      status: QueueStatus.Queued,
      scheduled_at: { $gte: new Date() },
    })
      .sort({ scheduled_at: 1 })
      .limit(5)
      .populate('card_id', 'headline generated_image_url')
      .lean()

    const posts = upcomingPosts.map((p: any) => ({
      id: String(p._id),
      caption: p.caption || p.card_id?.headline || '',
      thumbnail: p.card_id?.generated_image_url || null,
      platforms: p.platforms || [],
      scheduledAt: p.scheduled_at,
      status: p.status,
    }))

    return reply.send({
      metrics: { postsThisMonth, approvedCards, scheduledToday, videosGenerated },
      upcomingPosts: posts,
    })
  })
}
