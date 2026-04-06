import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IMediaLibrary extends Document {
  company_id: Types.ObjectId
  type: 'logo' | 'product_photo' | 'banner' | 'video_thumbnail'
  name: string
  url: string
  thumbnail_url: string
  size_bytes: number
  mime_type: string
  tags: string[]
  created_at: Date
}

const MediaLibrarySchema = new Schema<IMediaLibrary>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type: {
    type: String,
    enum: ['logo', 'product_photo', 'banner', 'video_thumbnail'],
    required: true,
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail_url: { type: String, default: '' },
  size_bytes: { type: Number, default: 0 },
  mime_type: { type: String, default: '' },
  tags: [{ type: String }],
  created_at: { type: Date, default: Date.now },
})

MediaLibrarySchema.index({ company_id: 1 })

export const MediaLibrary =
  mongoose.models.MediaLibrary ||
  mongoose.model<IMediaLibrary>('MediaLibrary', MediaLibrarySchema)
