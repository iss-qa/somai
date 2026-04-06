import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Schedule } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'

export default async function schedulesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId, role } = request.user!

    if (role !== 'superadmin' && role !== 'support' && !companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada' })
    }

    const query: Record<string, unknown> = {}
    if (role !== 'superadmin' && role !== 'support') {
      query.company_id = companyId
    }

    const schedule = await Schedule.findOne(query).lean()

    if (!schedule) {
      return reply.status(404).send({ error: 'Agendamento nao encontrado' })
    }

    return reply.send({ schedule })
  })

  // ── PUT / ─────────────────────────────────────
  app.put(
    '/',
    async (
      request: FastifyRequest<{
        Body: {
          active?: boolean
          publish_instagram?: boolean
          publish_facebook?: boolean
          publish_stories?: boolean
          frequency?: string
          weekly_slots?: Array<{
            day: number
            time: string
            format: string
          }>
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body

      const schedule = await Schedule.findOneAndUpdate(
        { company_id: companyId },
        {
          ...body,
          updated_at: new Date(),
        },
        { new: true, upsert: true },
      ).lean()

      return reply.send({ schedule })
    },
  )
}
