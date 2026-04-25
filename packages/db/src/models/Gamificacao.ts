import mongoose, { Schema, Document, Types } from 'mongoose'

export type NivelGamificacao =
  | 'INICIANTE'
  | 'INTERMEDIARIO'
  | 'AVANCADO'
  | 'EXPERT'

export interface IGamificacao extends Document {
  company_id: Types.ObjectId
  xp: number
  nivel: NivelGamificacao
  creditos: number
  ofensiva: number
  maiorOfensiva: number
  ultimaAtividade: Date | null
  rankingMes: number
  creditosMes: number
  promptsRefinados: number
  mesReferencia: string
  conquistasIds: Types.ObjectId[]
  missoesCompletasIds: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const GamificacaoSchema = new Schema<IGamificacao>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    xp: { type: Number, default: 0 },
    nivel: {
      type: String,
      enum: ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'EXPERT'],
      default: 'INICIANTE',
    },
    creditos: { type: Number, default: 0 },
    ofensiva: { type: Number, default: 0 },
    maiorOfensiva: { type: Number, default: 0 },
    ultimaAtividade: { type: Date, default: null },
    rankingMes: { type: Number, default: 0 },
    creditosMes: { type: Number, default: 0 },
    promptsRefinados: { type: Number, default: 0 },
    mesReferencia: { type: String, default: '' },
    conquistasIds: [{ type: Schema.Types.ObjectId, ref: 'Conquista' }],
    missoesCompletasIds: [{ type: Schema.Types.ObjectId, ref: 'Missao' }],
  },
  { timestamps: true },
)

GamificacaoSchema.index({ creditosMes: -1 })
GamificacaoSchema.index({ xp: -1 })
GamificacaoSchema.index({ mesReferencia: 1, creditosMes: -1 })

export const Gamificacao =
  mongoose.models.Gamificacao ||
  mongoose.model<IGamificacao>('Gamificacao', GamificacaoSchema)
