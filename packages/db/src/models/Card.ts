import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ICard extends Document {
  company_id: Types.ObjectId
  template_id: Types.ObjectId
  format: string
  post_type: string
  headline: string
  subtext: string
  cta: string
  product_name: string
  price_original: number
  price_promo: number
  ai_prompt_used: string
  generated_image_url: string
  generated_video_url: string
  slide_image_urls: string[]
  media_type: 'image' | 'video'
  caption: string
  hashtags: string[]
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived'
  approved_at: Date | null
  campaign_id: Types.ObjectId | null
  post_id: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const CardSchema = new Schema<ICard>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    template_id: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    format: { type: String, required: true },
    post_type: { type: String, required: true },
    headline: { type: String, default: '' },
    subtext: { type: String, default: '' },
    cta: { type: String, default: '' },
    product_name: { type: String, default: '' },
    price_original: { type: Number, default: 0 },
    price_promo: { type: Number, default: 0 },
    ai_prompt_used: { type: String, default: '' },
    generated_image_url: { type: String, default: '' },
    generated_video_url: { type: String, default: '' },
    slide_image_urls: [{ type: String }],
    media_type: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: { type: String, default: '' },
    hashtags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'approved', 'scheduled', 'posted', 'archived'],
      default: 'draft',
    },
    approved_at: { type: Date, default: null },
    campaign_id: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    post_id: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  },
  { timestamps: true }
)

CardSchema.index({ company_id: 1, status: 1 })
CardSchema.index({ format: 1 })

export const Card =
  mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema)
