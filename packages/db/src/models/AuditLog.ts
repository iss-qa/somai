import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IAuditLog extends Document {
  admin_user_id: Types.ObjectId
  action: string
  target_type: string
  target_id: string
  details: any
  ip: string
  created_at: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  admin_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
  },
  action: { type: String, required: true },
  target_type: { type: String, required: true },
  target_id: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
})

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
