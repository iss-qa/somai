import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, Integration } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { EncryptionService } from '../services/encryption.service'
import { InstagramAnalysisService } from '../services/instagram-analysis.service'
import { WebsiteAnalysisService } from '../services/website-analysis.service'
import {
  BrandExtractionService,
  type BrandExtractionResult,
} from '../services/brand-extraction.service'

// Traduz erros do SDK do Gemini (quota / 429 / auth) em { status, message }
// curtos. Sem isso, o JSON bruto com `quotas[]` vaza pro front.
function mapGeminiError(err: any): { status: number; message: string } {
  const raw = String(err?.message || '')
  const lower = raw.toLowerCase()
  if (
    err?.status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    const retry = raw.match(/retry in ([\d.]+)s/i)
    const seconds = retry ? Math.ceil(Number(retry[1])) : null
    return {
      status: 429,
      message: seconds
        ? `Limite da IA atingido. Tente novamente em ~${seconds}s.`
        : 'Limite da IA atingido. Aguarde alguns segundos e tente novamente.',
    }
  }
  if (lower.includes('api key') || lower.includes('api_key') || err?.status === 401 || err?.status === 403) {
    return {
      status: 502,
      message: 'Chave da IA invalida ou sem permissao. Verifique GEMINI_API_KEY.',
    }
  }
  return { status: 500, message: 'Falha ao consultar a IA. Tente novamente em instantes.' }
}

