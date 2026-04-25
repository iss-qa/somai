import mongoose, { Schema, Document, Types } from 'mongoose'

export type ComunidadeTag =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'ia'
  | 'estrategia'
  | 'outros'

export interface IComunidadeResposta {
  _id?: Types.ObjectId
  company_id: Types.ObjectId
  autor: string
  avatar_url: string
  conteudo: string
  upvotes: number
  upvotedBy: Types.ObjectId[]
  isIA: boolean
  createdAt: Date
}

export interface IComunidadePost extends Document {
  company_id: Types.ObjectId
  autor: string
  avatar_url: string
  titulo: string
  conteudo: string
  tags: ComunidadeTag[]
  upvotes: number
  upvotedBy: Types.ObjectId[]
  respostas: IComunidadeResposta[]
  resolvido: boolean
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

const RespostaSchema = new Schema<IComunidadeResposta>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    autor: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    conteudo: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    isIA: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const ComunidadePostSchema = new Schema<IComunidadePost>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    autor: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    titulo: { type: String, required: true },
    conteudo: { type: String, required: true },
    tags: [
      {
        type: String,
        enum: ['instagram', 'facebook', 'whatsapp', 'ia', 'estrategia', 'outros'],
      },
    ],
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    respostas: [RespostaSchema],
    resolvido: { type: Boolean, default: false },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true },
)

ComunidadePostSchema.index({ tags: 1, ativo: 1 })
ComunidadePostSchema.index({ upvotes: -1 })
ComunidadePostSchema.index({ createdAt: -1 })

export const ComunidadePost =
  mongoose.models.ComunidadePost ||
  mongoose.model<IComunidadePost>('ComunidadePost', ComunidadePostSchema)
