import mongoose, { Schema, Document, Types } from 'mongoose'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketCategory = 'billing' | 'bug' | 'feature' | 'account' | 'outros'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface ITicketMessage {
  _id?: Types.ObjectId
  author_type: 'user' | 'support'
  author_name: string
  author_id?: Types.ObjectId | null
  content: string
  attachments: string[]
  created_at: Date
}

export interface ISupportTicket extends Document {
  user_id: Types.ObjectId
  company_id: Types.ObjectId
  subject: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  messages: ITicketMessage[]
  last_message_at: Date
  last_message_by: 'user' | 'support'
  resolved_at?: Date | null
  createdAt: Date
  updatedAt: Date
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    author_type: { type: String, enum: ['user', 'support'], required: true },
    author_name: { type: String, default: '' },
    author_id: { type: Schema.Types.ObjectId, default: null },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    created_at: { type: Date, default: Date.now },
  },
  { _id: true },
)

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    subject: { type: String, required: true, maxlength: 200 },
    category: {
      type: String,
      enum: ['billing', 'bug', 'feature', 'account', 'outros'],
      default: 'outros',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    messages: [TicketMessageSchema],
    last_message_at: { type: Date, default: Date.now },
    last_message_by: { type: String, enum: ['user', 'support'], default: 'user' },
    resolved_at: { type: Date, default: null },
  },
  { timestamps: true },
)

SupportTicketSchema.index({ user_id: 1, status: 1 })
SupportTicketSchema.index({ company_id: 1, createdAt: -1 })
SupportTicketSchema.index({ status: 1, priority: 1 })

export const SupportTicket =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema)
