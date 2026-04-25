import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { SupportTicket, User, Company } from '@soma-ai/db'
import type { TicketCategory, TicketStatus, TicketPriority } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { Types } from 'mongoose'

const CATEGORIAS: TicketCategory[] = ['billing', 'bug', 'feature', 'account', 'outros']
const PRIORIDADES: TicketPriority[] = ['low', 'medium', 'high']
const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export default async function supportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── POST /tickets ── abre um novo ticket ──
  app.post(
    '/tickets',
    async (
      request: FastifyRequest<{
        Body: {
          subject: string
          category?: TicketCategory
          priority?: TicketPriority
          content: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { userId, companyId } = request.user!
      if (!userId || !companyId) {
        return reply.status(400).send({ error: 'Sessão inválida' })
      }
      const { subject, category, priority, content } = request.body || {}
      if (!subject?.trim() || !content?.trim()) {
        return reply.status(400).send({ error: 'subject e content são obrigatórios' })
      }
      if (subject.length > 200) {
        return reply.status(400).send({ error: 'Assunto muito longo (máx 200)' })
      }

      const categoriaFinal: TicketCategory = CATEGORIAS.includes(category as any)
        ? (category as TicketCategory)
        : 'outros'
      const prioridadeFinal: TicketPriority = PRIORIDADES.includes(priority as any)
        ? (priority as TicketPriority)
        : 'medium'

      const user: any = await User.findById(userId).lean()
      const authorName = user?.name || 'Usuário'

      const now = new Date()
      const ticket = await SupportTicket.create({
        user_id: new Types.ObjectId(userId),
        company_id: new Types.ObjectId(companyId),
        subject: subject.trim(),
        category: categoriaFinal,
        priority: prioridadeFinal,
        status: 'open',
        messages: [
          {
            author_type: 'user',
            author_name: authorName,
            author_id: new Types.ObjectId(userId),
            content: content.trim(),
            attachments: [],
            created_at: now,
          },
        ],
        last_message_at: now,
        last_message_by: 'user',
      })

      return reply.status(201).send({ ticket })
    },
  )

  // ── GET /tickets ── lista os meus ──
  app.get(
    '/tickets',
    async (
      request: FastifyRequest<{ Querystring: { status?: string; limit?: string } }>,
      reply: FastifyReply,
    ) => {
      const { userId } = request.user!
      if (!userId) return reply.status(400).send({ error: 'Sessão inválida' })

      const filter: any = { user_id: new Types.ObjectId(userId) }
      if (request.query.status && STATUSES.includes(request.query.status as any)) {
        filter.status = request.query.status
      }
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '50', 10), 1),
        100,
      )

      const tickets = await SupportTicket.find(filter)
        .sort({ last_message_at: -1 })
        .limit(limit)
        .select('-messages')
        .lean()

      return reply.send({ tickets })
    },
  )

  // ── GET /tickets/:id ── detalhe com thread completo ──
  app.get<{ Params: { id: string } }>(
    '/tickets/:id',
    async (request, reply) => {
      const { userId, role } = request.user!
      const { id } = request.params
      if (!Types.ObjectId.isValid(id)) {
        return reply.status(400).send({ error: 'ID inválido' })
      }
      const ticket: any = await SupportTicket.findById(id).lean()
      if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' })

      const isAdmin = role === 'superadmin' || role === 'support'
      if (!isAdmin && String(ticket.user_id) !== String(userId)) {
        return reply.status(403).send({ error: 'Sem permissão' })
      }

      return reply.send({ ticket })
    },
  )

  // ── POST /tickets/:id/messages ── responde ──
  app.post<{ Params: { id: string }; Body: { content: string } }>(
    '/tickets/:id/messages',
    async (request, reply) => {
      const { userId, role } = request.user!
      const { id } = request.params
      const { content } = request.body || ({} as any)
      if (!content?.trim()) {
        return reply.status(400).send({ error: 'content é obrigatório' })
      }
      const ticket: any = await SupportTicket.findById(id)
      if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' })

      const isAdmin = role === 'superadmin' || role === 'support'
      if (!isAdmin && String(ticket.user_id) !== String(userId)) {
        return reply.status(403).send({ error: 'Sem permissão' })
      }
      if (ticket.status === 'closed') {
        return reply.status(400).send({ error: 'Ticket fechado' })
      }

      const authorType: 'user' | 'support' = isAdmin ? 'support' : 'user'
      const user: any = await User.findById(userId).lean()
      const authorName = user?.name || (isAdmin ? 'Suporte Soma.ai' : 'Usuário')

      const now = new Date()
      ticket.messages.push({
        author_type: authorType,
        author_name: authorName,
        author_id: userId ? new Types.ObjectId(userId) : null,
        content: content.trim(),
        attachments: [],
        created_at: now,
      })
      ticket.last_message_at = now
      ticket.last_message_by = authorType

      // Reopen se user respondeu num ticket resolvido
      if (authorType === 'user' && ticket.status === 'resolved') {
        ticket.status = 'open'
        ticket.resolved_at = null
      }
      // Admin respondendo = in_progress
      if (authorType === 'support' && ticket.status === 'open') {
        ticket.status = 'in_progress'
      }

      await ticket.save()
      return reply.send({ ticket })
    },
  )

  // ── PATCH /tickets/:id/status ── muda status (usuário só pode fechar) ──
  app.patch<{ Params: { id: string }; Body: { status: TicketStatus } }>(
    '/tickets/:id/status',
    async (request, reply) => {
      const { userId, role } = request.user!
      const { id } = request.params
      const { status } = request.body || ({} as any)
      if (!STATUSES.includes(status)) {
        return reply.status(400).send({ error: 'Status inválido' })
      }
      const ticket: any = await SupportTicket.findById(id)
      if (!ticket) return reply.status(404).send({ error: 'Ticket não encontrado' })

      const isAdmin = role === 'superadmin' || role === 'support'
      const isOwner = String(ticket.user_id) === String(userId)
      if (!isAdmin && !isOwner) {
        return reply.status(403).send({ error: 'Sem permissão' })
      }
      if (!isAdmin && status !== 'closed') {
        return reply.status(403).send({ error: 'Usuário só pode fechar o ticket' })
      }

      ticket.status = status
      if (status === 'resolved' || status === 'closed') {
        ticket.resolved_at = new Date()
      } else {
        ticket.resolved_at = null
      }
      await ticket.save()

      return reply.send({ ticket })
    },
  )
}
