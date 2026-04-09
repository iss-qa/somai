import type { FastifyInstance } from 'fastify'
import { authenticate } from '../plugins/auth'
import { NotificationService } from '../services/notification.service'

export default async function notificationRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)

  // ── GET / — list notifications for current user ──
  app.get('/', async (request) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const isAdmin =
      request.user.role === 'superadmin' || request.user.role === 'support'

    const target = isAdmin ? 'admin' : 'company'
    const companyId = isAdmin ? undefined : request.user.companyId || undefined

    return NotificationService.getAll(
      target,
      companyId,
      Math.max(1, parseInt(page)),
      Math.min(50, Math.max(1, parseInt(limit))),
    )
  })

  // ── GET /unread — unread notifications ──
  app.get('/unread', async (request) => {
    const isAdmin =
      request.user.role === 'superadmin' || request.user.role === 'support'

    const target = isAdmin ? 'admin' : 'company'
    const companyId = isAdmin ? undefined : request.user.companyId || undefined

    const notifications = await NotificationService.getUnread(target, companyId)
    return { notifications, count: notifications.length }
  })

  // ── POST /:id/read — mark single as read ──
  app.post('/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string }
    const notification = await NotificationService.markRead(id)
    if (!notification) {
      return reply.status(404).send({ error: 'Notificacao nao encontrada' })
    }
    return { success: true }
  })

  // ── POST /read-all — mark all as read ──
  app.post('/read-all', async (request) => {
    const isAdmin =
      request.user.role === 'superadmin' || request.user.role === 'support'

    const target = isAdmin ? 'admin' : 'company'
    const companyId = isAdmin ? undefined : request.user.companyId || undefined

    await NotificationService.markAllRead(target, companyId)
    return { success: true }
  })

  // ── POST /:id/dismiss — dismiss a notification ──
  app.post('/:id/dismiss', async (request, reply) => {
    const { id } = request.params as { id: string }
    const notification = await NotificationService.dismiss(id)
    if (!notification) {
      return reply.status(404).send({ error: 'Notificacao nao encontrada' })
    }
    return { success: true }
  })
}