export default async function onboardingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET /state ─── estado atual do onboarding ──
  app.get(
    '/state',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const company: any = await Company.findById(companyId).lean()
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }
      return reply.send({
        onboardingCompleto: !!company.onboardingCompleto,
        onboardingStep: company.onboardingStep || 'inicio',
        onboardingFonte: company.onboardingFonte || null,
        instagramConectado: !!company.instagramConectado,
        instagramHandle: company.instagramHandle || '',
        objetivo: company.objetivo || null,
        marca: company.marca || {},
        publico: company.publico || {},
        identidade: company.identidade || {},
        estiloVisual: company.estiloVisual || {},
      })
    },
  )

  // ── GET /meta/config ── config publica pro OAuth popup ──
  app.get(
    '/meta/config',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const appId = process.env.META_APP_ID || ''
      const redirectUri = process.env.META_ONBOARDING_REDIRECT_URI || ''
      return reply.send({
        appId,
        redirectUri,
        configured: !!appId && !!redirectUri,
      })
    },
  )

  // ── POST /analyze/instagram ── OAuth code → snapshot + extração ──
  app.post(
    '/analyze/instagram',
    async (
      request: FastifyRequest<{
        Body: { code: string; redirectUri: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { code, redirectUri } = request.body || {}
      if (!code || !redirectUri) {
        return reply
          .status(400)
          .send({ error: 'code e redirectUri sao obrigatorios' })
      }

      try {
        const snapshot = await InstagramAnalysisService.connectWithCode(
          code,
          redirectUri,
        )

        // Persiste token da página na Integration (não ainda como "integração completa",
        // só pra preservar o acesso e permitir publicação futura)
        const encryptedToken = EncryptionService.encrypt(
          snapshot.pageAccessToken,
        )
        await Integration.findOneAndUpdate(
          { company_id: companyId },
          {
            'meta.access_token': encryptedToken,
            'meta.instagram_account_id': snapshot.igAccountId,
            'meta.instagram_username': snapshot.profile.username || '',
            'meta.instagram_profile_url': snapshot.profile.username
              ? `https://www.instagram.com/${snapshot.profile.username}/`
              : '',
            'meta.facebook_page_id': snapshot.fbPageId,
            'meta.facebook_page_name': snapshot.fbPageName,
            'meta.facebook_page_url': `https://www.facebook.com/${snapshot.fbPageId}`,
            'meta.connected': true,
            'meta.connected_at': new Date(),
            'meta.last_verified_at': new Date(),
            'meta.status': 'ok',
            'meta.token_expires_at': null,
            updated_at: new Date(),
          },
          { new: true, upsert: true },
        )

        // Extração via Gemini
        const extraction = await BrandExtractionService.fromInstagram(snapshot)

        // Persiste como "pré-preenchimento" na Company
        await applyExtractionToCompany(companyId, extraction, {
          fonte: 'instagram',
          instagramHandle: snapshot.profile.username || '',
        })

        return reply.send({
          source: 'instagram',
          handle: snapshot.profile.username || '',
          profilePictureUrl: snapshot.profile.profile_picture_url || '',
          extraction,
        })
      } catch (err: any) {
        request.log.error(err, '[onboarding] falha em analyze/instagram')
        const mapped = mapGeminiError(err)
        return reply.status(mapped.status).send({ error: mapped.message })
      }
    },
  )

  // ── POST /analyze/website ── URL → screenshot → extração ──
  app.post(
    '/analyze/website',
    async (
      request: FastifyRequest<{ Body: { url: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { url } = request.body || { url: '' }
      if (!url) {
        return reply.status(400).send({ error: 'url e obrigatoria' })
      }

      try {
        const snapshot = await WebsiteAnalysisService.capture(url)
        const extraction = await BrandExtractionService.fromWebsite(snapshot)
        await applyExtractionToCompany(companyId, extraction, { fonte: 'site' })

        return reply.send({
          source: 'site',
          finalUrl: snapshot.finalUrl,
          logoUrl: snapshot.logoUrl,
          extraction,
        })
      } catch (err: any) {
        request.log.error(err, '[onboarding] falha em analyze/website')
        const mapped = mapGeminiError(err)
        return reply.status(mapped.status).send({ error: mapped.message })
      }
    },
  )

  // ── PUT /step/:key ── salva parcial de um passo do wizard ──
  app.put(
    '/step/:key',
    async (
      request: FastifyRequest<{
        Params: { key: string }
        Body: Record<string, any>
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      const { key } = request.params
      const body = request.body || {}

      const allowed = ['objetivo', 'marca', 'publico', 'identidade', 'estiloVisual']
      if (!allowed.includes(key)) {
        return reply.status(400).send({ error: 'Passo invalido' })
      }

      const update: Record<string, any> = {}
      if (key === 'objetivo') {
        update.objetivo = body.objetivo
      } else {
        update[key] = body
      }
      update.onboardingStep = key
      update.updated_at = new Date()

      await Company.findByIdAndUpdate(companyId, update, { new: true })
      return reply.send({ ok: true, step: key })
    },
  )

  // ── POST /complete ── conclui onboarding ──
  app.post(
    '/complete',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      // Só emite XP no primeiro complete (evita loop se chamado 2x)
      const atual: any = await Company.findById(companyId)
        .select('onboardingCompleto')
        .lean()
      const primeiraVez = !atual?.onboardingCompleto

      await Company.findByIdAndUpdate(companyId, {
        onboardingCompleto: true,
        onboardingStep: 'completo',
      })

      if (primeiraVez) {
        const { GamificacaoService } = await import(
          '../services/gamificacao.service'
        )
        void GamificacaoService.emitir(companyId, 'completar_wizard')
      }

      return reply.send({ ok: true })
    },
  )

  // ── POST /refine-style ── gera/refina descrição do estilo visual via Gemini ──
  app.post(
    '/refine-style',
    async (
      request: FastifyRequest<{
        Body: {
          marcaNome?: string
          objetivo?: string | null
          marca?: Record<string, any>
          publico?: Record<string, any>
          identidade?: Record<string, any>
          referenciaUrl?: string
          cores?: string[]
          descricaoAtual?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      try {
        const body = request.body || {}
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const key = process.env.GEMINI_API_KEY
        if (!key) {
          return reply.status(500).send({
            error: 'GEMINI_API_KEY nao configurada no servidor',
          })
        }

        const resumoMarca = [
          body.marcaNome ? `Nome: ${body.marcaNome}` : '',
          body.marca?.descricao ? `Faz: ${body.marca.descricao}` : '',
          body.marca?.diferencial ? `Diferencial: ${body.marca.diferencial}` : '',
          body.marca?.produtosServicos
            ? `Produtos/servicos: ${body.marca.produtosServicos}`
            : '',
          body.objetivo ? `Objetivo: ${body.objetivo}` : '',
          body.publico?.clienteIdeal
            ? `Cliente ideal: ${body.publico.clienteIdeal}`
            : '',
          body.identidade?.tomDeVoz?.length
            ? `Tom de voz: ${body.identidade.tomDeVoz.join(', ')}`
            : '',
          body.cores?.length ? `Cores: ${body.cores.join(', ')}` : '',
          body.descricaoAtual
            ? `Descricao atual (refinar): ${body.descricaoAtual}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')

        const prompt = `Voce e um diretor de arte. Gere UMA descricao curta (3 a 5 frases) do estilo visual de uma marca para guiar geracao de imagens por IA. Foque em tipografia, layout, tratamento fotografico e grafismos. Evite listar cores (elas ja sao definidas separadamente). Retorne APENAS o texto, sem aspas, sem markdown.

Dados da marca:
${resumoMarca || '(dados minimos)'}

Se houver "Descricao atual", polua e refine mantendo a essencia. Caso contrario, crie do zero.`

        const genAI = new GoogleGenerativeAI(key)
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
        })
        const result = await model.generateContent(prompt)
        const descricao = result.response.text().trim()

        await Company.findByIdAndUpdate(companyId, {
          'estiloVisual.descricao': descricao,
        })
        return reply.send({ descricao })
      } catch (err: any) {
        request.log.error(err, '[onboarding] falha em refine-style')
        const mapped = mapGeminiError(err)
        return reply.status(mapped.status).send({ error: mapped.message })
      }
    },
  )

  // ── POST /skip-analysis ── pula análise, vai direto ao wizard manual ──
  app.post(
    '/skip-analysis',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }
      await Company.findByIdAndUpdate(companyId, {
        onboardingFonte: 'manual',
        onboardingStep: 'objetivo',
      })
      return reply.send({ ok: true })
    },
  )
}

async function applyExtractionToCompany(
  companyId: string,
  extraction: BrandExtractionResult,
  meta: { fonte: 'instagram' | 'site'; instagramHandle?: string },
) {
  const update: Record<string, any> = {
    marca: extraction.marca,
    publico: extraction.publico,
    identidade: extraction.identidade,
    estiloVisual: extraction.estiloVisual,
    onboardingFonte: meta.fonte,
    onboardingStep: 'analise',
    updated_at: new Date(),
  }

  if (extraction.estiloVisual.cores && extraction.estiloVisual.cores.length > 0) {
    update['brand_colors.primary'] = extraction.estiloVisual.cores[0] || '#000000'
    if (extraction.estiloVisual.cores[1]) {
      update['brand_colors.secondary'] = extraction.estiloVisual.cores[1]
    }
    if (extraction.estiloVisual.cores[2]) {
      update['brand_colors.accent'] = extraction.estiloVisual.cores[2]
    }
  }

  if (extraction.estiloVisual.logoUrl) {
    update.logo_url = extraction.estiloVisual.logoUrl
  }
  if (extraction.marca.nome) {
    update.name = extraction.marca.nome
  }

  if (meta.fonte === 'instagram') {
    update.instagramConectado = true
    update.instagramHandle = meta.instagramHandle || ''
  }

  await Company.findByIdAndUpdate(companyId, update)
}
