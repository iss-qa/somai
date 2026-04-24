import mongoose, { Schema, Document, Types } from 'mongoose'

export enum TipoMensagem {
  BOAS_VINDAS = 'boas_vindas',
  CARD_PUBLICADO = 'card_publicado',
  CARD_AGENDADO = 'card_agendado',
  LEMBRETE_MENSALIDADE = 'lembrete_mensalidade',
  BOLETO_SETUP = 'boleto_setup',
  BOLETO_MENSALIDADE = 'boleto_mensalidade',
  CONFIRMACAO_PAGAMENTO = 'confirmacao_pagamento',
  ALERTA_ATRASO = 'alerta_atraso',
  TRIAL_EXPIRANDO = 'trial_expirando',
  ACESSO_BLOQUEADO = 'acesso_bloqueado',
  ERRO_POSTAGEM = 'erro_postagem',
  MANUAL = 'manual',
  PRE_CONDICOES_SETUP = 'pre_condicoes_setup',
  LEMBRETE_SETUP = 'lembrete_setup',
  SETUP_INICIADO = 'setup_iniciado',
  SETUP_CONCLUIDO = 'setup_concluido',
  CONFIRMACAO_AGENDAMENTO = 'confirmacao_agendamento',
  CONFIRMACAO_CREDENCIAIS = 'confirmacao_credenciais',
}

export enum StatusMensagem {
  PENDENTE = 'pendente',
  ENVIADO = 'enviado',
  FALHA = 'falha',
}

export interface IMessageHistory extends Document {
  company_id: Types.ObjectId
  company_name: string
  destinatario_nome: string
  destinatario_telefone: string
  tipo: TipoMensagem
  conteudo: string
  status: StatusMensagem
  data_envio?: Date
  error_message?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const MessageHistorySchema = new Schema<IMessageHistory>(
  {
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    company_name: { type: String, required: true },
    destinatario_nome: { type: String, required: true },
    destinatario_telefone: { type: String, required: true },
    tipo: {
      type: String,
      enum: Object.values(TipoMensagem),
      required: true,
    },
    conteudo: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(StatusMensagem),
      default: StatusMensagem.PENDENTE,
    },
    data_envio: { type: Date, default: null },
    error_message: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

MessageHistorySchema.index({ company_id: 1, createdAt: -1 })
MessageHistorySchema.index({ tipo: 1, createdAt: -1 })
MessageHistorySchema.index({ status: 1, createdAt: -1 })
MessageHistorySchema.index({ destinatario_telefone: 1 })

export const MessageHistory =
  mongoose.models.MessageHistory ||
  mongoose.model<IMessageHistory>('MessageHistory', MessageHistorySchema)
