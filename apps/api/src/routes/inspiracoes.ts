import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Inspiracao, Company } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { GamificacaoService } from '../services/gamificacao.service'

export default async function inspiracoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ── feed com filtros ──
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          segmento?: string
          formato?: string
          objetivo?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      const { segmento, formato, objetivo } = request.query
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '24', 10), 1),
        60,
      )

      const q: Record<string, any> = { ativo: true }
      if (segmento && segmento !== 'todos') q.segmento = segmento
      if (formato && formato !== 'todos') q.formato = formato
      if (objetivo && objetivo !== 'todos') q.objetivo = objetivo

      // Default: prioriza segmento da empresa se não filtrou nada
      if (!segmento && companyId) {
        const company: any = await Company.findById(companyId)
          .select('niche')
          .lean()
        if (company?.niche) q.segmento = company.niche
      }

      const items = await Inspiracao.find(q)
        .sort({ upvotes: -1, createdAt: -1 })
        .limit(limit)
        .lean()

      return reply.send({
        inspiracoes: items.map((i: any) => ({
          id: String(i._id),
          imageUrl: i.imageUrl,
          thumbUrl: i.thumbUrl || i.imageUrl,
          segmento: i.segmento,
          formato: i.formato,
          objetivo: i.objetivo,
          copy: i.copy,
          hashtags: i.hashtags || [],
          upvotes: i.upvotes || 0,
        })),
      })
    },
  )

  // ── POST /:id/salvar ── salva inspiração (→ +5 XP) ──
  app.post(
    '/:id/salvar',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { id } = request.params
      await Inspiracao.updateOne({ _id: id }, { $inc: { salvamentos: 1 } })
      GamificacaoService.emitir(companyId, 'analisar_inspiracao', {
        refId: id,
      }).catch(() => {})
      return reply.send({ ok: true })
    },
  )

  // ── POST /:id/upvote ── dá upvote na inspiração ──
  app.post(
    '/:id/upvote',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      await Inspiracao.updateOne({ _id: id }, { $inc: { upvotes: 1 } })
      return reply.send({ ok: true })
    },
  )
}
