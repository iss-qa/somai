import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Card, Integration } from '@soma-ai/db'
import { CardStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import { EncryptionService } from '../services/encryption.service'
import { LogService } from '../services/log.service'
import { LLMService } from '../services/llm.service'
import { StorageService } from '../services/storage.service'

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

      // Backfill `source` para cards antigos: se o ai_prompt_used segue o
      // formato do briefing do fluxo /criar (**Objetivo do Post:**), eh AI.
      // Caso contrario, custom. Isso evita migration manual no banco.
      const enriched = cards.map((c: any) => ({
        ...c,
        source:
          c.source ||
          (typeof c.ai_prompt_used === 'string' &&
          /\*\*Objetivo do Post:\*\*/i.test(c.ai_prompt_used)
            ? 'ai'
            : 'custom'),
      }))

      return reply.send({
        cards: enriched,
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

      // Anexa info de marca usada pelo editor (logo + paleta) num bloco enxuto
      const { Company } = await import('@soma-ai/db')
      const company: any = await Company.findById(card.company_id)
        .select('name logo_url estiloVisual instagramHandle')
        .lean()
      const brand = company
        ? {
            name: company.name || '',
            handle: company.instagramHandle
              ? `@${String(company.instagramHandle).replace(/^@/, '')}`
              : '',
            logoUrl:
              company.estiloVisual?.logoUrl || company.logo_url || '',
            paleta: (company.estiloVisual?.paleta || []).filter(Boolean),
            estilo: company.estiloVisual?.estilo || '',
          }
        : null

      return reply.send({ ...card, brand })
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
      const { companyId, role } = request.user!
      const body = request.body

      if (!body.format || !body.post_type) {
        return reply
          .status(400)
          .send({ error: 'Campos obrigatorios: format, post_type' })
      }

      // Resolve company_id: admin can specify via body, otherwise use JWT companyId
      let resolvedCompanyId = companyId
      if (!resolvedCompanyId && (role === 'superadmin' || role === 'support')) {
        // Admin without company: use body.company_id or first active company
        if ((body as any).company_id) {
          resolvedCompanyId = (body as any).company_id
        } else {
          const { Company } = await import('@soma-ai/db')
          const firstCompany: any = await Company.findOne({ access_enabled: true, status: 'active' }).lean()
          resolvedCompanyId = firstCompany ? String(firstCompany._id) : null
        }
      }

      if (!resolvedCompanyId) {
        await LogService.error('card', 'card_create_no_company', `Tentativa de criar card sem company_id (userId: ${request.user!.userId})`, {
          metadata: { userId: request.user!.userId, role },
        })
        return reply.status(400).send({ error: 'Empresa nao encontrada. Faca login novamente.' })
      }

      // Create a draft card (actual AI generation is a placeholder)
      const card = await Card.create({
        company_id: resolvedCompanyId,
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

      await LogService.info('card', 'card_created', `Card criado: ${body.post_type} (${body.format})`, {
        company_id: companyId || undefined,
        metadata: { cardId: String(card._id), format: body.format, postType: body.post_type },
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
        Body: {
          generated_image_url?: string
          generated_video_url?: string
          media_type?: 'image' | 'video'
          headline?: string
        }
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

      const body = request.body as any
      if (body?.generated_image_url) {
        card.generated_image_url = body.generated_image_url
      }
      if (body?.generated_video_url) {
        card.generated_video_url = body.generated_video_url
      }
      if (Array.isArray(body?.slide_image_urls) && body.slide_image_urls.length > 0) {
        card.slide_image_urls = body.slide_image_urls
      }
      if (body?.media_type === 'video' || body?.media_type === 'image') {
        card.media_type = body.media_type
      }

      // Update headline with the user-provided custom name
      if (body?.headline) {
        card.headline = body.headline
      }

      await card.save()

      // v2.0 gamificação: aprovar o card = "gerar post"
      try {
        const { GamificacaoService } = await import(
          '../services/gamificacao.service'
        )
        void GamificacaoService.emitir(
          String(card.company_id),
          'gerar_post',
          { refId: String(card._id) },
        )
      } catch {
        /* não falha o approve */
      }

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

  // ── POST /:id/upload ─ upload de imagem overlay ou composite final ──
  app.post(
    '/:id/upload',
    async (
      request: FastifyRequest<{
        Params: { id: string }
        Body: { dataUrl: string; kind?: 'overlay' | 'composite' }
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

      const { dataUrl, kind = 'overlay' } = request.body || {}
      if (!dataUrl?.startsWith('data:image/')) {
        return reply.status(400).send({ error: 'dataUrl invalido' })
      }

      try {
        const folder = kind === 'composite' ? 'composites' : 'overlays'
        const url = await StorageService.uploadBase64Media(dataUrl, folder)
        return reply.send({ url })
      } catch (err: any) {
        request.log.error(err, '[cards] upload falhou')
        return reply
          .status(500)
          .send({ error: err?.message || 'Erro ao enviar imagem' })
      }
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
        const raw = await LLMService.generateText(prompt)
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
      } catch (err: any) {
        return reply.status(502).send({ error: err.message || 'Erro de conexao com API de IA' })
      }
    },
  )

  // ── POST /generate-content-plan ───────────────
  // Gera via LLM um "plano" completo do card/carrossel: produto, objetivo,
  // paleta, fonte, e conteudo de cada slide + prompt de imagem por slide.
  app.post(
    '/generate-content-plan',
    async (
      request: FastifyRequest<{
        Body: {
          format: 'feed' | 'stories' | 'carousel'
          carouselShape?: 'square' | 'vertical'
          slideTotal?: number
          niche?: string
          postType?: string
          userPrompt?: string
          productName?: string
          hasReferenceImage?: boolean
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const {
        format, carouselShape, slideTotal = 1,
        niche = 'outro', postType = 'nenhum',
        userPrompt = '', productName = '',
        hasReferenceImage = false,
      } = request.body

      const totalSlides = format === 'carousel' ? Math.max(1, Math.min(10, slideTotal)) : 1
      const dims = format === 'stories'
        ? '1080x1920 (9:16)'
        : (format === 'carousel' && carouselShape === 'vertical')
          ? '1080x1350 (4:5)'
          : '1080x1080 (1:1)'

      const llmPrompt = `Voce e um diretor de arte e copywriter especializado em Instagram para pequenos negocios brasileiros.

Gere um plano COMPLETO de ${format === 'carousel' ? `carrossel com ${totalSlides} slides` : format === 'stories' ? 'story' : 'post de feed'} para um(a) ${niche}.
Formato alvo: ${dims}.
Tipo de post: ${postType}.
${productName ? `Produto/servico do anunciante: ${productName}.` : 'Escolha um produto/servico tipico do nicho.'}
${userPrompt ? `Briefing do usuario: ${userPrompt}` : ''}
${hasReferenceImage ? 'O usuario anexou uma imagem de referencia - assuma que as imagens devem seguir o estilo visual dessa referencia.' : ''}

Responda APENAS com um JSON valido (sem markdown, sem comentarios) neste formato exato:
{
  "productName": "nome curto do produto/servico (sera compartilhado entre slides)",
  "objective": "",
  "palette": "vibrante" | "profissional" | "quente" | "elegante",
  "fontFamily": "Inter" | "Montserrat" | "Poppins" | "Bebas Neue" | "Playfair Display" | "Oswald" | "Raleway" | "Lato",
  "slides": [
    {
      "headline": "titulo curto e impactante (max 6 palavras)",
      "subtext": "texto de apoio curto (max 12 palavras)",
      "cta": "Compre agora" | "Saiba mais" | "Chame no WhatsApp" | "Confira" | "Aproveite" | "Garanta o seu" | "Agende agora" | "Acesse o link",
      "imagePrompt": "prompt detalhado em portugues para gerar a imagem deste slide especifico, coerente com o nicho, produto e mensagem"
    }
  ]
}

Regras:
- "slides" deve ter EXATAMENTE ${totalSlides} itens.
- Cada slide deve ter conteudo DIFERENTE, contando uma narrativa coerente${format === 'carousel' ? ' que leva o usuario a passar entre os slides' : ''}.
- Textos em portugues do Brasil, naturais, sem exageros.
- "imagePrompt" deve descrever cenario, iluminacao, enquadramento, paleta, mood - tudo coerente com o nicho de ${niche}.
- NAO inclua preco em texto se nao for promocao.
- NAO invente URLs ou numeros de telefone.`

      try {
        const rawPlan = await LLMService.generateText(llmPrompt)
        const cleaned = rawPlan.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        let plan: {
          productName: string
          objective: string
          palette: string
          fontFamily: string
          slides: Array<{ headline: string; subtext: string; cta: string; imagePrompt: string }>
        }
        try {
          plan = JSON.parse(cleaned)
        } catch {
          const m = cleaned.match(/[\[{][\s\S]*[\]}]/)
          if (m) plan = JSON.parse(m[0])
          else throw new Error('A IA retornou um formato inesperado. Tente novamente.')
        }

        // Garante N slides mesmo se a IA retornar menos/mais
        const slides = Array.isArray(plan.slides) ? plan.slides.slice(0, totalSlides) : []
        while (slides.length < totalSlides) {
          const last = slides[slides.length - 1] || { headline: '', subtext: '', cta: '', imagePrompt: '' }
          slides.push({ ...last })
        }

        return reply.send({
          productName: plan.productName || productName || '',
          objective: plan.objective || '',
          palette: plan.palette || 'vibrante',
          fontFamily: plan.fontFamily || 'Inter',
          slides,
        })
      } catch (err: any) {
        console.error('[generate-content-plan] error:', err)
        return reply.status(502).send({ error: err.message || 'Erro ao gerar conteudo com IA' })
      }
    },
  )

  // ── POST /generate-image ─────────────────────
  app.post(
    '/generate-image',
    async (
      request: FastifyRequest<{
        Body: {
          prompt: string
          format?: string
          carouselShape?: 'square' | 'vertical'
          referenceImage?: string // base64 dataURL (data:image/...;base64,xxx) - dica visual ao modelo
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { prompt, format, carouselShape, referenceImage } = request.body

      if (!prompt?.trim()) {
        return reply.status(400).send({ error: 'Prompt e obrigatorio' })
      }

      const accountId = process.env.R2_ACCOUNT_ID
      const apiToken = process.env.CLOUDFLARE_WORKER_KEY
      if (!accountId || !apiToken) {
        return reply.status(500).send({
          error: 'Cloudflare nao configurado. Verifique R2_ACCOUNT_ID e CLOUDFLARE_WORKER_KEY no .env.',
        })
      }

      // Map format to dimensions
      let width = 1024
      let height = 1024
      if (format === 'stories' || format === 'reels') {
        width = 768
        height = 1344
      } else if (format === 'carousel') {
        if (carouselShape === 'vertical') {
          width = 1024
          height = 1280 // aprox 4:5 (1080x1350)
        } else {
          width = 1024
          height = 1024
        }
      }

      // Cloudflare lucid-origin atualmente nao aceita image2image nativo.
      // Quando ha imagem de referencia, reforcamos no prompt que o modelo
      // deve replicar estilo/mood/composicao da referencia.
      const effectivePrompt = referenceImage
        ? `${prompt}\n\nNota: o usuario anexou uma imagem de referencia. Reproduza fielmente a paleta, mood, composicao, estilo de iluminacao e tipo de enquadramento dessa referencia.`
        : prompt

      try {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/leonardo/lucid-origin`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: effectivePrompt, width, height }),
          },
        )

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          console.error('[cloudflare-image] API error:', res.status, errData)
          if (res.status === 429) {
            return reply.status(429).send({ error: 'Limite de requisicoes atingido. Aguarde alguns minutos e tente novamente.' })
          }
          return reply.status(502).send({ error: 'Erro ao gerar imagem com Cloudflare AI' })
        }

        const contentType = res.headers.get('content-type') || ''

        // Handle JSON response (Cloudflare may wrap in JSON envelope)
        if (contentType.includes('application/json')) {
          const data = await res.json() as any
          // Try common JSON shapes: { result: { image: "base64" } } or { image: "base64" }
          const b64 = data?.result?.image || data?.image || data?.result
          if (typeof b64 === 'string') {
            const prefix = b64.startsWith('data:') ? '' : 'data:image/png;base64,'
            return reply.send({ image: `${prefix}${b64}` })
          }
          console.error('[cloudflare-image] Unexpected JSON shape:', JSON.stringify(data).slice(0, 500))
          return reply.status(502).send({ error: 'Resposta inesperada da Cloudflare AI' })
        }

        // Binary PNG response
        const buffer = Buffer.from(await res.arrayBuffer())
        const b64 = buffer.toString('base64')

        return reply.send({
          image: `data:image/png;base64,${b64}`,
        })
      } catch (err) {
        console.error('[cloudflare-image] Error:', err)
        return reply.status(502).send({ error: 'Erro de conexao com Cloudflare AI' })
      }
    },
  )
}
