import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Card, Integration } from '@soma-ai/db'
import { CardStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import { EncryptionService } from '../services/encryption.service'

export default async function cardsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET / ─────────────────────────────────────
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          format?: string
          status?: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId, role } = request.user!
      const { format, status, page = '1', limit = '20' } = request.query

      const query: Record<string, unknown> = {}

      // Non-admin users can only see their company's cards
      if (role !== 'superadmin' && role !== 'support') {
        if (!companyId) {
          return reply.status(400).send({ error: 'Empresa nao encontrada' })
        }
        query.company_id = companyId
      }

      if (format) query.format = format
      if (status) query.status = status

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [cards, total] = await Promise.all([
        Card.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Card.countDocuments(query),
      ])

      return reply.send({
        cards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
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

      const card: any = await Card.findById(id).lean()
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(card.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      return reply.send(card)
    },
  )

  // ── POST /generate ────────────────────────────
  app.post(
    '/generate',
    async (
      request: FastifyRequest<{
        Body: {
          template_id: string
          format: string
          post_type: string
          headline?: string
          subtext?: string
          cta?: string
          product_name?: string
          price_original?: number
          price_promo?: number
          caption?: string
          hashtags?: string[]
          campaign_id?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      const body = request.body

      if (!body.format || !body.post_type) {
        return reply
          .status(400)
          .send({ error: 'Campos obrigatorios: format, post_type' })
      }

      // Create a draft card (actual AI generation is a placeholder)
      const card = await Card.create({
        company_id: companyId || null,
        template_id: body.template_id || null,
        format: body.format,
        post_type: body.post_type,
        headline: body.headline || '',
        subtext: body.subtext || '',
        cta: body.cta || '',
        product_name: body.product_name || '',
        price_original: body.price_original || 0,
        price_promo: body.price_promo || 0,
        caption: body.caption || '',
        hashtags: body.hashtags || [],
        campaign_id: body.campaign_id || null,
        status: CardStatus.Draft,
        ai_prompt_used: `Generate ${body.post_type} card for ${body.product_name || 'product'}`,
        generated_image_url: '', // Placeholder - AI generation would fill this
      })

      return reply.status(201).send(card)
    },
  )

  // ── PATCH /:id/approve ────────────────────────
  app.patch(
    '/:id/approve',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: { generated_image_url?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId, role } = request.user!

      const card = await Card.findById(id)
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(card.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      card.status = CardStatus.Approved as any
      card.approved_at = new Date()

      // Save the preview image if provided
      const body = request.body as any
      if (body?.generated_image_url) {
        card.generated_image_url = body.generated_image_url
      }

      // Update headline with the user-provided custom name
      if (body?.headline) {
        card.headline = body.headline
      }

      await card.save()

      return reply.send(card)
    },
  )

  // ── PATCH /:id ────────────────────────────────
  app.patch(
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

      const card: any = await Card.findById(id).lean()
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(card.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      // Prevent modifying certain fields
      const { company_id, _id, ...updateData } = request.body as any

      const updated = await Card.findByIdAndUpdate(id, updateData, {
        new: true,
      }).lean()

      return reply.send(updated)
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

      const card = await Card.findById(id)
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      if (
        role !== 'superadmin' &&
        role !== 'support' &&
        String(card.company_id) !== companyId
      ) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      await card.deleteOne()

      return reply.send({ message: 'Card excluido', _id: id })
    },
  )

  // ── POST /generate-caption/:id ────────────────
  app.post(
    '/generate-caption/:id',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const card: any = await Card.findById(id).lean()
      if (!card) {
        return reply.status(404).send({ error: 'Card nao encontrado' })
      }

      // Get Gemini API key
      const integration: any = await Integration.findOne({ company_id: companyId }).lean()
      const encryptedKey = integration?.gemini?.api_key
      if (!encryptedKey || !integration?.gemini?.active) {
        return reply.status(400).send({
          error: 'Configure sua chave Gemini em Configuracoes > Integracoes',
        })
      }

      let apiKey: string
      try {
        apiKey = EncryptionService.decrypt(encryptedKey)
      } catch {
        return reply.status(500).send({ error: 'Erro ao descriptografar chave Gemini' })
      }

      const prompt = `Voce e um social media manager profissional para pequenos negocios no Brasil.
Crie uma legenda engajante e hashtags para um post de Instagram.

Dados do card:
- Tipo: ${card.post_type || 'feed'}
- Produto: ${card.product_name || 'produto'}
- Titulo: ${card.headline || ''}
- Texto adicional: ${card.subtext || ''}
- CTA: ${card.cta || ''}
${card.price_promo ? `- Preco promocional: R$ ${card.price_promo}` : ''}
${card.price_original ? `- Preco original: R$ ${card.price_original}` : ''}

Responda EXATAMENTE neste formato JSON (sem markdown, sem code blocks):
{"caption": "legenda aqui com emojis", "hashtags": ["#tag1", "#tag2", "#tag3"]}`

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        )

        if (!res.ok) {
          return reply.status(502).send({ error: 'Erro ao chamar API Gemini' })
        }

        const data = await res.json()
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

        try {
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleaned)
          return reply.send({
            caption: parsed.caption || '',
            hashtags: parsed.hashtags || [],
          })
        } catch {
          return reply.send({ caption: raw.trim(), hashtags: [] })
        }
      } catch {
        return reply.status(502).send({ error: 'Erro de conexao com API Gemini' })
      }
    },
  )
}
