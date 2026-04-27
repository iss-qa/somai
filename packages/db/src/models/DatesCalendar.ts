import mongoose, { Schema, Document } from 'mongoose'

export interface IDatesCalendar extends Document {
  date: string
  name: string
  description: string
  niches: string[]
  suggested_post_type: string
  suggested_headline: string
  ai_prompt_hint: string
  active: boolean
  // 'soma' = entrada curada nacional/regional pelo seed oficial.
  // 'admin' = customizada via painel administrativo.
  // '' (legado) = entradas antigas geradas por IA por nicho — nao curadas.
  source: 'soma' | 'admin' | ''
}

const DatesCalendarSchema = new Schema<IDatesCalendar>({
  date: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  niches: [{ type: String }],
  suggested_post_type: { type: String, default: '' },
  suggested_headline: { type: String, default: '' },
  ai_prompt_hint: { type: String, default: '' },
  active: { type: Boolean, default: true },
  source: { type: String, default: '' },
})

export const DatesCalendar =
  mongoose.models.DatesCalendar ||
  mongoose.model<IDatesCalendar>('DatesCalendar', DatesCalendarSchema)
