import mongoose, { Schema, Document } from 'mongoose'

export interface INicheConfigColors {
  primary: string
  secondary: string
  accent: string
}

export interface INicheConfigAiPrompts {
  card_base: string
  caption_base: string
  video_base: string
}

export interface INicheConfig extends Document {
  niche: string
  label: string
  default_colors: INicheConfigColors
  post_types: string[]
  ai_prompts: INicheConfigAiPrompts
  default_hashtags: string[]
  createdAt: Date
  updatedAt: Date
}

const NicheConfigSchema = new Schema<INicheConfig>(
  {
    niche: { type: String, required: true },
    label: { type: String, required: true },
    default_colors: {
      primary: { type: String, default: '#000000' },
      secondary: { type: String, default: '#FFFFFF' },
      accent: { type: String, default: '#FF0000' },
    },
    post_types: [{ type: String }],
    ai_prompts: {
      card_base: { type: String, default: '' },
      caption_base: { type: String, default: '' },
      video_base: { type: String, default: '' },
    },
    default_hashtags: [{ type: String }],
  },
  { timestamps: true }
)

export const NicheConfig =
  mongoose.models.NicheConfig ||
  mongoose.model<INicheConfig>('NicheConfig', NicheConfigSchema)
