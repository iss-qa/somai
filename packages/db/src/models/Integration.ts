import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IIntegrationMeta {
  app_id: string
  app_secret: string
  app_name: string
  access_token: string
  token_expires_at: Date | null
  instagram_account_id: string
  instagram_username: string
  instagram_profile_url: string
  facebook_page_id: string
  facebook_page_name: string
  facebook_page_url: string
  connected: boolean
  connected_at: Date | null
  last_verified_at: Date | null
  status: string
}

export interface IIntegrationWhatsapp {
  instance_name: string
  connected: boolean
  status: string
}

export interface IIntegrationGemini {
  api_key: string
  active: boolean
  last_tested_at: Date | null
}

export interface IIntegrationAIUsageMonth {
  period: string // 'YYYY-MM'
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  requests: number
}

export interface IIntegrationAIUsage {
  total_prompt_tokens: number
  total_completion_tokens: number
  total_tokens: number
  request_count: number
  last_used_at: Date | null
  monthly: IIntegrationAIUsageMonth[]
}

export interface IIntegrationAI {
  provider: string // 'groq' | 'openrouter' | 'gemini' | 'anthropic' | 'openai'
  model: string
  api_key: string // encrypted, only for paid providers
  active: boolean
  usage?: IIntegrationAIUsage
}

export interface IIntegration extends Document {
  company_id: Types.ObjectId
  meta: IIntegrationMeta
  whatsapp: IIntegrationWhatsapp
  gemini: IIntegrationGemini
  ai: IIntegrationAI
  updated_at: Date
}

const IntegrationSchema = new Schema<IIntegration>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  meta: {
    app_id: { type: String, default: '' },
    app_secret: { type: String, default: '' },
    app_name: { type: String, default: '' },
    access_token: { type: String, default: '' },
    token_expires_at: { type: Date, default: null },
    instagram_account_id: { type: String, default: '' },
    instagram_username: { type: String, default: '' },
    instagram_profile_url: { type: String, default: '' },
    facebook_page_id: { type: String, default: '' },
    facebook_page_name: { type: String, default: '' },
    facebook_page_url: { type: String, default: '' },
    connected: { type: Boolean, default: false },
    connected_at: { type: Date, default: null },
    last_verified_at: { type: Date, default: null },
    status: { type: String, default: 'disconnected' },
  },
  whatsapp: {
    instance_name: { type: String, default: '' },
    connected: { type: Boolean, default: false },
    status: { type: String, default: 'disconnected' },
  },
  gemini: {
    api_key: { type: String, default: '' },
    active: { type: Boolean, default: false },
    last_tested_at: { type: Date, default: null },
  },
  ai: {
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
    api_key: { type: String, default: '' },
    active: { type: Boolean, default: false },
    usage: {
      total_prompt_tokens: { type: Number, default: 0 },
      total_completion_tokens: { type: Number, default: 0 },
      total_tokens: { type: Number, default: 0 },
      request_count: { type: Number, default: 0 },
      last_used_at: { type: Date, default: null },
      monthly: [{
        period: { type: String },
        prompt_tokens: { type: Number, default: 0 },
        completion_tokens: { type: Number, default: 0 },
        total_tokens: { type: Number, default: 0 },
        requests: { type: Number, default: 0 },
      }],
    },
  },
  updated_at: { type: Date, default: Date.now },
})

IntegrationSchema.index({ company_id: 1 })

export const Integration =
  mongoose.models.Integration ||
  mongoose.model<IIntegration>('Integration', IntegrationSchema)
