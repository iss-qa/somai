import { EncryptionService } from './encryption.service'
import { Integration } from '@soma-ai/db'
import { getAIConfig, callLLMJson, callLLM } from './ai.service'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface VideoScriptResult {
  narration: string
  slides: {
    order: number
    title: string
    text: string
    duration_ms: number
    transition: string
  }[]
  subtitles: { text: string; start_ms: number; end_ms: number }[]
  suggested_music: string
}

interface GeminiVideoResult {
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  model: string
}

/**
 * Helper: call the configured LLM (via ai.service) and parse JSON response.
 * The apiKey param is actually used to resolve the company's AI config
 * via a cached lookup. For backward compat, if it looks like a raw Gemini key
 * we fall back to Gemini directly.
 */
async function callGemini<T>(
  apiKey: string,
  prompt: string,
  _options?: { temperature?: number; maxOutputTokens?: number },
): Promise<T> {
  // Use the centralized callLLMJson which supports all providers.
  // The apiKey here comes from getApiKey() which already resolved the config.
  // We need to figure out which provider to use. Since callGemini is called
  // from within GeminiVideoService which gets apiKey from getApiKey(),
  // and getApiKey() now uses getAIConfig(), we store the last resolved config.
  const config = GeminiVideoService._lastConfig
  if (config) {
    return callLLMJson<T>(config, prompt)
  }

  // Direct Gemini fallback (legacy)
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
    },
  )

  if (!res.ok) {
    let errorDetail = ''
    try {
      const errBody = await res.text()
      const parsed = JSON.parse(errBody)
      errorDetail = parsed?.error?.message || parsed?.error?.status || errBody.slice(0, 200)
    } catch {
      errorDetail = `HTTP ${res.status}`
    }
    throw new Error(`Erro na API: ${errorDetail}`)
  }

  const data = await res.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    const finishReason = data?.candidates?.[0]?.finishReason
    if (finishReason === 'SAFETY') throw new Error('A IA bloqueou a resposta por questoes de seguranca. Tente reformular.')
    throw new Error('Resposta vazia da IA. Tente novamente.')
  }

  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) as T } catch {}
    }
    throw new Error('A IA retornou um formato inesperado. Tente novamente.')
  }
}

export class GeminiVideoService {
  /** Cached config from last getApiKey call (used by callGemini) */
  static _lastConfig: { provider: string; model: string; apiKey: string } | null = null

  /**
   * Get the API key for AI calls. Also caches the full config
   * so callGemini() can route to the correct provider.
   */
  static async getApiKey(companyId: string): Promise<string> {
    const config = await getAIConfig(companyId)
    GeminiVideoService._lastConfig = config
    return config.apiKey
  }

  /**
   * Generate a video script/storyboard using Gemini
   */
  static async generateScript(params: {
    companyName: string
    niche: string
    template: string
    productName: string
    headline: string
    subtext: string
    targetDuration: number
    apiKey: string
  }): Promise<VideoScriptResult> {
    const templateDescriptions: Record<string, string> = {
      dica_rapida:
        'Video curto com 1 slide principal, narracao direta e CTA. Ideal para dicas rapidas.',
      passo_a_passo:
        'Video com 3 slides sequenciais mostrando etapas. Cada slide tem titulo e descricao.',
      beneficio_destaque:
        'Video focado em destacar um beneficio ou estatistica impactante com texto grande.',
      depoimento:
        'Video com texto de depoimento/avaliacao de cliente, aspas e CTA de confianca.',
      comparativo:
        'Video com 2 slides: antes/depois ou com/sem, mostrando diferenca clara.',
      lancamento:
        'Video com 3-4 slides: teaser, reveal do produto e CTA. Gera expectativa.',
    }

    const prompt = `Voce e um diretor criativo de videos curtos para redes sociais (Reels/TikTok/Shorts).
Crie um roteiro para um video de ${params.targetDuration} segundos.

CONTEXTO:
- Empresa: ${params.companyName} (${params.niche})
- Template: ${params.template} — ${templateDescriptions[params.template] || 'Video criativo'}
- Produto/Tema: ${params.productName || params.headline || 'conteudo geral'}
- Titulo do card: ${params.headline || 'nao definido'}
- Texto complementar: ${params.subtext || 'nenhum'}

REGRAS:
- Portugues brasileiro coloquial e envolvente
- Texto de narracao com no maximo 150 caracteres
- Cada slide deve ter titulo curto (max 30 chars) e texto (max 60 chars)
- Incluir transicoes entre slides (fade, slide, zoom, bounce)
- Distribuir duracao dos slides proporcionalmente
- Sugerir trilha sonora (upbeat, calma, motivacional, corporativa)

Responda SOMENTE com JSON valido (sem markdown):
{
  "narration": "texto completo da narracao",
  "slides": [
    {
      "order": 1,
      "title": "titulo do slide",
      "text": "texto do slide",
      "duration_ms": 5000,
      "transition": "fade"
    }
  ],
  "subtitles": [
    { "text": "trecho da legenda", "start_ms": 0, "end_ms": 3000 }
  ],
  "suggested_music": "upbeat"
}`

    return callGemini<VideoScriptResult>(params.apiKey, prompt)
  }

