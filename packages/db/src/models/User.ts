import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUser extends Document {
  company_id: Types.ObjectId
  name: string
  email: string
  password_hash: string
  role: 'owner' | 'operator'
  active: boolean
  last_login: Date | null
  created_at: Date
}

const UserSchema = new Schema<IUser>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'operator'], required: true },
  active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
})

UserSchema.index({ email: 1 }, { unique: true })

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
