import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import mongoose from 'mongoose'
import { Integration, PostQueue, Post, Company } from '@soma-ai/db'
import { QueueStatus, PostStatus } from '@soma-ai/shared'
import { authenticate, adminOnly } from '../../plugins/auth'
import redis from '../../plugins/redis'

export default async function adminHealthRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /services ─────────────────────────────
  app.get('/services', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Check MongoDB
    let mongoStatus = 'disconnected'
    try {
      const state = mongoose.connection.readyState
      mongoStatus =
        state === 1
          ? 'connected'
          : state === 2
            ? 'connecting'
            : 'disconnected'
    } catch {
      mongoStatus = 'error'
    }

    // Check Redis
    let redisStatus = 'disconnected'
    try {
      const pong = await redis.ping()
      redisStatus = pong === 'PONG' ? 'connected' : 'error'
    } catch {
      redisStatus = 'error'
    }

    return reply.send({
      mongodb: {
        status: mongoStatus,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
      },
      redis: {
        status: redisStatus,
      },
    })
  })

  // ── GET /integrations ─────────────────────────
  app.get(
    '/integrations',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const integrations = await Integration.find()
        .populate('company_id', 'name slug')
        .select('company_id meta.connected meta.status meta.token_expires_at whatsapp.connected whatsapp.status')
        .lean()

      const result = integrations
        .filter((i) => i.company_id != null)
        .map((i) => ({
        company: i.company_id,
        meta: {
          connected: i.meta?.connected || false,
          status: i.meta?.status || 'disconnected',
          token_expires_at: i.meta?.token_expires_at || null,
          token_expired: i.meta?.token_expires_at
            ? new Date(i.meta.token_expires_at) < new Date()
            : false,
        },
        whatsapp: {
          connected: i.whatsapp?.connected || false,
          status: i.whatsapp?.status || 'disconnected',
        },
      }))

      return reply.send({ integrations: result })
    },
  )

  // ── GET /queue ────────────────────────────────
  app.get('/queue', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [pending, processing, failed, done] = await Promise.all([
      PostQueue.countDocuments({ status: QueueStatus.Queued }),
      PostQueue.countDocuments({ status: QueueStatus.Processing }),
      PostQueue.countDocuments({ status: QueueStatus.Failed }),
      PostQueue.countDocuments({ status: QueueStatus.Done }),
    ])

    // Recent queued items
    const recentItems = await PostQueue.find({
      status: { $in: [QueueStatus.Queued, QueueStatus.Processing] },
    })
      .sort({ scheduled_at: 1 })
      .limit(20)
      .populate('company_id', 'name')
      .populate('card_id', 'headline format')
      .lean()

    return reply.send({
      queue: {
        pending,
        processing,
        failed,
        done,
        recent_items: recentItems,
      },
    })
  })

  // ── GET /errors ───────────────────────────────
  app.get('/errors', async (_request: FastifyRequest, reply: FastifyReply) => {
    const recentErrors = await Post.find({
      status: PostStatus.Failed,
    })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('company_id', 'name slug')
      .populate('card_id', 'headline format post_type')
      .lean()

    return reply.send({ errors: recentErrors })
  })
}
