import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IReferralUse {
  _id?: Types.ObjectId
  invitee_user_id: Types.ObjectId
  invitee_company_id: Types.ObjectId
  invitee_email: string
  invitee_name: string
  signed_up_at: Date
  converted_at?: Date | null
  bonus_creditado_inviter: boolean
  bonus_creditado_invitee: boolean
}

export interface IReferral extends Document {
  code: string
  owner_user_id: Types.ObjectId
  owner_company_id: Types.ObjectId
  uses: IReferralUse[]
  total_signups: number
  total_conversions: number
  total_creditos_ganhos: number
  ativo: boolean
  createdAt: Date
  updatedAt: Date
}

const ReferralUseSchema = new Schema<IReferralUse>(
  {
    invitee_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitee_company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invitee_email: { type: String, required: true },
    invitee_name: { type: String, default: '' },
    signed_up_at: { type: Date, default: Date.now },
    converted_at: { type: Date, default: null },
    bonus_creditado_inviter: { type: Boolean, default: false },
    bonus_creditado_invitee: { type: Boolean, default: false },
  },
  { _id: true },
)

const ReferralSchema = new Schema<IReferral>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    owner_company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    uses: [ReferralUseSchema],
    total_signups: { type: Number, default: 0 },
    total_conversions: { type: Number, default: 0 },
    total_creditos_ganhos: { type: Number, default: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Referral =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema)
