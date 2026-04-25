import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IFalUsage extends Document {
  company_id: Types.ObjectId
  company_name: string
  model_name: string // ex: fal-ai/ideogram/v2/turbo
  cost_usd: number // custo estimado com base no modelo (ex: 0.05)
  card_id: Types.ObjectId | null
  format: string // ex: stories_unico
  success: boolean
  error_message: string
  created_at: Date
}

const FalUsageSchema = new Schema<IFalUsage>({
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  company_name: { type: String, default: '' },
  model_name: { type: String, required: true },
  cost_usd: { type: Number, required: true, default: 0 },
  card_id: { type: Schema.Types.ObjectId, ref: 'Card', default: null },
  format: { type: String, default: '' },
  success: { type: Boolean, default: true },
  error_message: { type: String, default: '' },
  created_at: { type: Date, default: Date.now, index: true },
})

FalUsageSchema.index({ created_at: -1 })
FalUsageSchema.index({ company_id: 1, created_at: -1 })

export const FalUsage =
  (mongoose.models.FalUsage as mongoose.Model<IFalUsage>) ||
  mongoose.model<IFalUsage>('FalUsage', FalUsageSchema)
