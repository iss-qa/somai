import mongoose, { Schema, Document } from 'mongoose'

export interface IConquista extends Document {
  slug: string
  titulo: string
  descricao: string
  icone: string
  cor: string
  condicao: string
  meta: number
  recompensaXP: number
  recompensaCreditos: number
  ativo: boolean
  ordem: number
  createdAt: Date
  updatedAt: Date
}

const ConquistaSchema = new Schema<IConquista>(
  {
    slug: { type: String, required: true, unique: true },
    titulo: { type: String, required: true },
    descricao: { type: String, default: '' },
    icone: { type: String, default: 'trophy' },
    cor: { type: String, default: '#A855F7' },
    condicao: { type: String, required: true },
    meta: { type: Number, default: 1 },
    recompensaXP: { type: Number, default: 0 },
    recompensaCreditos: { type: Number, default: 0 },
    ativo: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Conquista =
  mongoose.models.Conquista ||
  mongoose.model<IConquista>('Conquista', ConquistaSchema)
