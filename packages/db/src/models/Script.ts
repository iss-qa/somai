import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IScript extends Document {
  company_id: Types.ObjectId
  title: string
  category: string
  text: string
  char_count: number
  audio_url: string
  video_url: string
  images: string[]
  sent_via_whatsapp: boolean
  whatsapp_sent_at: Date | null
  campaign_id: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const ScriptSchema = new Schema<IScript>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: { type: String, required: true },
    category: { type: String, default: '' },
    text: { type: String, default: '' },
    char_count: { type: Number, default: 0 },
    audio_url: { type: String, default: '' },
    video_url: { type: String, default: '' },
    images: [{ type: String }],
    sent_via_whatsapp: { type: Boolean, default: false },
    whatsapp_sent_at: { type: Date, default: null },
    campaign_id: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
  },
  { timestamps: true }
)

export const Script =
  mongoose.models.Script || mongoose.model<IScript>('Script', ScriptSchema)
