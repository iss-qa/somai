/**
 * LLM unificado com fallback automatico.
 *
 * Ordem: Gemini (2.0 Flash) -> OpenAI (gpt-4o-mini).
 *
 * Sobe pra OpenAI quando o Gemini retorna quota/rate-limit/auth ou quando
 * a chave nao existe. Se tambem nao houver chave OpenAI, relanca o erro
 * original pra rota tratar com mensagem amigavel.
 *
 * Todos os metodos logam:
 *   [llm] start text (gemini|openai) len=N
 *   [llm] ok text gemini in 800ms
 *   [llm] Gemini falhou (msg): fallback -> OpenAI
 *   [llm] ok text openai(fb) in 1200ms
 *   [llm] ambos providers falharam
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

const GEMINI_TEXT_MODEL = 'gemini-2.0-flash'
const OPENAI_TEXT_MODEL = 'gpt-4o-mini'

function hasGemini() {
  return !!process.env.GEMINI_API_KEY
}
function hasOpenAI() {
  return !!process.env.OPENAI_API_KEY
}

// Log 1x na inicializacao pra deixar claro quais providers estao ativos
;(function logProviders() {
  const g = hasGemini()
  const o = hasOpenAI()
  console.log(
    `[llm] boot — gemini=${g ? 'on' : 'OFF'} openai(fallback)=${o ? 'on' : 'OFF'}`,
  )
  if (!g && !o) {
    console.warn(
      '[llm] ATENCAO: nenhum provider de LLM configurado. Onboarding/IA vai falhar.',
    )
  }
})()

function isFallbackableError(err: any): boolean {
  const raw = String(err?.message || '')
  const lower = raw.toLowerCase()
  return (
    err?.status === 429 ||
    err?.status === 401 ||
    err?.status === 403 ||
    err?.status === 500 ||
    err?.status === 502 ||
    err?.status === 503 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('permission') ||
    lower.includes('exceeded') ||
    lower.includes('overloaded') ||
    lower.includes('unavailable')
  )
}

function shortErr(err: any): string {
  return String(err?.message || err || 'unknown').slice(0, 200)
}

function getGemini(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY
  return key ? new GoogleGenerativeAI(key) : null
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  return key ? new OpenAI({ apiKey: key }) : null
}

async function geminiText(prompt: string): Promise<string> {
  const g = getGemini()
  if (!g) throw new Error('GEMINI_API_KEY nao configurada')
  const model = g.getGenerativeModel({ model: GEMINI_TEXT_MODEL })
  const res = await model.generateContent(prompt)
  return res.response.text().trim()
}

async function geminiVision(
  prompt: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const g = getGemini()
  if (!g) throw new Error('GEMINI_API_KEY nao configurada')
  const model = g.getGenerativeModel({ model: GEMINI_TEXT_MODEL })
  const res = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64 } },
  ])
  return res.response.text().trim()
}

async function openaiText(prompt: string): Promise<string> {
  const c = getOpenAI()
  if (!c) throw new Error('OPENAI_API_KEY nao configurada')
  const res = await c.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })
  return (res.choices[0]?.message?.content || '').trim()
}

async function openaiVision(
  prompt: string,
  base64: string,
  mimeType: string,
): Promise<string> {
  const c = getOpenAI()
  if (!c) throw new Error('OPENAI_API_KEY nao configurada')
  const dataUrl = `data:${mimeType};base64,${base64}`
  const res = await c.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    temperature: 0.7,
  })
  return (res.choices[0]?.message?.content || '').trim()
}

function stripJsonFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

// Wrapper generico com log + fallback
async function withFallback<T>(
  label: string,
  primary: () => Promise<T>,
  fallback: (() => Promise<T>) | null,
): Promise<T> {
  const started = Date.now()
  console.log(`[llm] start ${label} provider=gemini`)
  try {
    const out = await primary()
    console.log(`[llm] ok ${label} gemini in ${Date.now() - started}ms`)
    return out
  } catch (geminiErr: any) {
    const fallbackable = isFallbackableError(geminiErr)
    console.warn(
      `[llm] gemini falhou em ${label} (fallbackable=${fallbackable}) status=${geminiErr?.status} msg="${shortErr(geminiErr)}"`,
    )
    if (!fallback || !fallbackable) {
      throw geminiErr
    }
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        `[llm] sem OPENAI_API_KEY configurada — nao ha fallback, relancando erro original`,
      )
      throw geminiErr
    }
    const fbStart = Date.now()
    console.log(`[llm] fallback ${label} provider=openai(gpt-4o-mini)`)
    try {
      const out = await fallback()
      console.log(
        `[llm] ok ${label} openai(fb) in ${Date.now() - fbStart}ms (total ${Date.now() - started}ms)`,
      )
      return out
    } catch (openaiErr: any) {
      console.error(
        `[llm] FALHA TOTAL em ${label}. gemini="${shortErr(geminiErr)}" | openai="${shortErr(openaiErr)}" status=${openaiErr?.status}`,
      )
      // Propaga o erro do OpenAI anotado com o do Gemini pra ficar claro no log
      const merged: any = new Error(
        `Ambos providers falharam. gemini=${shortErr(geminiErr)} | openai=${shortErr(openaiErr)}`,
      )
      merged.status = openaiErr?.status || geminiErr?.status || 500
      merged.cause = openaiErr
      throw merged
    }
  }
}

export const LLMService = {
  async generateText(prompt: string): Promise<string> {
    return withFallback(
      `text(${prompt.length}ch)`,
      () => geminiText(prompt),
      hasOpenAI() ? () => openaiText(prompt) : null,
    )
  },

  async generateJson<T = any>(
    prompt: string,
    fallbackValue: T,
    parser: (s: string) => T,
  ): Promise<T> {
    const raw = await this.generateText(prompt)
    try {
      return parser(stripJsonFences(raw))
    } catch {
      return fallbackValue
    }
  },

  async analyzeImage(
    prompt: string,
    base64: string,
    mimeType: string,
  ): Promise<string> {
    return withFallback(
      `vision(${mimeType}, ${Math.round(base64.length / 1024)}kb)`,
      () => geminiVision(prompt, base64, mimeType),
      hasOpenAI() ? () => openaiVision(prompt, base64, mimeType) : null,
    )
  },
}
