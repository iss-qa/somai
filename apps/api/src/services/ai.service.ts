import { Integration } from '@soma-ai/db'
import { EncryptionService } from './encryption.service'

interface AIConfig {
  provider: string
  model: string
  apiKey: string
  companyId?: string
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

// Limites conhecidos/documentados por provider (apenas estimativas)
// Usados para alertar o cliente quando se aproxima do limite
export const PROVIDER_LIMITS: Record<string, { monthly_tokens?: number; daily_requests?: number; rpm?: number; note: string }> = {
  groq: { rpm: 30, daily_requests: 14400, note: 'Tier gratis: 30 req/min, 14.4k req/dia' },
  openrouter: { note: 'Creditos variam por modelo - consulte openrouter.ai' },
  gemini: { rpm: 15, daily_requests: 1500, note: 'Free: 15 req/min, 1500 req/dia' },
  anthropic: { note: 'Pago - consulte anthropic.com/pricing' },
  openai: { note: 'Pago - consulte platform.openai.com/usage' },
}

/**
 * Resolve AI config from company Integration (ai field).
 * Falls back to legacy gemini field, then env GEMINI_API_KEY.
 */
export async function getAIConfig(companyId: string): Promise<AIConfig> {
  const integration: any = await Integration.findOne({ company_id: companyId }).lean()

  // 1. New AI config
  if (integration?.ai?.active && integration?.ai?.provider && integration?.ai?.api_key) {
    return {
      provider: integration.ai.provider,
      model: integration.ai.model,
      apiKey: EncryptionService.decrypt(integration.ai.api_key),
      companyId,
    }
  }

  // 2. Legacy gemini config
  if (integration?.gemini?.api_key && integration?.gemini?.active) {
    return {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      apiKey: EncryptionService.decrypt(integration.gemini.api_key),
      companyId,
    }
  }

  // 3. Env fallback
  const envKey = process.env.GEMINI_API_KEY
  if (envKey) {
    return { provider: 'gemini', model: 'gemini-2.0-flash', apiKey: envKey, companyId }
  }

  throw new Error('Configure sua IA em Configuracoes > Integracoes > Configuracao IA')
}

/**
 * Persist token usage on the company's Integration record.
 * Fire-and-forget: never blocks the caller or throws.
 */
export async function recordUsage(companyId: string | undefined, usage: TokenUsage): Promise<void> {
  if (!companyId) return
  const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage
  if (prompt_tokens + completion_tokens + total_tokens <= 0) return

  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    // First try to increment an existing monthly bucket
    const res = await Integration.updateOne(
      { company_id: companyId, 'ai.usage.monthly.period': period },
      {
        $inc: {
          'ai.usage.total_prompt_tokens': prompt_tokens,
          'ai.usage.total_completion_tokens': completion_tokens,
          'ai.usage.total_tokens': total_tokens,
          'ai.usage.request_count': 1,
          'ai.usage.monthly.$.prompt_tokens': prompt_tokens,
          'ai.usage.monthly.$.completion_tokens': completion_tokens,
          'ai.usage.monthly.$.total_tokens': total_tokens,
          'ai.usage.monthly.$.requests': 1,
        },
        $set: { 'ai.usage.last_used_at': now },
      },
    )

    if (res.matchedCount === 0) {
      // No bucket for this period yet - push one atomically
      await Integration.updateOne(
        { company_id: companyId },
        {
          $inc: {
            'ai.usage.total_prompt_tokens': prompt_tokens,
            'ai.usage.total_completion_tokens': completion_tokens,
            'ai.usage.total_tokens': total_tokens,
            'ai.usage.request_count': 1,
          },
          $set: { 'ai.usage.last_used_at': now },
          $push: {
            'ai.usage.monthly': {
              period,
              prompt_tokens,
              completion_tokens,
              total_tokens,
              requests: 1,
            },
          },
        },
        { upsert: false },
      )
    }
  } catch (err) {
    console.error('[recordUsage] erro:', err)
  }
}

/**
 * Call any configured LLM and return the raw text response.
 * Persists token usage on the company's Integration doc (best-effort).
 */
export async function callLLM(
  config: AIConfig,
  prompt: string,
): Promise<string> {
  const { provider, model, apiKey, companyId } = config
  let usage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  let text = ''

  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
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
      const err = await res.json().catch(() => ({}))
      const msg = err?.error?.message || `HTTP ${res.status}`
      if (res.status === 429) throw new Error('Cota da API Gemini esgotada. Troque o provider em Configuracoes > Integracoes.')
      throw new Error(`Erro Gemini: ${msg}`)
    }
    const data = await res.json()
    text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const m = data?.usageMetadata
    if (m) {
      usage = {
        prompt_tokens: m.promptTokenCount || 0,
        completion_tokens: m.candidatesTokenCount || 0,
        total_tokens: m.totalTokenCount || 0,
      }
    }
  } else if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Erro Groq: ${err?.error?.message || `HTTP ${res.status}`}`)
    }
    const data = await res.json()
    text = data?.choices?.[0]?.message?.content || ''
    if (data?.usage) usage = extractOpenAIUsage(data.usage)
  } else if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Erro OpenRouter: ${err?.error?.message || `HTTP ${res.status}`}`)
    }
    const data = await res.json()
    text = data?.choices?.[0]?.message?.content || ''
    if (data?.usage) usage = extractOpenAIUsage(data.usage)
  } else if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Erro Anthropic: ${err?.error?.message || `HTTP ${res.status}`}`)
    }
    const data = await res.json()
    text = data?.content?.[0]?.text || ''
    const u = data?.usage
    if (u) {
      usage = {
        prompt_tokens: u.input_tokens || 0,
        completion_tokens: u.output_tokens || 0,
        total_tokens: (u.input_tokens || 0) + (u.output_tokens || 0),
      }
    }
  } else if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Erro OpenAI: ${err?.error?.message || `HTTP ${res.status}`}`)
    }
    const data = await res.json()
    text = data?.choices?.[0]?.message?.content || ''
    if (data?.usage) usage = extractOpenAIUsage(data.usage)
  } else {
    throw new Error(`Provider "${provider}" nao suportado`)
  }

  // Persist usage (fire-and-forget)
  recordUsage(companyId, usage).catch(() => {})
  return text
}

function extractOpenAIUsage(u: any): TokenUsage {
  return {
    prompt_tokens: u.prompt_tokens || 0,
    completion_tokens: u.completion_tokens || 0,
    total_tokens: u.total_tokens || ((u.prompt_tokens || 0) + (u.completion_tokens || 0)),
  }
}

/**
 * Call LLM and parse response as JSON.
 */
export async function callLLMJson<T>(config: AIConfig, prompt: string): Promise<T> {
  const raw = await callLLM(config, prompt)
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch {}
    }
    throw new Error('A IA retornou um formato inesperado. Tente novamente.')
  }
}
