import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHashtagSet extends Document {
  company_id: Types.ObjectId | null
  niche: string
  name: string
  hashtags: string[]
  is_default: boolean
  created_at: Date
}

const HashtagSetSchema = new Schema<IHashtagSet>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
  niche: { type: String, required: true },
  name: { type: String, required: true },
  hashtags: [{ type: String }],
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
})

export const HashtagSet =
  mongoose.models.HashtagSet ||
  mongoose.model<IHashtagSet>('HashtagSet', HashtagSetSchema)
