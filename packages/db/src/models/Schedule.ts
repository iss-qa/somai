import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IWeeklySlot {
  day: number
  time: string
  format: string
}

export interface ISchedule extends Document {
  company_id: Types.ObjectId
  active: boolean
  publish_instagram: boolean
  publish_facebook: boolean
  publish_stories: boolean
  frequency: 'daily' | '2x_day' | 'weekdays' | 'custom'
  weekly_slots: IWeeklySlot[]
  updated_at: Date
}

const WeeklySlotSchema = new Schema<IWeeklySlot>(
  {
    day: { type: Number, required: true },
    time: { type: String, required: true },
    format: { type: String, required: true },
  },
  { _id: false }
)

const ScheduleSchema = new Schema<ISchedule>({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  active: { type: Boolean, default: true },
  publish_instagram: { type: Boolean, default: true },
  publish_facebook: { type: Boolean, default: false },
  publish_stories: { type: Boolean, default: false },
  frequency: {
    type: String,
    enum: ['daily', '2x_day', 'weekdays', 'custom'],
    default: 'daily',
  },
  weekly_slots: [WeeklySlotSchema],
  updated_at: { type: Date, default: Date.now },
})

ScheduleSchema.index({ company_id: 1 })

export const Schedule =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule>('Schedule', ScheduleSchema)
