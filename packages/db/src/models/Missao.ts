import mongoose, { Schema, Document } from 'mongoose'

export type MissaoTipo = 'diaria' | 'semanal' | 'unica'

export type MissaoCondicao =
  | 'gerar_post'
  | 'agendar_post'
  | 'publicar_post'
  | 'analisar_inspiracao'
  | 'completar_wizard'
  | 'criar_calendario_mes'
  | 'streak_7'
  | 'convidar_empresa'
  | 'primeira_pergunta'
  | 'primeira_resposta'

export interface IMissao extends Document {
  titulo: string
  descricao: string
  tipo: MissaoTipo
  recompensaXP: number
  recompensaCreditos: number
  icone: string
  condicao: MissaoCondicao
  meta: number
  ativo: boolean
  ordem: number
  createdAt: Date
  updatedAt: Date
}

const MissaoSchema = new Schema<IMissao>(
  {
    titulo: { type: String, required: true },
    descricao: { type: String, default: '' },
    tipo: {
      type: String,
      enum: ['diaria', 'semanal', 'unica'],
      required: true,
    },
    recompensaXP: { type: Number, default: 0 },
    recompensaCreditos: { type: Number, default: 0 },
    icone: { type: String, default: 'zap' },
    condicao: {
      type: String,
      enum: [
        'gerar_post',
        'agendar_post',
        'publicar_post',
        'analisar_inspiracao',
        'completar_wizard',
        'criar_calendario_mes',
        'streak_7',
        'convidar_empresa',
        'primeira_pergunta',
        'primeira_resposta',
      ],
      required: true,
    },
    meta: { type: Number, default: 1 },
    ativo: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: true },
)

MissaoSchema.index({ tipo: 1, ativo: 1, ordem: 1 })

export const Missao =
  mongoose.models.Missao ||
  mongoose.model<IMissao>('Missao', MissaoSchema)
