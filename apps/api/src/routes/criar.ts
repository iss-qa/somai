import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Card, Company, Gamificacao, FalUsage, AppSettings } from '@soma-ai/db'
import { CardStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import { fal } from '@fal-ai/client'
import { StorageService } from '../services/storage.service'
import { GamificacaoService } from '../services/gamificacao.service'
import { LLMService } from '../services/llm.service'
import { Types } from 'mongoose'

const CREDITO_CUSTO_SLIDE = 15
const CREDITO_CUSTO_REFINAR = 1
const REFINES_GRATUITOS = 3

// Modelo ativo + custo real (USD) — mantem em sync com fal.ai pricing
const FAL_MODEL = 'fal-ai/ideogram/v2/turbo'
const FAL_COST_USD = 0.05

// Bloqueio preventivo: se saldo fal.ai estimado < MIN_FAL_BALANCE, bloqueia novas geracoes
const MIN_FAL_BALANCE = 0.5

const FORMAT_SIZE: Record<string, { width: number; height: number; aspect: string }> = {
  post_portrait: { width: 1080, height: 1350, aspect: '4:5' },
  carrossel_portrait: { width: 1080, height: 1350, aspect: '4:5' },
  stories_unico: { width: 1080, height: 1920, aspect: '9:16' },
  stories_carrossel: { width: 1080, height: 1920, aspect: '9:16' },
  post_facebook: { width: 1080, height: 1350, aspect: '4:5' },
}

function ensureFalConfigured() {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY nao configurada')
  fal.config({ credentials: key })
}

export default async function criarRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── POST /refinar-prompt ── expande ideia do usuário em briefing estruturado ──
  app.post(
    '/refinar-prompt',
    async (
      request: FastifyRequest<{
        Body: {
          ideia: string
          formato: string
          objetivo: string
          abordagem?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { ideia, formato, objetivo, abordagem } = request.body || {}
      if (!ideia) {
        return reply.status(400).send({ error: 'ideia e obrigatoria' })
      }

      // Gate por creditos: primeiros REFINES_GRATUITOS sao free, depois 1 credito por refine
      const gam: any = await Gamificacao.findOne({
        company_id: new Types.ObjectId(companyId),
      }).lean()
      const refinesUsados = gam?.promptsRefinados || 0
      const isFree = refinesUsados < REFINES_GRATUITOS
      const creditosAtuais = gam?.creditos || 0
      if (!isFree && creditosAtuais < CREDITO_CUSTO_REFINAR) {
        return reply.status(402).send({
          error: 'Creditos insuficientes para refinar o prompt',
          code: 'INSUFFICIENT_CREDITS',
          needed: CREDITO_CUSTO_REFINAR,
          balance: creditosAtuais,
        })
      }

      const company: any = await Company.findById(companyId).lean()
      const handle = company?.instagramHandle
        ? `@${String(company.instagramHandle).replace(/^@/, '')}`
        : company?.name || ''

      const prompt = `Voce e um diretor criativo. Transforme a ideia do usuario em um briefing completo de post ${formato} com objetivo "${objetivo}".

MARCA:
- Nome: ${company?.name || ''}
- Handle: ${handle}
- Descricao: ${company?.marca?.descricao || ''}
- Tom de voz: ${(company?.identidade?.tomDeVoz || []).join(', ')}
- Publico: ${company?.publico?.clienteIdeal || ''}
- Estilo visual: ${company?.estiloVisual?.estilo || ''}
- Paleta: ${(company?.estiloVisual?.paleta || []).join(', ')}
${abordagem ? `- Abordagem estrategica: ${abordagem}` : ''}

IDEIA DO USUARIO: "${ideia}"

Retorne EXATAMENTE nesta estrutura markdown (sem cercas de codigo, sem H1, sem introducao):

**Objetivo do Post:**
(1 paragrafo curto explicando o objetivo do post e o que se espera gerar no publico)

**Headline:**
    * (1 titulo curto, impactante, MAIUSCULO, max 10 palavras, com ponto de interrogacao ou exclamacao se fizer sentido)

**Corpo do Texto:**
    * (bullet 1 — beneficio ou convite, ate 12 palavras)
    * (bullet 2 — ganho emocional ou prova, ate 12 palavras)
    * (bullet 3 — reforco de urgencia ou exclusividade, ate 12 palavras)

**Elementos Visuais:**
    * (composicao geral — minimalista/luxuoso/moderno, alinhada ao estilo da marca)
    * (elemento central — produto, objeto simbolico ou fotografia humana)
    * (detalhe humanizante — maos, gesto, pessoa real segurando/usando)
    * (efeitos — particulas, bokeh, luz, sombra, gradiente da paleta da marca)
    * (tipografia e moldura — fina, elegante, coerente com identidade)

**Call-to-Action (CTA):**
    * (instrucao direta e mensuravel, usando o handle ${handle} ao final, ex: Comente "X" e receba Y no direct de ${handle})

Regras:
- Portugues do Brasil.
- Tom consistente com o tom de voz da marca.
- Sem explicar o que voce fez. Sem comentarios extras. Apenas o briefing.`

      try {
        const text = await LLMService.generateText(prompt)

        // Contabiliza o refine (incrementa contador, debita credito se nao-free)
        await Gamificacao.updateOne(
          { company_id: new Types.ObjectId(companyId) },
          {
            $inc: {
              promptsRefinados: 1,
              ...(isFree ? {} : { creditos: -CREDITO_CUSTO_REFINAR }),
            },
          },
        )

        const novoSaldo = isFree
          ? creditosAtuais
          : creditosAtuais - CREDITO_CUSTO_REFINAR
        return reply.send({
          prompt: text.trim(),
          freeRefinesRestantes: Math.max(0, REFINES_GRATUITOS - refinesUsados - 1),
          creditosRestantes: novoSaldo,
        })
      } catch (err: any) {
        request.log.error(err, '[criar] refinar-prompt falhou')
        return reply.status(503).send({
          error: 'Servico de IA temporariamente indisponivel. Tente novamente em instantes.',
          code: 'AI_UNAVAILABLE',
        })
      }
    },
  )

  // ── POST /gerar-imagem ── gera imagem via fal.ai Ideogram v2, debita credito, cria Card ──
  app.post(
    '/gerar-imagem',
    async (
      request: FastifyRequest<{
        Body: {
          prompt: string
          formato: string
          objetivo: string
          ideia?: string
          abordagem?: string
          referenceImageUrl?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { prompt, formato, objetivo, ideia, abordagem, referenceImageUrl } =
        request.body || {}
      if (!prompt?.trim()) {
        return reply.status(400).send({ error: 'prompt e obrigatorio' })
      }
      if (!formato || !FORMAT_SIZE[formato]) {
        return reply.status(400).send({ error: 'formato invalido' })
      }

      const estado = await GamificacaoService.getEstado(companyId)
      if ((estado.creditos || 0) < CREDITO_CUSTO_SLIDE) {
        return reply.status(402).send({
          error: 'Creditos insuficientes',
          code: 'INSUFFICIENT_CREDITS',
          needed: CREDITO_CUSTO_SLIDE,
          balance: estado.creditos || 0,
        })
      }

      // Bloqueio preventivo: saldo fal.ai estimado < MIN
      const balanceEstimado = await calcularSaldoFalEstimado()
      if (balanceEstimado !== null && balanceEstimado < MIN_FAL_BALANCE) {
        request.log.warn(
          { balance: balanceEstimado },
          '[criar] saldo fal.ai baixo — bloqueando geracao',
        )
        return reply.status(503).send({
          error:
            'Servico de geracao de imagem temporariamente indisponivel. Contate o suporte.',
          code: 'FAL_BALANCE_LOW',
        })
      }

      const size = FORMAT_SIZE[formato]
      // Ideogram v2 nao aceita 4:5 — usamos 3:4 (mais proximo pra post_portrait)
      const aspectRatio: '9:16' | '3:4' = size.aspect === '9:16' ? '9:16' : '3:4'

      const company: any = await Company.findById(companyId)
        .select('name')
        .lean()

      try {
        ensureFalConfigured()

        const result: any = await fal.subscribe(FAL_MODEL, {
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            expand_prompt: true,
            style: 'auto',
            negative_prompt: 'low quality, blurry, watermark, text errors, distorted text',
            ...(referenceImageUrl ? { image_url: referenceImageUrl } : {}),
          },
          logs: false,
        })

        const imageUrl: string | undefined =
          result?.data?.images?.[0]?.url ||
          result?.images?.[0]?.url
        if (!imageUrl) {
          request.log.error({ result }, '[criar] fal.ai retornou sem url')
          return reply.status(500).send({ error: 'Geracao de imagem falhou' })
        }

        // Download e re-upload pro R2 (pra nao depender do fal.ai storage)
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) {
          return reply
            .status(500)
            .send({ error: 'Falha ao baixar imagem gerada' })
        }
        const buf = Buffer.from(await imgRes.arrayBuffer())
        const contentType = imgRes.headers.get('content-type') || 'image/png'
        const dataUrl = `data:${contentType};base64,${buf.toString('base64')}`
        const publicUrl = await StorageService.uploadBase64Media(dataUrl, 'cards')

        // Cria Card
        const card = await Card.create({
          company_id: companyId,
          format: `${size.width}x${size.height}`,
          post_type: formato,
          headline: '',
          subtext: '',
          cta: '',
          caption: ideia || '',
          hashtags: [],
          status: CardStatus.Draft,
          ai_prompt_used: prompt,
          generated_image_url: publicUrl,
        })

        // Debita creditos (apos sucesso)
        await GamificacaoService.emitir(companyId, 'manual', {
          creditos: -CREDITO_CUSTO_SLIDE,
          descricao: `Geracao de imagem (${formato})`,
          refId: String(card._id),
        })
        // Tambem registra XP de post gerado
        await GamificacaoService.emitir(companyId, 'gerar_post', {
          refId: String(card._id),
        })

        // Log de uso fal.ai (pra painel admin)
        await FalUsage.create({
          company_id: companyId,
          company_name: company?.name || '',
          model_name: FAL_MODEL,
          cost_usd: FAL_COST_USD,
          card_id: card._id,
          format: formato,
          success: true,
          error_message: '',
        })

        const estadoFinal = await GamificacaoService.getEstado(companyId)

        return reply.send({
          cardId: String(card._id),
          imageUrl: publicUrl,
          creditosRestantes: estadoFinal.creditos || 0,
        })
      } catch (err: any) {
        request.log.error(err, '[criar] gerar-imagem falhou')
        const raw = String(err?.message || '')
        // Loga falha sem custo (fal.ai nao cobra quando falha antes de gerar)
        try {
          await FalUsage.create({
            company_id: companyId,
            company_name: company?.name || '',
            model_name: FAL_MODEL,
            cost_usd: 0,
            card_id: null,
            format: formato,
            success: false,
            error_message: raw.slice(0, 500),
          })
        } catch {}
        return reply.status(500).send({ error: raw || 'Erro ao gerar imagem' })
      }
    },
  )
}

/**
 * Calcula saldo restante estimado do fal.ai.
 * Formula: saldo_comprado - soma(FalUsage.cost_usd com success=true)
 * Retorna null se nao houver saldo comprado cadastrado (disable bloqueio).
 */
async function calcularSaldoFalEstimado(): Promise<number | null> {
  const setting: any = await AppSettings.findOne({ key: 'fal_balance_purchased' }).lean()
  if (!setting || typeof setting.value !== 'number') return null

  const gasto = await FalUsage.aggregate([
    { $match: { success: true } },
    { $group: { _id: null, total: { $sum: '$cost_usd' } } },
  ])
  const totalGasto = gasto[0]?.total || 0
  return Math.max(0, setting.value - totalGasto)
}
