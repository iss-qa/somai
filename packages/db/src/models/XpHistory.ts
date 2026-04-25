import mongoose, { Schema, Document, Types } from 'mongoose'

export type XpAcao =
  | 'gerar_post'
  | 'agendar_post'
  | 'publicar_post'
  | 'analisar_inspiracao'
  | 'completar_wizard'
  | 'criar_calendario_mes'
  | 'streak_bonus'
  | 'missao_concluida'
  | 'conquista_desbloqueada'
  | 'convidar_empresa'
  | 'primeira_pergunta'
  | 'primeira_resposta'
  | 'manual'

export interface IXpHistory extends Document {
  company_id: Types.ObjectId
  acao: XpAcao
  xp: number
  creditos: number
  descricao: string
  ref_id?: Types.ObjectId
  createdAt: Date
}

const XpHistorySchema = new Schema<IXpHistory>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    acao: { type: String, required: true },
    xp: { type: Number, default: 0 },
    creditos: { type: Number, default: 0 },
    descricao: { type: String, default: '' },
    ref_id: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

XpHistorySchema.index({ company_id: 1, createdAt: -1 })

export const XpHistory =
  mongoose.models.XpHistory ||
  mongoose.model<IXpHistory>('XpHistory', XpHistorySchema)
