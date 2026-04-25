import mongoose, { Schema, Document, Types } from 'mongoose'

export type InspiracaoFormato =
  | 'card'
  | 'carrossel'
  | 'reels'
  | 'roteiro'
  | 'legenda'
  | 'whatsapp'

export interface IInspiracao extends Document {
  company_id: Types.ObjectId | null
  segmento: string
  formato: InspiracaoFormato
  objetivo: string
  imageUrl: string
  thumbUrl: string
  copy: string
  hashtags: string[]
  upvotes: number
  salvamentos: number
  vistas: number
  anonimizado: boolean
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

const InspiracaoSchema = new Schema<IInspiracao>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    segmento: { type: String, required: true, index: true },
    formato: {
      type: String,
      enum: ['card', 'carrossel', 'reels', 'roteiro', 'legenda', 'whatsapp'],
      required: true,
    },
    objetivo: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    thumbUrl: { type: String, default: '' },
    copy: { type: String, default: '' },
    hashtags: [{ type: String }],
    upvotes: { type: Number, default: 0 },
    salvamentos: { type: Number, default: 0 },
    vistas: { type: Number, default: 0 },
    anonimizado: { type: Boolean, default: true },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true },
)

InspiracaoSchema.index({ segmento: 1, formato: 1, ativo: 1 })
InspiracaoSchema.index({ upvotes: -1 })

export const Inspiracao =
  mongoose.models.Inspiracao ||
  mongoose.model<IInspiracao>('Inspiracao', InspiracaoSchema)
