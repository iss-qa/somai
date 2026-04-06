import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PostQueue, Card } from '@soma-ai/db'
import { QueueStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import postQueue from '../queues/post.queue'

export default async function postQueueRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          month?: string // e.g. "2026-03"
          status?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { month, status, page = '1', limit = '50' } = request.query

      const query: Record<string, unknown> = {}

      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (status) query.status = status

      // Filter by month for calendar view
      if (month) {
        const [year, m] = month.split('-').map(Number)
        const startDate = new Date(year, m - 1, 1)
        const endDate = new Date(year, m, 0, 23, 59, 59, 999)
        query.scheduled_at = { $gte: startDate, $lte: endDate }
      }

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [items, total] = await Promise.all([
        PostQueue.find(query)
          .sort({ scheduled_at: 1 })
          .skip(skip)
          .limit(limitNum)
          .populate('card_id')
          .lean(),
        PostQueue.countDocuments(query),
      ])

      return reply.send({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )

  // ── POST / ────────────────────────────────────
  app.post(
    '/',
    async (
      request: FastifyRequest<{
        Body: {
          card_id: string
          video_id?: string
          scheduled_at: string
          platforms: string[]
          post_type: string
          caption?: string
          hashtags?: string[]
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body

      if (!body.card_id || !body.scheduled_at || !body.platforms?.length || !body.post_type) {
        return reply.status(400).send({
          error: 'Campos obrigatorios: card_id, scheduled_at, platforms, post_type',
        })
      }

      const card: any = await Card.findById(body.card_id).lean()
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      if (String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: 'Card nao pertence a esta empresa' })
      }

      const scheduledAt = new Date(body.scheduled_at)

      const queueItem = await PostQueue.create({
        company_id: companyId,
        card_id: body.card_id,
        video_id: body.video_id || null,
        scheduled_at: scheduledAt,
        platforms: body.platforms,
        post_type: body.post_type,
        caption: body.caption || card.caption || '',
        hashtags: body.hashtags || card.hashtags || [],
        status: QueueStatus.Queued,
      })

      // Schedule the BullMQ job with delay
      const delay = Math.max(0, scheduledAt.getTime() - Date.now())

      const job = await postQueue.add(
        'publish',
        {
          queueId: String(queueItem._id),
          companyId,
          cardId: body.card_id,
          videoId: body.video_id,
          platforms: body.platforms,
          postType: body.post_type,
          caption: queueItem.caption,
          hashtags: queueItem.hashtags,
          imageUrl: card.generated_image_url || '',
        },
        { delay },
      )

      await PostQueue.findByIdAndUpdate(queueItem._id, {
        bullmq_job_id: job.id,
      })

      // Update card status to scheduled
      await Card.findByIdAndUpdate(body.card_id, { status: 'scheduled' })

      return reply.status(201).send({
        item: queueItem,
        jobId: job.id,
      })
    },
  )

  // ── DELETE /:id ───────────────────────────────
  app.delete(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const queueItem = await PostQueue.findById(id)
      if (!queueItem) {
        return reply.status(404).send({ error: 'Item nao encontrado na fila' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(queueItem.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      if (queueItem.status === 'done' || queueItem.status === 'processing') {
        return reply
          .status(400)
          .send({ error: 'Nao e possivel cancelar um item ja processado ou em processamento' })
      }

      // Remove BullMQ job if exists
      if (queueItem.bullmq_job_id) {
        try {
          const job = await postQueue.getJob(queueItem.bullmq_job_id)
          if (job) await job.remove()
        } catch {
          // Job may already have been processed
        }
      }

      queueItem.status = QueueStatus.Cancelled as any
      await queueItem.save()

      // Revert card status to approved
      await Card.findByIdAndUpdate(queueItem.card_id, { status: 'approved' })

      return reply.send({ message: 'Agendamento cancelado', item: queueItem })
    },
  )
}
