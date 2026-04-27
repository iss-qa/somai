import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Card, Company, Gamificacao, FalUsage } from '@soma-ai/db'
import { CardStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import OpenAI from 'openai'
import { StorageService } from '../services/storage.service'
import { GamificacaoService } from '../services/gamificacao.service'
import { LLMService } from '../services/llm.service'
import { Types } from 'mongoose'

const CREDITO_CUSTO_SLIDE = 15
const CREDITO_CUSTO_REFINAR = 1
const REFINES_GRATUITOS = 3

// gpt-image-1 medium portrait 1024x1536 = $0.063/imagem
const OPENAI_IMAGE_MODEL = 'gpt-image-1'
const OPENAI_IMAGE_COST_USD = 0.063

const NICHE_CONTEXT: Record<string, string> = {
  farmacia: 'pharmacy and health products retail',
  pet: 'pet shop and animal care',
  moda: 'fashion and clothing retail',
  cosmeticos: 'cosmetics and beauty products',
  mercearia: 'grocery and food retail',
  calcados: 'footwear retail',
  restaurante: 'restaurant and food service',
  confeitaria: 'bakery and confectionery',
  hamburgueria: 'burger restaurant and fast food',
  cafeteria: 'coffee shop and café',
  suplementos: 'sports nutrition and supplements',
  estetica: 'aesthetics and beauty clinic',
  odontologia: 'dental clinic and oral health',
  academia: 'gym and fitness training',
  salao_beleza: 'hair salon and beauty services',
  barbearia: 'barbershop and men grooming',
  imobiliaria: 'real estate and property',
  educacao: 'education, courses and training',
  arquitetura: 'architecture and interior design',
  contabilidade: 'accounting and financial services',
  viagens: 'travel and tourism',
  eletronicos: 'electronics and tech retail',
  decoracao: 'home decor and furniture',
  papelaria: 'stationery and office supplies',
  automotivo: 'automotive services and parts',
  construcao: 'construction and civil engineering',
  igreja: 'church and religious community',
  advocacia: 'law firm and legal services',
  saude: 'health and wellness services',
  tecnologia: 'technology and software',
  consultoria: 'business consulting and strategy',
  fotografia: 'photography and visual services',
  joalheria: 'jewelry and luxury accessories',
  floricultura: 'florist and floral arrangements',
  otica: 'optical store and eyewear',
  outro: 'Brazilian business',
}

const ESTILO_EN: Record<string, string> = {
  minimalista: 'minimalist clean-line',
  colorido: 'vibrant and colorful',
  elegante: 'elegant and luxurious',
  moderno: 'contemporary modern',
  rustico: 'rustic artisan-crafted',
  feminino: 'feminine soft-modern',
  corporativo: 'corporate professional',
}

const FORMAT_SIZE: Record<string, { width: number; height: number; aspect: string }> = {
  post_portrait: { width: 1080, height: 1350, aspect: '4:5' },
  carrossel_portrait: { width: 1080, height: 1350, aspect: '4:5' },
  stories_unico: { width: 1080, height: 1920, aspect: '9:16' },
  stories_carrossel: { width: 1080, height: 1920, aspect: '9:16' },
  post_facebook: { width: 1080, height: 1350, aspect: '4:5' },
  whatsapp_status: { width: 1080, height: 1920, aspect: '9:16' },
  whatsapp_landscape: { width: 1200, height: 630, aspect: '1.91:1' },
}

function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY nao configurada')
  return new OpenAI({ apiKey: key })
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

      const corPrimaria = company?.brand_colors?.primary || ''
      const corSecundaria = company?.brand_colors?.secondary || ''
      const corAcento = company?.brand_colors?.accent || ''
      const hexColors = [corPrimaria, corSecundaria, corAcento].filter(Boolean).join(', ')

      const formatInfo = FORMAT_SIZE[formato] || FORMAT_SIZE['post_portrait']
      const dimensoes = `${formatInfo.width}x${formatInfo.height}px (${formatInfo.aspect})`
      const estiloVisual = company?.estiloVisual?.estilo || 'moderno'
      const fontes = company?.estiloVisual?.fontes || 'sans-serif moderna (Poppins, Inter ou equivalente)'

      const prompt = `Voce e um diretor criativo senior e prompt engineer especializado em social media brasileiro e geracao de imagens por IA (Ideogram, Midjourney, DALL-E). Transforme a ideia do usuario em um briefing COMPLETO e ALTAMENTE DETALHADO de post ${formato} com objetivo "${objetivo}".

DADOS COMPLETOS DA MARCA:
- Nome: ${company?.name || ''}
- Handle: ${handle}
- Segmento: ${company?.niche || ''}
- Descricao: ${company?.marca?.descricao || ''}
- Diferencial: ${company?.marca?.diferencial || ''}
- Produtos/Servicos: ${company?.marca?.produtosServicos || ''}
- Tom de voz: ${(company?.identidade?.tomDeVoz || []).join(', ')}
- Personalidade: ${company?.identidade?.personalidade || ''}
- Publico-alvo: ${company?.publico?.clienteIdeal || ''}
- Dores do publico: ${company?.publico?.dores || ''}
- Desejos do publico: ${company?.publico?.desejos || ''}
- Estilo visual: ${estiloVisual}
- Descricao visual: ${company?.estiloVisual?.descricao || ''}
- Paleta de cores: ${company?.estiloVisual?.paleta || ''}
- Cor primaria (hex): ${corPrimaria || 'nao definida'}
- Cor secundaria (hex): ${corSecundaria || 'nao definida'}
- Cor de acento (hex): ${corAcento || 'nao definida'}
- Cores (hex combinadas): ${hexColors || 'nao definidas'}
- Fontes: ${fontes}
${abordagem ? `- Abordagem estrategica: ${abordagem}` : ''}

IDEIA DO USUARIO: "${ideia}"
FORMATO: ${formato} — dimensoes ${dimensoes}

Retorne EXATAMENTE nesta estrutura markdown (sem cercas de codigo, sem H1, sem introducao):

**Objetivo do Post:**
(1 paragrafo curto explicando o objetivo do post e o que se espera gerar no publico)

**Headline:**
    * (1 titulo curto, impactante, MAIUSCULO, max 10 palavras, com ponto de interrogacao ou exclamacao)

**Corpo do Texto:**
    * (bullet 1 — beneficio ou convite, ate 12 palavras)
    * (bullet 2 — ganho emocional ou prova, ate 12 palavras)
    * (bullet 3 — reforco de urgencia ou exclusividade, ate 12 palavras)

**Elementos Visuais:**
    * (composicao e layout — metade superior foto real / full-bleed com gradiente / 3D render — especifique)
    * (sujeito e cena — pessoa ou produto, contexto demografico do publico-alvo, acao ou emocao especifica)
    * (direcao de luz — rim lighting lateral, bokeh, golden hour, studio lighting — seja especifico)
    * (emocao e narrativa visual — o que a cena faz o espectador sentir imediatamente ao ver)
    * (elemento diferenciador — o que torna esta imagem unica e reconhecivel para esta marca)

**[MEDIUM & FORMAT]:**
    * (Ultra-high quality vertical image, ${dimensoes}. Especifique o estilo de render: photorealistic 3D render / editorial photo / flat illustration / mixed media — escolha o que combina com o estilo "${estiloVisual}" da marca e com a cena)
    * (Render engine ou estetica de referencia — ex: Cinema 4D / Octane quality aesthetic, editorial photography 85mm f/1.4, flat vector minimalist)

**[COLOR PALETTE — USE EXACTLY]:**
    * Primary background: ${corPrimaria ? corPrimaria + ' — use para fundo e paineis principais' : '(derive da paleta da marca para o fundo e paineis principais)'}
    * Accent / highlight: ${corAcento || corSecundaria ? (corAcento || corSecundaria) + ' — use em elementos-chave e CTA' : '(derive da paleta da marca para elementos-chave e CTA)'}
    * Text headline: branco #FFFFFF — alto contraste garantido
    * Text body: branco suave ou clara da marca — especifique opacity se aplicavel
    * Glow / efeitos: (especifique cores de brilho, gradientes diagonais e opacidades — ex: cyan #00C6FF com 60% bloom)
    * (Use os hexadecimais exatos da marca listados acima. Nao invente cores fora da paleta.)

**[COMPOSITION & LAYOUT]:**
    * Top zone (primeiros 15%): reservado para logo — (especifique: centralizado ou canto esquerdo, versao branca com drop shadow, separador dourado ou da marca abaixo)
    * Center zone (55%): hero visual — (descricao detalhada do elemento visual principal: posicionamento, efeitos 3D / fotografia, profundidade de campo, particulas, bokeh, elementos flutuantes)
    * Bottom zone (30%): bloco de texto + CTA — (especifique: glassmorphism card com blur 20px e borda 1px branca, ou painel solido na cor da marca, ou gradiente — inclua opacidades)
    * Hierarquia de leitura: (descreva o caminho do olhar — ex: imagem hero → headline → bullets com icones → botao CTA)
    * Perspectiva / angulo de camera: (ex: visao frontal simetrica, angulo ligeiramente elevado, perspectiva dinamica de baixo para cima)

**[LIGHTING & ATMOSPHERE]:**
    * Primary light: (fonte principal — ex: topo-centro, luz branca fria, simulando studio spotlight de alta potencia)
    * Secondary fill: (luz de preenchimento — ex: lateral esquerda, dourado quente, criando contraste e profundidade)
    * Rim / edge lighting: (luz de contorno nos sujeitos — ex: brilho ciano nas bordas para efeito futurista ou luz dourada suave para efeito aspiracional)
    * Vinheta: (ex: escurecimento suave nas bordas para direcionar o foco ao centro)
    * Overall mood: (descreva o sentimento final — ex: Confiante, moderno, aspiracional — "o futuro chegou")

**[TYPOGRAPHY RULES]:**
    * Headline: Bold condensed sans-serif, branco #FFFFFF, equivalente a ~72px, MAIUSCULO, letter-spacing 2px, zero deformacao
    * Corpo: Regular sans-serif, branco suave, equivalente a ~32px, line-height 1.4, alinhamento perfeito
    * CTA button text: Bold, alta legibilidade, ~34px, cor em contraste maximo com o fundo do botao
    * Fonte de referencia: ${fontes}
    * Regra absoluta: Texto razor-sharp, anti-aliased, sem warp ou stretch. Caracteres portugueses preservados exatamente: ã, ç, é, â, ô, ú, í — NUNCA alterar acentos
    * Espacamento: tracking generoso no headline, confortavel no corpo — nao comprimir letras

**[LOGO PLACEMENT]:**
    * Posicao: (topo central ou topo esquerdo — baseie na composicao descrita acima)
    * Versao: branca com drop shadow suave, ou versao colorida adequada ao fundo escuro
    * Separador: linha fina na cor de acento da marca abaixo do logo como divisor de marca
    * Clear space: minimo 40px em todos os lados — NENHUM elemento pode invadir esta area
    * Proibido: nao distorcer, nao recolorir, nao sobrepor com outros elementos graficos

**[NEGATIVE PROMPT]:**
    * (liste especificamente o que a IA NAO deve gerar para esta imagem — ex: texto borrado, rostos distorcidos, maos em posicoes anatomicamente incorretas, visual cartunesco ou infantil, cores saturadas fora da paleta da marca, logotipos genericos ou falsos, qualidade pixelada, sombras duras demais, multiplos layouts colados, look de stock photo generico, lorem ipsum, letras aleatorias, texto ilegivel, fundos planos e sem textura)

**[FINAL FEEL]:**
    * (1-2 frases descrevendo a sensacao geral que a imagem deve transmitir ao ser vista no feed do Instagram. Quem passa o dedo deve parar e pensar: "O que eh isso? Quero saber mais." — descreva isso em termos de emocao, qualidade e posicionamento de marca)

**Call-to-Action (CTA):**
    * (instrucao direta e mensuravel, usando o handle ${handle} ao final — ex: Comente "PALAVRA" e receba X no direct de ${handle})

Regras absolutas:
- Portugues do Brasil. Tom consistente com a marca.
- Cada secao [SECTION] deve ser rica, especifica e diretamente utilizavel por uma IA de geracao de imagem profissional.
- Use os hexadecimais reais da marca sempre que disponivel — nunca invente cores.
- Os Elementos Visuais e todas as secoes tecnicas devem guiar a IA com precisao cirurgica.
- Sem explicar o que voce fez. Sem comentarios extras. Apenas o briefing completo.`

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

      const size = FORMAT_SIZE[formato]
      // gpt-image-1 suporta: 1024x1024, 1024x1536, 1536x1024
      const openAISize = '1024x1536' // portrait para todos os formatos

      const company: any = await Company.findById(companyId).lean()

      const briefing = parseBriefing(prompt)
      const { visualPrompt } = buildVisualPrompt({ briefing, company, objetivo, abordagem })

      try {
        const openai = getOpenAIClient()

        const imageResponse = await openai.images.generate({
          model: OPENAI_IMAGE_MODEL,
          prompt: visualPrompt,
          size: openAISize as any,
          quality: 'medium' as any,
          n: 1,
        })

        const b64Json = imageResponse.data?.[0]?.b64_json
        if (!b64Json) {
          request.log.error({ imageResponse }, '[criar] openai retornou sem imagem')
          return reply.status(500).send({ error: 'Geracao de imagem falhou' })
        }

        const dataUrl = `data:image/png;base64,${b64Json}`
        const publicUrl = await StorageService.uploadBase64Media(dataUrl, 'cards')

        const headlineLimpa = sanitizeShort(briefing.headline) || derivarHeadline(ideia)
        // Cards IA ja entram como aprovados — o briefing foi refinado pela IA
        // e a imagem gerada, entao estao prontos para agendar/publicar.
        const card = await Card.create({
          company_id: companyId,
          format: `${size.width}x${size.height}`,
          post_type: formato,
          headline: headlineLimpa,
          subtext: briefing.bullets[0] || '',
          cta: briefing.cta || '',
          caption: ideia || '',
          hashtags: [],
          status: CardStatus.Approved,
          approved_at: new Date(),
          source: 'ai',
          ai_prompt_used: prompt,
          generated_image_url: publicUrl,
        })

        await GamificacaoService.emitir(companyId, 'manual', {
          creditos: -CREDITO_CUSTO_SLIDE,
          descricao: `Geracao de imagem (${formato})`,
          refId: String(card._id),
        })
        await GamificacaoService.emitir(companyId, 'gerar_post', {
          refId: String(card._id),
        })

        await FalUsage.create({
          company_id: companyId,
          company_name: company?.name || '',
          model_name: OPENAI_IMAGE_MODEL,
          cost_usd: OPENAI_IMAGE_COST_USD,
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
        try {
          await FalUsage.create({
            company_id: companyId,
            company_name: company?.name || '',
            model_name: OPENAI_IMAGE_MODEL,
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

type Briefing = {
  objetivo: string
  headline: string
  bullets: string[]
  visual: string[]
  cta: string
  medium: string[]
  palette: string[]
  composition: string[]
  lighting: string[]
  typography: string[]
  logoPlacement: string[]
  negativePrompt: string[]
  finalFeel: string[]
}

/**
 * Parseia o briefing markdown gerado pelo /refinar-prompt em secoes estruturadas.
 * Suporta tanto secoes classicas (**Headline:**) quanto secoes tecnicas (**[SECTION]:**).
 */
function parseBriefing(md: string): Briefing {
  // Secoes classicas: **Label:**
  const get = (label: string) => {
    const re = new RegExp(`\\*\\*${label}:\\*\\*([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`, 'i')
    const m = md.match(re)
    return m ? m[1].trim() : ''
  }
  // Secoes tecnicas: **[LABEL...]:**  (ex: **[COLOR PALETTE — USE EXACTLY]:**)
  const getBracket = (keyword: string) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\*\\*\\[[^\\]]*${escaped}[^\\]]*\\][^:]*:\\*\\*([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`, 'i')
    const m = md.match(re)
    return m ? m[1].trim() : ''
  }
  const bulletsOf = (block: string) =>
    block
      .split('\n')
      .map((l) => l.replace(/^[\s\*\-•]+/, '').trim())
      .filter((l) => l && !/^\(.*\)$/.test(l))

  const headlineBlock = get('Headline')
  const headline = bulletsOf(headlineBlock)[0] || headlineBlock.trim()

  return {
    objetivo: get('Objetivo do Post').replace(/\n+/g, ' ').trim(),
    headline,
    bullets: bulletsOf(get('Corpo do Texto')),
    visual: bulletsOf(get('Elementos Visuais')),
    cta: bulletsOf(get('Call-to-Action \\(CTA\\)'))[0] || '',
    medium: bulletsOf(getBracket('MEDIUM')),
    palette: bulletsOf(getBracket('COLOR PALETTE')),
    composition: bulletsOf(getBracket('COMPOSITION')),
    lighting: bulletsOf(getBracket('LIGHTING')),
    typography: bulletsOf(getBracket('TYPOGRAPHY')),
    logoPlacement: bulletsOf(getBracket('LOGO PLACEMENT')),
    negativePrompt: bulletsOf(getBracket('NEGATIVE PROMPT')),
    finalFeel: bulletsOf(getBracket('FINAL FEEL')),
  }
}

function sanitizeShort(s: string, max = 80): string {
  if (!s) return ''
  return s.replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function derivarHeadline(ideia?: string): string {
  if (!ideia) return 'Novo post'
  const limpa = ideia.replace(/\s+/g, ' ').trim()
  if (limpa.length <= 60) return limpa
  return limpa.slice(0, 60).replace(/[\s,.;:]+\S*$/, '') + '…'
}

/**
 * Constroi um prompt visual otimizado pro Ideogram a partir do briefing parseado.
 * Prompt em inglês — Ideogram tem performance bem melhor em texto/layout em inglês.
 * Incorpora as secoes tecnicas detalhadas ([COLOR PALETTE], [COMPOSITION], etc.)
 * geradas pelo LLM no /refinar-prompt quando presentes.
 * Retorna { visualPrompt, negativePromptExtra } para enriquecer o negative_prompt do fal.ai.
 */
function buildVisualPrompt({
  briefing,
  company,
  objetivo,
  abordagem,
}: {
  briefing: Briefing
  company: any
  objetivo?: string
  abordagem?: string
}): { visualPrompt: string; negativePromptExtra: string } {
  // ── Brand identity ───────────────────────────────────────────────────────
  const estilo = company?.estiloVisual?.estilo || 'moderno'
  const estiloEn = ESTILO_EN[estilo] || 'contemporary modern'
  const niche = company?.niche || ''
  const nicheCtx = NICHE_CONTEXT[niche] || niche || 'Brazilian business'

  const paletaText = (company?.estiloVisual?.paleta as string) || ''
  const coresArr = ((company?.estiloVisual?.cores || []) as string[]).filter(Boolean)
  const hexColors = [
    company?.brand_colors?.primary,
    company?.brand_colors?.secondary,
    company?.brand_colors?.accent,
  ].filter(Boolean) as string[]
  const allColors = [...new Set([...coresArr, ...hexColors, ...paletaText.split(/[,;]/).map((s: string) => s.trim())])].filter(Boolean).slice(0, 6)
  const colorBlock = allColors.length ? allColors.join(', ') : ''

  const marcaDescricao = (company?.marca?.descricao as string) || ''
  const marcaDiferencial = (company?.marca?.diferencial as string) || ''
  const marcaProdutos = (company?.marca?.produtosServicos as string) || ''
  const personalidade = (company?.identidade?.personalidade as string) || ''
  const estiloDescricao = (company?.estiloVisual?.descricao as string) || ''
  const fontes = (company?.estiloVisual?.fontes as string) || ''
  const fontFamily = fontes || 'Inter or Poppins'

  const publicoIdeal = (company?.publico?.clienteIdeal as string) || ''
  const publicoDores = (company?.publico?.dores as string) || ''
  const publicoDesejos = (company?.publico?.desejos as string) || ''

  // ── Content from briefing ────────────────────────────────────────────────
  const headline = sanitizeShort(briefing.headline, 70)
  const bullets = briefing.bullets.slice(0, 3).map((b) => sanitizeShort(b, 80))
  const cta = sanitizeShort(briefing.cta, 60)
  const visual = briefing.visual.slice(0, 5).map((v) => sanitizeShort(v, 120))
  const hasBullets = bullets.length >= 2

  // ── Rich sections from detailed briefing (quando presentes) ──────────────
  const hasMedium = briefing.medium.length > 0
  const hasPalette = briefing.palette.length > 0
  const hasComposition = briefing.composition.length > 0
  const hasLighting = briefing.lighting.length > 0
  const hasTypography = briefing.typography.length > 0
  const hasLogoPlacement = briefing.logoPlacement.length > 0
  const hasFinalFeel = briefing.finalFeel.length > 0

  // ── Section builders ─────────────────────────────────────────────────────
  const brandDNA = [
    nicheCtx ? `${nicheCtx} brand` : '',
    marcaDescricao ? `Brand story: ${marcaDescricao}` : '',
    marcaDiferencial ? `Key differentiator: ${marcaDiferencial}` : '',
    marcaProdutos ? `Products/services offered: ${marcaProdutos}` : '',
    personalidade ? `Brand personality: ${personalidade}` : '',
    estiloDescricao ? `Visual identity: ${estiloDescricao}` : '',
  ].filter(Boolean).join('. ')

  // Color palette: prioriza as instrucoes detalhadas do briefing se presentes
  const colorDirective = hasPalette
    ? `EXACT COLOR PALETTE: ${briefing.palette.slice(0, 6).join('. ')}.`
    : colorBlock
      ? `Brand color palette — use these colors as dominant tones for panel backgrounds, button fills, accents and highlights: ${colorBlock}.`
      : ''

  // Medium & rendering: prioriza instrucoes do briefing se presentes
  const mediumDirective = hasMedium
    ? `MEDIUM & RENDER: ${briefing.medium.join('. ')}.`
    : ''

  // Photography/lighting: prioriza instrucoes detalhadas do briefing se presentes
  const lightingDirective = hasLighting
    ? `LIGHTING & ATMOSPHERE: ${briefing.lighting.join('. ')}.`
    : [
        'PHOTOGRAPHY: professional editorial, full-frame camera 85mm f/1.4.',
        'Shallow depth of field — subject sharp, background creamy bokeh.',
        'Dramatic rim lighting balanced by soft ambient fill.',
        publicoIdeal
          ? `Subject matches target: ${publicoIdeal}. Authentic Brazilian representation.`
          : 'Subject: authentic Brazilian person 25-40, natural appearance.',
        publicoDesejos
          ? `Scene conveys: "${publicoDesejos}" — aspiration, achievement.`
          : '',
        'No flat lighting, no harsh flash, warm studio or golden-hour only.',
      ].filter(Boolean).join(' ')

  // ARQUITETURA: A IA gera APENAS a cena fotografica (fundo/imagem). Logo, headline,
  // bullets e CTA sao adicionados client-side pelo editor de slides. Por isso o prompt
  // exclui qualquer renderizacao de texto/logo — eliminando alucinacoes tipograficas.

  // Composicao: descreve cena visual + zonas vazias para overlay client-side
  const layoutDirective = hasComposition
    ? `COMPOSITION: ${briefing.composition.join('. ')}. Leave clean empty zones in top-left for logo and bottom 45% for text panel — these areas will receive client-side overlays.`
    : 'COMPOSITION: Top 55% rich photographic hero scene with subject. Bottom 45% must be a clean solid colored panel or subtle gradient in brand colors — completely empty, no content, will receive text overlay client-side. Top-left ~15%×10% corner must be completely empty for logo overlay.'

  const sceneDetails = visual.length
    ? `SCENE: ${visual.join('. ')}.`
    : ''

  const comunicationGoal = [
    objetivo ? `Visual mood/goal: ${objetivo}.` : '',
    abordagem ? `Visual approach: ${abordagem}.` : '',
  ].filter(Boolean).join(' ')

  const finalFeelDirective = hasFinalFeel
    ? `OVERALL FEEL: ${briefing.finalFeel.join('. ')}.`
    : ''

  // PROIBICOES ABSOLUTAS: zero texto, zero logo, zero simbolos. Imagem 100% wordless.
  const safetyRules = [
    'ABSOLUTE PROHIBITION — ZERO TEXT IN IMAGE: do NOT render any letters, words, characters, numbers, digits, signs, captions, headlines, titles, subtitles, bullet points, button labels, CTAs, slogans, taglines, watermarks, signatures, URLs, handles, hashtags, phone numbers, prices, dates, addresses, lorem ipsum, scribbles, fake script, gibberish text, random letters, decorative typography, signage on objects, text on phones/screens, text on shirts/clothing, text on packages/products, billboards, store signs, license plates with readable letters, books with readable titles. The image must be 100% wordless and textless.',
    'ABSOLUTE PROHIBITION — ZERO LOGO/BRANDS: do NOT render any logo, brand mark, brand symbol, icon, monogram, badge, emblem, watermark, or app icon anywhere in the image. No fake brand identity. No invented logos. No real-world brand logos.',
    'OUTPUT: pure photographic background scene, ultra-high resolution, zero JPEG artifacts, agency-grade quality. The image is a clean visual canvas that will receive logo and text overlays from a separate editor.',
  ].join(' ')

  const visualPrompt = [
    `Pure photographic scene for Brazilian Instagram marketing background, ${estiloEn} aesthetic, magazine-quality.`,
    mediumDirective,
    brandDNA,
    colorDirective,
    lightingDirective,
    comunicationGoal,
    sceneDetails,
    layoutDirective,
    finalFeelDirective,
    safetyRules,
  ]
    .filter(Boolean)
    .join(' ')

  // negativePromptExtra mantido para compatibilidade — gpt-image-1 nao usa negative_prompt
  const negativePromptExtra = ''

  return { visualPrompt, negativePromptExtra }
}

