import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPostQueue extends Document {
  company_id: Types.ObjectId
  card_id: Types.ObjectId
  video_id: Types.ObjectId | null
  scheduled_at: Date
  platforms: string[]
  post_type: string
  caption: string
  hashtags: string[]
  status: 'queued' | 'processing' | 'done' | 'failed' | 'cancelled'
  bullmq_job_id: string
  retry_count: number
  max_retries: number
  created_at: Date
}

const PostQueueSchema = new Schema<IPostQueue>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  card_id: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
  video_id: { type: Schema.Types.ObjectId, ref: 'Video', default: null },
  scheduled_at: { type: Date, required: true },
  platforms: [{ type: String }],
  post_type: { type: String, required: true },
  caption: { type: String, default: '' },
  hashtags: [{ type: String }],
  status: {
    type: String,
    enum: ['queued', 'processing', 'done', 'failed', 'cancelled'],
    default: 'queued',
  },
  bullmq_job_id: { type: String, default: '' },
  retry_count: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: Date.now },
})

PostQueueSchema.index({ company_id: 1, status: 1 })
PostQueueSchema.index({ scheduled_at: 1, status: 1 })

export const PostQueue =
  mongoose.models.PostQueue ||
  mongoose.model<IPostQueue>('PostQueue', PostQueueSchema)
