import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPost extends Document {
  company_id: Types.ObjectId
  queue_id: Types.ObjectId
  card_id: Types.ObjectId
  video_id: Types.ObjectId | null
  platforms: string[]
  post_type: string
  caption: string
  hashtags: string[]
  status: 'published' | 'failed' | 'cancelled'
  published_at: Date | null
  instagram_post_id: string
  facebook_post_id: string
  error_code: string
  error_message: string
  retry_count: number
  analytics_id: Types.ObjectId | null
  created_at: Date
}

const PostSchema = new Schema<IPost>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  queue_id: { type: Schema.Types.ObjectId, ref: 'PostQueue', required: true },
  card_id: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  video_id: { type: Schema.Types.ObjectId, ref: 'Video', default: null },
  platforms: [{ type: String }],
  post_type: { type: String, required: true },
  caption: { type: String, default: '' },
  hashtags: [{ type: String }],
  status: {
    type: String,
    enum: ['published', 'failed', 'cancelled'],
    required: true,
  },
  published_at: { type: Date, default: null },
  instagram_post_id: { type: String, default: '' },
  facebook_post_id: { type: String, default: '' },
  error_code: { type: String, default: '' },
  error_message: { type: String, default: '' },
  retry_count: { type: Number, default: 0 },
  analytics_id: {
    type: Schema.Types.ObjectId,
    ref: 'Analytics',
    default: null,
  },
  created_at: { type: Date, default: Date.now },
})

PostSchema.index({ company_id: 1, status: 1 })
PostSchema.index({ published_at: -1 })

export const Post =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema)
