import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ComunidadePost, Company } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { GamificacaoService } from '../services/gamificacao.service'

export default async function comunidadeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ── feed de posts da comunidade ──
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: { tag?: string; limit?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { tag } = request.query
      const limit = Math.min(
        Math.max(parseInt(request.query.limit || '30', 10), 1),
        60,
      )
      const q: Record<string, any> = { ativo: true }
      if (tag && tag !== 'todas') q.tags = tag

      const posts = await ComunidadePost.find(q)
        .sort({ upvotes: -1, createdAt: -1 })
        .limit(limit)
        .lean()

      return reply.send({
        posts: posts.map((p: any) => ({
          id: String(p._id),
          titulo: p.titulo,
          conteudo: p.conteudo,
          autor: p.autor,
          avatar_url: p.avatar_url,
          tags: p.tags || [],
          upvotes: p.upvotes || 0,
          respostas: (p.respostas || []).length,
          resolvido: !!p.resolvido,
          createdAt: p.createdAt,
        })),
      })
    },
  )

  // ── GET /:id ── detalhe com respostas ──
  app.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const post: any = await ComunidadePost.findById(request.params.id).lean()
      if (!post) return reply.status(404).send({ error: 'Nao encontrado' })
      return reply.send({ post })
    },
  )

  // ── POST / ── cria pergunta ──
  app.post(
    '/',
    async (
      request: FastifyRequest<{
        Body: { titulo: string; conteudo: string; tags: string[] }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { titulo, conteudo, tags } = request.body || {}
      if (!titulo || !conteudo) {
        return reply
          .status(400)
          .send({ error: 'titulo e conteudo sao obrigatorios' })
      }

      const company: any = await Company.findById(companyId)
        .select('name logo_url')
        .lean()

      // Primeira pergunta? (+50 créditos, +20 XP via gamificação)
      const existente = await ComunidadePost.countDocuments({
        company_id: companyId,
      })

      const post = await ComunidadePost.create({
        company_id: companyId,
        autor: company?.name || '',
        avatar_url: company?.logo_url || '',
        titulo,
        conteudo,
        tags: Array.isArray(tags) ? tags : [],
      })

      if (existente === 0) {
        GamificacaoService.emitir(companyId, 'primeira_pergunta', {
          refId: String(post._id),
        }).catch(() => {})
      }

      return reply.status(201).send({ id: String(post._id) })
    },
  )

  // ── POST /:id/upvote ──
  app.post(
    '/:id/upvote',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      await ComunidadePost.updateOne(
        { _id: request.params.id },
        { $inc: { upvotes: 1 } },
      )
      return reply.send({ ok: true })
    },
  )

  // ── POST /:id/responder ──
  app.post(
    '/:id/responder',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: { conteudo: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { conteudo } = request.body || {}
      if (!conteudo) {
        return reply.status(400).send({ error: 'conteudo obrigatorio' })
      }
      const company: any = await Company.findById(companyId)
        .select('name logo_url')
        .lean()

      const respostasAntes = await ComunidadePost.countDocuments({
        'respostas.company_id': companyId,
      })

      await ComunidadePost.updateOne(
        { _id: request.params.id },
        {
          $push: {
            respostas: {
              company_id: companyId,
              autor: company?.name || '',
              avatar_url: company?.logo_url || '',
              conteudo,
              upvotes: 0,
              upvotedBy: [],
              isIA: false,
            },
          },
        },
      )

      if (respostasAntes === 0) {
        GamificacaoService.emitir(companyId, 'primeira_resposta', {
          refId: request.params.id,
        }).catch(() => {})
      }

      return reply.send({ ok: true })
    },
  )
}
