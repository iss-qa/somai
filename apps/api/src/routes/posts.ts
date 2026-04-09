import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Post, PostQueue, Card } from '@soma-ai/db'
import { QueueStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import postQueue from '../queues/post.queue'

export default async function postsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          status?: string
          platform?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { status, platform, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {}

      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (status) query.status = status
      if (platform) query.platforms = platform

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [posts, total] = await Promise.all([
        Post.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('card_id')
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

  // ── POST /:id/retry ──────────────────────────
  app.post(
    '/:id/retry',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const post: any = await Post.findById(id).lean()
      if (!post) {
        return reply.status(404).send({ error: 'Post nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(post.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      if (post.status !== 'failed') {
        return reply.status(400).send({ error: 'Apenas posts com falha podem ser reenviados' })
      }

      // Get the card for the image URL
      const card: any = await Card.findById(post.card_id).lean()

      // Re-queue the post
      const queueItem = await PostQueue.create({
        company_id: post.company_id,
        card_id: post.card_id,
        video_id: post.video_id,
        scheduled_at: new Date(),
        platforms: post.platforms,
        post_type: post.post_type,
        caption: post.caption,
        hashtags: post.hashtags,
        status: QueueStatus.Queued,
      })

      // Best-effort BullMQ with 5s timeout (cron handles it if Redis unavailable)
      let jobId: string | undefined
      try {
        const jobPromise = postQueue.add('publish', {
          queueId: String(queueItem._id),
          companyId: String(post.company_id),
          cardId: String(post.card_id),
          videoId: post.video_id ? String(post.video_id) : undefined,
          platforms: post.platforms,
          postType: post.post_type,
          caption: post.caption,
          hashtags: post.hashtags,
          imageUrl: card?.generated_image_url || '',
        })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 5000),
        )
        const job = await Promise.race([jobPromise, timeoutPromise])
        jobId = job.id
        await PostQueue.findByIdAndUpdate(queueItem._id, {
          bullmq_job_id: jobId,
        })
      } catch {
        // Redis unavailable — cron will pick it up
      }

      return reply.send({
        message: 'Post reenfileirado para publicacao',
        queueId: String(queueItem._id),
        jobId,
      })
    },
  )
}
