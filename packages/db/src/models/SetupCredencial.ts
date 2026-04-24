import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISetupCredencialAcesso {
  admin_id: Types.ObjectId
  data_acesso: Date
}

export interface ISetupCredencial extends Document {
  empresa_id: Types.ObjectId
  tipo: 'credenciais'
  nome_conta: string
  email: string
  senha_criptografada: string
  plataformas: string[]
  observacoes: string
  status: 'aguardando_setup' | 'em_andamento' | 'concluido'
  admin_id: Types.ObjectId | null
  data_inicio: Date | null
  data_conclusao: Date | null
  acessos_admin: ISetupCredencialAcesso[]
  createdAt: Date
  updatedAt: Date
}

const SetupCredencialSchema = new Schema<ISetupCredencial>(
  {
    empresa_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    tipo: { type: String, enum: ['credenciais'], default: 'credenciais' },
    nome_conta: { type: String, required: true },
    email: { type: String, required: true },
    senha_criptografada: { type: String, required: true },
    plataformas: [{ type: String, enum: ['facebook', 'instagram'] }],
    observacoes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['aguardando_setup', 'em_andamento', 'concluido'],
      default: 'aguardando_setup',
    },
    admin_id: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    data_inicio: { type: Date, default: null },
    data_conclusao: { type: Date, default: null },
    acessos_admin: [
      {
        admin_id: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
        data_acesso: { type: Date },
      },
    ],
  },
  { timestamps: true },
)

SetupCredencialSchema.index({ empresa_id: 1 })
SetupCredencialSchema.index({ status: 1, createdAt: -1 })

export const SetupCredencial =
  mongoose.models.SetupCredencial ||
  mongoose.model<ISetupCredencial>('SetupCredencial', SetupCredencialSchema)
