import mongoose, { Schema, Document } from 'mongoose'

export interface IPlanFeatures {
  instagram: boolean
  facebook: boolean
  cards_limit: number
  video_generation: boolean
  videos_per_day: number
  scripts: boolean
  whatsapp: boolean
  campaigns: boolean
  date_suggestions: boolean
  analytics: boolean
}

export interface IPlan extends Document {
  slug: string
  name: string
  setup_price: number
  monthly_price: number
  features: IPlanFeatures
  active: boolean
  created_at: Date
}

const PlanSchema = new Schema<IPlan>({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  setup_price: { type: Number, required: true },
  monthly_price: { type: Number, required: true },
  features: {
    instagram: { type: Boolean, default: false },
    facebook: { type: Boolean, default: false },
    cards_limit: { type: Number, default: 0 },
    video_generation: { type: Boolean, default: false },
    videos_per_day: { type: Number, default: 0 },
    scripts: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    campaigns: { type: Boolean, default: false },
    date_suggestions: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
  },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
})

export const Plan =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema)
