import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAnalytics extends Document {
  company_id: Types.ObjectId
  post_id: Types.ObjectId
  platform: string
  platform_post_id: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  story_replies: number
  story_exits: number
  fetched_at: Date | null
  created_at: Date
}

const AnalyticsSchema = new Schema<IAnalytics>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  platform: { type: String, required: true },
  platform_post_id: { type: String, default: '' },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  story_replies: { type: Number, default: 0 },
  story_exits: { type: Number, default: 0 },
  fetched_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
})

AnalyticsSchema.index({ company_id: 1 })
AnalyticsSchema.index({ post_id: 1 })

export const Analytics =
  mongoose.models.Analytics ||
  mongoose.model<IAnalytics>('Analytics', AnalyticsSchema)
