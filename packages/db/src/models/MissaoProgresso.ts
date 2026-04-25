import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IMissaoProgresso extends Document {
  company_id: Types.ObjectId
  missao_id: Types.ObjectId
  tipo: 'diaria' | 'semanal' | 'unica'
  progresso: number
  meta: number
  completa: boolean
  completadaEm: Date | null
  periodoRef: string
  createdAt: Date
  updatedAt: Date
}

const MissaoProgressoSchema = new Schema<IMissaoProgresso>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    missao_id: {
      type: Schema.Types.ObjectId,
      ref: 'Missao',
      required: true,
    },
    tipo: {
      type: String,
      enum: ['diaria', 'semanal', 'unica'],
      required: true,
    },
    progresso: { type: Number, default: 0 },
    meta: { type: Number, default: 1 },
    completa: { type: Boolean, default: false },
    completadaEm: { type: Date, default: null },
    periodoRef: { type: String, default: '' },
  },
  { timestamps: true },
)

MissaoProgressoSchema.index(
  { company_id: 1, missao_id: 1, periodoRef: 1 },
  { unique: true },
)
MissaoProgressoSchema.index({ company_id: 1, completa: 1 })

export const MissaoProgresso =
  mongoose.models.MissaoProgresso ||
  mongoose.model<IMissaoProgresso>('MissaoProgresso', MissaoProgressoSchema)
