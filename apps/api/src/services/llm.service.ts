/**
 * LLM unificado com fallback automatico.
 *
 * Ordem: Gemini (2.0 Flash) -> OpenAI (gpt-4o-mini).
 *
 * Sobe pra OpenAI quando o Gemini retorna erro de quota/rate-limit/auth
 * ou quando a chave do Gemini nao existe. Se tambem nao houver chave
 * OpenAI, relanca o erro original pra rota tratar com mensagem amigavel.
 *
 * Todos os metodos retornam texto puro ou JSON estruturado — nao cabe
 * ao chamador saber qual provider respondeu.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

const GEMINI_TEXT_MODEL = 'gemini-2.0-flash'
const OPENAI_TEXT_MODEL = 'gpt-4o-mini'

function isFallbackableError(err: any): boolean {
  const raw = String(err?.message || '')
  const lower = raw.toLowerCase()
  return (
    err?.status === 429 ||
    err?.status === 401 ||
    err?.status === 403 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('permission')
  )
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

export const LLMService = {
  /**
   * Gera texto puro. Gemini -> OpenAI.
   */
  async generateText(prompt: string): Promise<string> {
    try {
      return await geminiText(prompt)
    } catch (err) {
      if (!isFallbackableError(err) || !process.env.OPENAI_API_KEY) throw err
      console.warn(
        '[llm] Gemini falhou (',
        (err as any)?.message?.slice(0, 120),
        '). Fallback -> OpenAI',
      )
      return await openaiText(prompt)
    }
  },

  /**
   * Gera JSON (texto apenas). Gemini -> OpenAI. Parse feito pelo chamador.
   */
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
   * Visao com imagem inline. Gemini -> OpenAI.
   */
  async analyzeImage(
    prompt: string,
    base64: string,
    mimeType: string,
  ): Promise<string> {
    try {
      return await geminiVision(prompt, base64, mimeType)
    } catch (err) {
      if (!isFallbackableError(err) || !process.env.OPENAI_API_KEY) throw err
      console.warn(
        '[llm] Gemini Vision falhou (',
        (err as any)?.message?.slice(0, 120),
        '). Fallback -> OpenAI',
      )
      return await openaiVision(prompt, base64, mimeType)
    }
  },
}
