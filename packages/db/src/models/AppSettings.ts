import mongoose, { Schema, Document } from 'mongoose'

/**
 * Key-value store pra configs globais do sistema.
 * Uso principal: saldo comprado em provedores (fal.ai), feature flags etc.
 */
export interface IAppSettings extends Document {
  key: string
  value: any
  updated_by: string
  updated_at: Date
}

const AppSettingsSchema = new Schema<IAppSettings>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, default: null },
  updated_by: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
})

export const AppSettings =
  (mongoose.models.AppSettings as mongoose.Model<IAppSettings>) ||
  mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema)
