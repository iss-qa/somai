/**
 * LLM unificado com fallback em cascata.
 *
 * Texto: OpenAI gpt-4o-mini -> Gemini 2.0 Flash -> DeepSeek deepseek-chat
 * Vision: OpenAI gpt-4o-mini -> Gemini 2.0 Flash -> graceful empty
 *         (DeepSeek nao suporta image input)
 *
 * Logs:
 *   [llm] boot — openai=on gemini=on deepseek=on
 *   [llm] start text(640ch) provider=openai
 *   [llm] openai falhou em text status=429 msg="quota..." → tenta gemini
 *   [llm] gemini falhou em text status=401 msg="api key invalid" → tenta deepseek
 *   [llm] ok text deepseek in 1340ms
 *   [llm] FALHA TOTAL em vision (gracioso): retornando vazio
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

const GEMINI_TEXT_MODEL = 'gemini-2.0-flash'
const OPENAI_TEXT_MODEL = 'gpt-4o-mini'
const DEEPSEEK_TEXT_MODEL = 'deepseek-chat'

function geminiOnly(): boolean {
  const v = String(process.env.LLM_GEMINI_ONLY || '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}
function hasGemini() {
  return !!process.env.GEMINI_API_KEY
}
function hasOpenAI() {
  return !geminiOnly() && !!process.env.OPENAI_API_KEY
}
function hasDeepSeek() {
  return !geminiOnly() && !!process.env.DEEPSEEK_API_KEY
}

;(function logProviders() {
  const debug = geminiOnly() ? ' [DEBUG: LLM_GEMINI_ONLY=on]' : ''
  console.log(
    `[llm] boot — gemini=${hasGemini() ? 'on' : 'OFF'} openai=${hasOpenAI() ? 'on' : 'OFF'} deepseek=${hasDeepSeek() ? 'on' : 'OFF'}${debug}`,
  )
  if (!hasGemini() && !hasOpenAI() && !hasDeepSeek()) {
    console.warn(
      '[llm] ATENCAO: nenhum provider de LLM configurado. Onboarding/IA vai falhar.',
    )
  }
})()

function isFallbackable(err: any): boolean {
  const raw = String(err?.message || '')
  const lower = raw.toLowerCase()
  return (
    err?.status === 429 ||
    err?.status === 401 ||
    err?.status === 403 ||
    err?.status === 500 ||
    err?.status === 502 ||
    err?.status === 503 ||
    err?.code === 'ETIMEDOUT' ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'ECONNREFUSED' ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('permission') ||
    lower.includes('exceeded') ||
    lower.includes('overloaded') ||
    lower.includes('unavailable') ||
    lower.includes('timeout') ||
    lower.includes('network') ||
    lower.includes('fetch failed')
  )
}

function shortErr(err: any): string {
  const msg = String(err?.message || err || 'unknown')
  return msg.replace(/\s+/g, ' ').slice(0, 250)
}

// ── Provider clients ────────────────────────────────────────────

function getGemini(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY
  return key ? new GoogleGenerativeAI(key) : null
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  return key ? new OpenAI({ apiKey: key }) : null
}

function getDeepSeek(): OpenAI | null {
  const key = process.env.DEEPSEEK_API_KEY
  return key
    ? new OpenAI({
        apiKey: key,
        baseURL: 'https://api.deepseek.com/v1',
      })
    : null
}

// ── Text providers ──────────────────────────────────────────────

async function geminiText(prompt: string): Promise<string> {
  const g = getGemini()
  if (!g) throw new Error('GEMINI_API_KEY nao configurada')
  const model = g.getGenerativeModel({ model: GEMINI_TEXT_MODEL })
  const res = await model.generateContent(prompt)
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

async function deepseekText(prompt: string): Promise<string> {
  const c = getDeepSeek()
  if (!c) throw new Error('DEEPSEEK_API_KEY nao configurada')
  const res = await c.chat.completions.create({
    model: DEEPSEEK_TEXT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })
  return (res.choices[0]?.message?.content || '').trim()
}

// ── Vision providers ────────────────────────────────────────────

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

// ── Cascade runner ──────────────────────────────────────────────

interface Step<T> {
  name: string
  available: boolean
  run: () => Promise<T>
}

async function runCascade<T>(label: string, steps: Step<T>[]): Promise<T> {
  const total = Date.now()
  const errors: string[] = []
  for (const step of steps) {
    if (!step.available) continue
    const t = Date.now()
    console.log(`[llm] start ${label} provider=${step.name}`)
    try {
      const out = await step.run()
      console.log(
        `[llm] ok ${label} ${step.name} in ${Date.now() - t}ms (total ${Date.now() - total}ms)`,
      )
      return out
    } catch (err: any) {
      const fbk = isFallbackable(err)
      // Em debug (so gemini), loga o erro CRU completo pra diagnostico
      if (geminiOnly()) {
        console.error(
          `[llm][DEBUG] ${step.name} falhou em ${label}. status=${err?.status} code=${err?.code} name=${err?.name}\n--- mensagem completa ---\n${err?.message}\n--- stack ---\n${err?.stack}\n--- raw ---\n${JSON.stringify(err, Object.getOwnPropertyNames(err)).slice(0, 4000)}`,
        )
        // Em debug propaga direto pra rota mostrar ao usuario
        throw err
      }
      const msg = `${step.name}[status=${err?.status ?? '-'} code=${err?.code ?? '-'}] ${shortErr(err)}`
      console.warn(
        `[llm] ${step.name} falhou em ${label} (fallbackable=${fbk}): ${msg}`,
      )
      errors.push(msg)
      if (!fbk) {
        const out: any = new Error(`${label} falhou: ${msg}`)
        out.status = err?.status || 500
        out.cause = err
        throw out
      }
    }
  }
  const summary = `Todos providers falharam em ${label}. ${errors.join(' | ')}`
  console.error(`[llm] ${summary}`)
  const out: any = new Error(summary)
  out.status = 502
  throw out
}

// ── Public API ──────────────────────────────────────────────────

export const LLMService = {
  async generateText(prompt: string): Promise<string> {
    return runCascade(`text(${prompt.length}ch)`, [
      { name: 'openai', available: hasOpenAI(), run: () => openaiText(prompt) },
      { name: 'gemini', available: hasGemini(), run: () => geminiText(prompt) },
      { name: 'deepseek', available: hasDeepSeek(), run: () => deepseekText(prompt) },
    ])
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

  /**
   * Vision com graceful degradation: se todos providers de vision falharem,
   * retorna string vazia em vez de jogar — o chamador trata como "sem
   * cores/estilo" e o usuario preenche manualmente no passo 5.
   */
  async analyzeImage(
    prompt: string,
    base64: string,
    mimeType: string,
  ): Promise<string> {
    try {
      return await runCascade(
        `vision(${mimeType}, ${Math.round(base64.length / 1024)}kb)`,
        [
          { name: 'openai', available: hasOpenAI(), run: () => openaiVision(prompt, base64, mimeType) },
          { name: 'gemini', available: hasGemini(), run: () => geminiVision(prompt, base64, mimeType) },
        ],
      )
    } catch (err) {
      // Em debug, propaga o erro pra ficar visivel
      if (geminiOnly()) throw err
      console.warn(
        `[llm] vision degradado para vazio — usuario preenche manualmente. Erro: ${shortErr(err)}`,
      )
      return ''
    }
  },
}
