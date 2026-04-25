import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../plugins/auth'
import { GamificacaoService } from '../services/gamificacao.service'

export default async function gamificacaoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET /state ── estado completo pra header/dashboard ──
  app.get(
    '/state',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const estado = await GamificacaoService.getEstado(companyId)
      return reply.send(estado)
    },
  )

  // ── GET /missoes ── missões ativas com progresso ──
  app.get(
    '/missoes',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '3', 10), 1),
        20,
      )
      const missoes = await GamificacaoService.missoesAtivas(companyId, limit)
      return reply.send({ missoes })
    },
  )

  // ── GET /historico ── histórico de XP/créditos ──
  app.get(
    '/historico',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '30', 10), 1),
        100,
      )
      const eventos = await GamificacaoService.historico(companyId, limit)
      return reply.send({ eventos })
    },
  )

  // ── GET /conquistas ── todas com flag de desbloqueio ──
  app.get(
    '/conquistas',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const conquistas = await GamificacaoService.conquistas(companyId)
      return reply.send({ conquistas })
    },
  )

  // ── GET /ranking ── ranking mensal global ──
  app.get(
    '/ranking',
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply,
    ) => {
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '20', 10), 1),
        50,
      )
      const ranking = await GamificacaoService.ranking(limit)
      const clean = ranking.map((r: any, i: number) => ({
        posicao: i + 1,
        creditosMes: r.creditosMes || 0,
        xp: r.xp || 0,
        nivel: r.nivel,
        empresa: r.company_id
          ? {
              id: String(r.company_id._id || r.company_id),
              nome: r.company_id?.name || '',
              logo: r.company_id?.logo_url || '',
              niche: r.company_id?.niche || '',
            }
          : null,
      }))
      return reply.send({ ranking: clean })
    },
  )
}
