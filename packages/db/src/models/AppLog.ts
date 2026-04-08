import mongoose, { Schema, Document, Types } from 'mongoose'

export type AppLogLevel = 'info' | 'warn' | 'error' | 'debug'
export type AppLogCategory =
  | 'post'
  | 'queue'
  | 'worker'
  | 'auth'
  | 'api'
  | 'integration'
  | 'system'
  | 'card'
  | 'billing'

export interface IAppLog extends Document {
  level: AppLogLevel
  category: AppLogCategory
  event: string
  message: string
  company_id?: Types.ObjectId
  company_name?: string
  metadata?: Record<string, unknown>
  duration_ms?: number
  ip?: string
  created_at: Date
}

const AppLogSchema = new Schema<IAppLog>({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    required: true,
    default: 'info',
  },
  category: {
    type: String,
    enum: ['post', 'queue', 'worker', 'auth', 'api', 'integration', 'system', 'card', 'billing'],
    required: true,
  },
  event: { type: String, required: true },
  message: { type: String, required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
  company_name: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  duration_ms: { type: Number, default: null },
  ip: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
})

AppLogSchema.index({ created_at: -1 })
AppLogSchema.index({ level: 1, created_at: -1 })
AppLogSchema.index({ category: 1, created_at: -1 })
AppLogSchema.index({ company_id: 1, created_at: -1 })

// TTL: auto-delete logs older than 30 days
AppLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

export const AppLog =
  mongoose.models.AppLog || mongoose.model<IAppLog>('AppLog', AppLogSchema)
