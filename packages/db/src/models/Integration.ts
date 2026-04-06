import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IIntegrationMeta {
  access_token: string
  token_expires_at: Date | null
  instagram_account_id: string
  instagram_username: string
  facebook_page_id: string
  facebook_page_name: string
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

export interface IIntegration extends Document {
  company_id: Types.ObjectId
  meta: IIntegrationMeta
  whatsapp: IIntegrationWhatsapp
  gemini: IIntegrationGemini
  updated_at: Date
}

const IntegrationSchema = new Schema<IIntegration>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  meta: {
    access_token: { type: String, default: '' },
    token_expires_at: { type: Date, default: null },
    instagram_account_id: { type: String, default: '' },
    instagram_username: { type: String, default: '' },
    facebook_page_id: { type: String, default: '' },
    facebook_page_name: { type: String, default: '' },
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
  updated_at: { type: Date, default: Date.now },
})

IntegrationSchema.index({ company_id: 1 })

export const Integration =
  mongoose.models.Integration ||
  mongoose.model<IIntegration>('Integration', IntegrationSchema)
