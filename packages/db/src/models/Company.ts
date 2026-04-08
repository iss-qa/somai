import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ICompanyBilling {
  monthly_amount: number
  due_day: number
  last_paid_at: Date | null
  next_due_at: Date | null
  overdue_days: number
  status: 'paid' | 'pending' | 'overdue'
}

export interface ICompanyBrandColors {
  primary: string
  secondary: string
}

export interface ICompany extends Document {
  name: string
  slug: string
  niche: string
  city: string
  state: string
  responsible_name: string
  whatsapp: string
  email: string
  logo_url: string
  brand_colors: ICompanyBrandColors
  plan_id: Types.ObjectId
  status: 'active' | 'blocked' | 'setup_pending' | 'trial' | 'cancelled'
  access_enabled: boolean
  setup_paid: boolean
  setup_paid_at: Date | null
  setup_amount: number
  trial_days: number
  trial_expires_at: Date | null
  billing: ICompanyBilling
  notes: string
  createdAt: Date
  updatedAt: Date
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    niche: {
      type: String,
      enum: [
        'farmacia',
        'pet',
        'moda',
        'cosmeticos',
        'mercearia',
        'calcados',
        'restaurante',
        'confeitaria',
        'hamburgueria',
        'cafeteria',
        'suplementos',
        'estetica',
        'odontologia',
        'academia',
        'salao_beleza',
        'barbearia',
        'imobiliaria',
        'educacao',
        'arquitetura',
        'contabilidade',
        'viagens',
        'eletronicos',
        'decoracao',
        'papelaria',
        'automotivo',
        'construcao',
        'outro',
      ],
      required: true,
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    responsible_name: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    logo_url: { type: String, default: '' },
    brand_colors: {
      primary: { type: String, default: '#000000' },
      secondary: { type: String, default: '#FFFFFF' },
    },
    plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
    status: {
      type: String,
      enum: ['active', 'blocked', 'setup_pending', 'trial', 'cancelled'],
      default: 'setup_pending',
    },
    access_enabled: { type: Boolean, default: false },
    setup_paid: { type: Boolean, default: false },
    setup_paid_at: { type: Date, default: null },
    setup_amount: { type: Number, default: 0 },
    trial_days: { type: Number, default: 3 },
    trial_expires_at: { type: Date, default: null },
    billing: {
      monthly_amount: { type: Number, default: 0 },
      due_day: { type: Number, default: 10 },
      last_paid_at: { type: Date, default: null },
      next_due_at: { type: Date, default: null },
      overdue_days: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['paid', 'pending', 'overdue'],
        default: 'pending',
      },
      setup_charge_id: { type: String, default: '' },
      subscription_id: { type: String, default: '' },
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
)

CompanySchema.index({ status: 1 })
CompanySchema.index({ 'billing.status': 1 })
CompanySchema.index({ niche: 1 })

export const Company =
  mongoose.models.Company ||
  mongoose.model<ICompany>('Company', CompanySchema)
