import mongoose, { Schema, Document, Types } from 'mongoose'

export interface INotification extends Document {
  target: 'company' | 'admin'
  company_id: Types.ObjectId | null
  type: string
  title: string
  message: string
  read: boolean
  dismissed: boolean
  action_url: string
  expires_at: Date | null
  created_at: Date
}

const NotificationSchema = new Schema<INotification>({
  target: { type: String, enum: ['company', 'admin'], required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  read: { type: Boolean, default: false },
  dismissed: { type: Boolean, default: false },
  action_url: { type: String, default: '' },
  expires_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
})

NotificationSchema.index({ target: 1, company_id: 1, read: 1 })

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)