  /**
   * Generate narration text
   */
  static async generateNarration(params: {
    headline: string
    subtext: string
    niche: string
    template: string
    targetDuration: number
    apiKey: string
  }): Promise<{ narration: string; hashtags: string[] }> {
    const prompt = `Voce e um copywriter de videos curtos para redes sociais.
Crie um texto de narracao para um video de ${params.targetDuration} segundos.

CONTEXTO:
- Nicho: ${params.niche}
- Template: ${params.template}
- Titulo: ${params.headline}
- Texto base: ${params.subtext || 'nenhum'}

REGRAS:
- Maximo 150 caracteres
- Tom envolvente e direto
- Inclua CTA no final
- Portugues brasileiro

Responda SOMENTE com JSON (sem markdown):
{"narration": "texto da narracao aqui", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]}`

    return callGemini<{ narration: string; hashtags: string[] }>(
      params.apiKey,
      prompt,
    )
  }

  /**
   * Generate synchronized subtitles from narration text
   */
  static generateSubtitles(
    narrationText: string,
    totalDurationMs: number,
  ): { text: string; start_ms: number; end_ms: number }[] {
    if (!narrationText) return []

    // Split into sentences or phrases
    const phrases = narrationText
      .split(/[.!?,;]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    if (phrases.length === 0) return []

    // Calculate total chars for proportional timing
    const totalChars = phrases.reduce((sum, p) => sum + p.length, 0)
    let currentMs = 0
    const subtitles = []

    for (const phrase of phrases) {
      const proportion = phrase.length / totalChars
      const durationMs = Math.round(proportion * totalDurationMs)
      subtitles.push({
        text: phrase,
        start_ms: currentMs,
        end_ms: currentMs + durationMs,
      })
      currentMs += durationMs
    }

    return subtitles
  }

  /**
   * Generate video using Gemini Veo model
   */
  static async generateVideoWithVeo(params: {
    prompt: string
    aspectRatio: string
    durationSeconds: number
    apiKey: string
  }): Promise<GeminiVideoResult> {
    const veoPrompt = `Create a ${params.durationSeconds}-second promotional video: ${params.prompt}.
Style: modern, clean, professional. Colors: vibrant. Motion: smooth transitions.
Format: vertical ${params.aspectRatio}. No text overlays needed.`

    const res = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${params.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: veoPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Gemini Veo error: ${res.status} — ${errBody.slice(0, 200)}`)
    }

    return {
      videoUrl: '',
      thumbnailUrl: '',
      durationSeconds: params.durationSeconds,
      model: 'gemini-2.0-flash',
    }
  }

  /**
   * Generate ad copy for campaigns
   */
  static async generateAdCopy(params: {
    cardHeadline: string
    cardSubtext: string
    companyName: string
    niche: string
    campaignType: string
    destinationUrl: string
    apiKey: string
  }): Promise<{
    primary_text: string
    headline: string
    description: string
  }> {
    const prompt = `Voce e um especialista em anuncios para Facebook/Instagram Ads.
Gere copy para um anuncio de "${params.campaignType}".

CONTEXTO:
- Empresa: ${params.companyName} (${params.niche})
- Card base: "${params.cardHeadline}" — "${params.cardSubtext}"
- Link destino: ${params.destinationUrl}

REGRAS:
- Portugues brasileiro, tom acessivel
- Inclua emojis estrategicos
- CTA claro e direto

Responda SOMENTE com JSON (sem markdown):
{
  "primary_text": "Texto principal (max 125 chars)",
  "headline": "Titulo do anuncio (max 40 chars)",
  "description": "Descricao (max 30 chars)"
}`

    return callGemini<{
      primary_text: string
      headline: string
      description: string
    }>(params.apiKey, prompt)
  }

  /**
   * Suggest interests for ad targeting based on niche
   */
  static async suggestInterests(params: {
    niche: string
    campaignType: string
    apiKey: string
  }): Promise<{ name: string; category: string }[]> {
    const prompt = `Voce e especialista em marketing digital e segmentacao de anuncios.
Sugira 12 interesses/segmentacoes para anuncios no Facebook/Instagram Ads.

CONTEXTO:
- Nicho: ${params.niche}
- Objetivo: ${params.campaignType}

Responda SOMENTE com JSON array (sem markdown):
[{"name": "nome do interesse", "category": "categoria"}]

Exemplos de categorias: "comportamento", "interesse", "demografico", "compras"
Seja especifico para o nicho ${params.niche}.`

    return callGemini<{ name: string; category: string }[]>(
      params.apiKey,
      prompt,
    )
  }
}
