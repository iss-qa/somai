import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Script, Integration } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { EncryptionService } from '../services/encryption.service'
import { getAIConfig, callLLM } from '../services/ai.service'

export default async function scriptsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          category?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { category, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {}

      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (category) query.category = category

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [scripts, total] = await Promise.all([
        Script.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Script.countDocuments(query),
      ])

      return reply.send({
        scripts,
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
          title: string
          category?: string
          text?: string
          images?: string[]
          campaign_id?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body as any

      if (!body.title) {
        return reply.status(400).send({ error: 'Titulo do roteiro e obrigatorio' })
      }

      const script = await Script.create({
        company_id: companyId,
        title: body.title,
        category: body.category || '',
        text: body.text || '',
        char_count: (body.text || '').length,
        audio_url: body.audio_url || '',
        video_url: body.video_url || '',
        images: body.images || [],
        campaign_id: body.campaign_id || null,
      })

      return reply.status(201).send({ script })
    },
  )

  // ── POST /ai/improve ────────────────────────────
  app.post(
    '/ai/improve',
    async (
      request: FastifyRequest<{
        Body: {
          text: string
          category?: string
          niche?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { text, category, niche } = request.body

      if (!text || text.trim().length === 0) {
        return reply.status(400).send({ error: 'Texto do roteiro e obrigatorio' })
      }

      let aiConfig
      try {
        aiConfig = await getAIConfig(companyId)
      } catch (err: any) {
        return reply.status(400).send({ error: err.message })
      }

      const prompt = `Voce e um especialista em comunicacao e marketing para pequenos negocios no Brasil.
Melhore o texto abaixo de um roteiro de comunicacao${category ? ` da categoria "${category}"` : ''}${niche ? ` para um negocio do tipo "${niche}"` : ''}.
Mantenha o tom informal e amigavel, use emojis quando apropriado, e torne a mensagem mais persuasiva e engajante.
Mantenha o significado original mas melhore a clareza, o tom e o impacto.
Responda APENAS com o texto melhorado, sem explicacoes adicionais.

Texto original:
${text}`

      try {
        const improved = await callLLM(aiConfig, prompt)
        if (!improved) {
          return reply.status(502).send({ error: 'IA nao retornou texto' })
        }
        return reply.send({ improved_text: improved.trim() })
      } catch (err: any) {
        return reply.status(502).send({ error: err.message || 'Erro de conexao com API de IA' })
      }
    },
  )

  // ── GET /:id ──────────────────────────────────
  app.get(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const script: any = await Script.findById(id).lean()
      if (!script) {
        return reply.status(404).send({ error: 'Roteiro nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(script.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      return reply.send({ script })
    },
  )

  // ── PUT /:id ──────────────────────────────────
  app.put(
    '/:id',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: Record<string, unknown>
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const existing: any = await Script.findById(id).lean()
      if (!existing) {
        return reply.status(404).send({ error: 'Roteiro nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(existing.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      const { company_id, _id, ...updateData } = request.body as any

      // Recalculate char_count if text is updated
      if (typeof updateData.text === 'string') {
        updateData.char_count = updateData.text.length
      }

      const script = await Script.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean()

      return reply.send({ script })
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

      const script: any = await Script.findById(id).lean()
      if (!script) {
        return reply.status(404).send({ error: 'Roteiro nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(script.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      await Script.findByIdAndDelete(id)

      return reply.send({ message: 'Roteiro removido' })
    },
  )
}
