import mongoose, { Schema, Document } from 'mongoose'

export interface ITemplateConfig {
  background_style: string
  font_headline: string
  font_body: string
  layout_zones: any
}

export interface ITemplate extends Document {
  name: string
  niche: string | null
  format: string
  post_type: string
  thumbnail_url: string
  config: ITemplateConfig
  active: boolean
  created_at: Date
}

const TemplateSchema = new Schema<ITemplate>({
  name: { type: String, required: true },
  niche: { type: String, default: null },
  format: { type: String, required: true },
  post_type: { type: String, required: true },
  thumbnail_url: { type: String, default: '' },
  config: {
    background_style: { type: String, default: '' },
    font_headline: { type: String, default: '' },
    font_body: { type: String, default: '' },
    layout_zones: { type: Schema.Types.Mixed, default: {} },
  },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
})

export const Template =
  mongoose.models.Template ||
  mongoose.model<ITemplate>('Template', TemplateSchema)
