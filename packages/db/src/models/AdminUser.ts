import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminUser extends Document {
  name: string
  email: string
  password_hash: string
  role: 'superadmin' | 'support'
  active: boolean
  last_login: Date | null
  created_at: Date
}

const AdminUserSchema = new Schema<IAdminUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'support'], required: true },
  active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
})

export const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema)
