import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISetupAgendamento extends Document {
  empresa_id: Types.ObjectId
  tipo: 'agendamento'
  nome: string
  whatsapp: string
  data_preferida: Date
  horario_preferido: string
  observacoes: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  admin_id: Types.ObjectId | null
  data_inicio: Date | null
  data_conclusao: Date | null
  createdAt: Date
  updatedAt: Date
}

const SetupAgendamentoSchema = new Schema<ISetupAgendamento>(
  {
    empresa_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    tipo: { type: String, enum: ['agendamento'], default: 'agendamento' },
    nome: { type: String, required: true },
    whatsapp: { type: String, required: true },
    data_preferida: { type: Date, required: true },
    horario_preferido: { type: String, required: true },
    observacoes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pendente', 'em_andamento', 'concluido'],
      default: 'pendente',
    },
    admin_id: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    data_inicio: { type: Date, default: null },
    data_conclusao: { type: Date, default: null },
  },
  { timestamps: true },
)

SetupAgendamentoSchema.index({ empresa_id: 1 })
SetupAgendamentoSchema.index({ status: 1, createdAt: -1 })

export const SetupAgendamento =
  mongoose.models.SetupAgendamento ||
  mongoose.model<ISetupAgendamento>('SetupAgendamento', SetupAgendamentoSchema)
