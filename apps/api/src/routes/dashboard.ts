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

    const [postsThisMonth, approvedCards, scheduledToday, videosGenerated, publishedCards] =
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
        Card.countDocuments({ ...query, status: CardStatus.Posted }),
      ])

    // Upcoming queued posts
    const queuedPosts = await PostQueue.find({
      ...query,
      status: QueueStatus.Queued,
      scheduled_at: { $gte: new Date() },
    })
      .sort({ scheduled_at: 1 })
      .limit(5)
      .populate('card_id', 'headline generated_image_url')
      .lean()

    // Recently published or failed (last 24h)
    const recentDone = await PostQueue.find({
      ...query,
      status: { $in: [QueueStatus.Done, QueueStatus.Failed] },
      scheduled_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ scheduled_at: -1 })
      .limit(5)
      .populate('card_id', 'headline generated_image_url')
      .lean()

    const statusToLabel: Record<string, string> = {
      [QueueStatus.Done]: 'published',
      [QueueStatus.Failed]: 'failed',
      [QueueStatus.Queued]: 'queued',
      [QueueStatus.Processing]: 'queued',
    }

    const allPosts = [...recentDone, ...queuedPosts].slice(0, 10)

    const posts = allPosts.map((p: any) => ({
      _id: String(p._id),
      caption: p.caption || p.card_id?.headline || '',
      card_id: p.card_id && typeof p.card_id === 'object' ? { generated_image_url: p.card_id.generated_image_url } : undefined,
      platforms: p.platforms || [],
      published_at: p.status === QueueStatus.Done ? p.scheduled_at : null,
      created_at: p.scheduled_at,
      status: statusToLabel[p.status] || p.status,
    }))

    return reply.send({
      metrics: { postsThisMonth, approvedCards, scheduledToday, videosGenerated, publishedCards },
      upcomingPosts: posts,
    })
  })
}
