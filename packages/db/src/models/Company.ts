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
  accent?: string
}

// ── v2.0: blocos do onboarding/wizard ─────────────────
export type ObjetivoV2 =
  | 'vender'
  | 'autoridade'
  | 'engajamento'
  | 'leads'

export interface ICompanyMarcaV2 {
  nome?: string
  descricao?: string
  tag?: string
  instagram?: string
  site?: string
  localizacao?: string
  diferencial?: string
  produtosServicos?: string
}

export interface ICompanyPublicoV2 {
  clienteIdeal?: string
  dores?: string
  desejos?: string
}

export type TomDeVozV2 =
  | 'descontraido'
  | 'profissional'
  | 'inspirador'
  | 'educativo'
  | 'divertido'
  | 'acolhedor'
  | 'direto'
  | 'sofisticado'
  | 'amigavel'
  | 'motivacional'

export interface ICompanyIdentidadeV2 {
  tomDeVoz?: TomDeVozV2[]
  personalidade?: string
}

export type EstiloVisualV2 =
  | 'minimalista'
  | 'colorido'
  | 'elegante'
  | 'moderno'
  | 'rustico'
  | 'feminino'
  | 'corporativo'

export interface ICompanyEstiloVisualV2 {
  cores?: string[]
  logoUrl?: string
  estilo?: EstiloVisualV2
  fontes?: string
  paleta?: string
  descricao?: string
  referenciaUrl?: string
}

export type OnboardingStepV2 =
  | 'inicio'
  | 'analise'
  | 'objetivo'
  | 'marca'
  | 'publico'
  | 'identidade'
  | 'estilo'
  | 'completo'

export interface ICompany extends Document {
  name: string
  slug: string
  niche: string
  city: string
  state: string
  responsible_name: string
  document: string
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
  integracao_configurada: boolean
  billing: ICompanyBilling
  notes: string
  // v2.0
  objetivo?: ObjetivoV2
  marca?: ICompanyMarcaV2
  publico?: ICompanyPublicoV2
  identidade?: ICompanyIdentidadeV2
  estiloVisual?: ICompanyEstiloVisualV2
  onboardingCompleto?: boolean
  onboardingStep?: OnboardingStepV2
  onboardingFonte?: 'instagram' | 'site' | 'manual'
  instagramConectado?: boolean
  instagramHandle?: string
  owner_user_id?: Types.ObjectId
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
        'igreja',
        'advocacia',
        'saude',
        'tecnologia',
        'consultoria',
        'fotografia',
        'joalheria',
        'floricultura',
        'otica',
        'outro',
      ],
      required: true,
    },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    responsible_name: { type: String, required: true },
    document: { type: String, default: '' },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    logo_url: { type: String, default: '' },
    brand_colors: {
      primary: { type: String, default: '#000000' },
      secondary: { type: String, default: '#FFFFFF' },
      accent: { type: String, default: '' },
    },
    plan_id: { type: Schema.Types.ObjectId, ref: 'Plan', default: null },
    status: {
      type: String,
      enum: [
        'active',
        'blocked',
        'setup_pending',
        'pending_subscription',
        'trial',
        'cancelled',
      ],
      default: 'setup_pending',
    },
    access_enabled: { type: Boolean, default: false },
    setup_paid: { type: Boolean, default: false },
    setup_paid_at: { type: Date, default: null },
    setup_amount: { type: Number, default: 0 },
    trial_days: { type: Number, default: 7 },
    trial_expires_at: { type: Date, default: null },
    billing: {
      monthly_amount: { type: Number, default: 0 },
      due_day: { type: Number, default: 10 },
      last_paid_at: { type: Date, default: null },
      next_due_at: { type: Date, default: null },
      overdue_days: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['paid', 'pending', 'pending_subscription', 'overdue'],
        default: 'pending',
      },
      setup_charge_id: { type: String, default: '' },
      subscription_id: { type: String, default: '' },
    },
    integracao_configurada: { type: Boolean, default: false },
    notes: { type: String, default: '' },

    // ── v2.0 ────────────────────────────────────
    objetivo: {
      type: String,
      enum: ['vender', 'autoridade', 'engajamento', 'leads'],
      default: null,
    },
    marca: {
      nome: { type: String, default: '' },
      descricao: { type: String, default: '' },
      tag: { type: String, default: '' },
      instagram: { type: String, default: '' },
      site: { type: String, default: '' },
      localizacao: { type: String, default: '' },
      diferencial: { type: String, default: '' },
      produtosServicos: { type: String, default: '' },
    },
    publico: {
      clienteIdeal: { type: String, default: '' },
      dores: { type: String, default: '' },
      desejos: { type: String, default: '' },
    },
    identidade: {
      tomDeVoz: [
        {
          type: String,
          enum: [
            'descontraido',
            'profissional',
            'inspirador',
            'educativo',
            'divertido',
            'acolhedor',
            'direto',
            'sofisticado',
            'amigavel',
            'motivacional',
          ],
        },
      ],
      personalidade: { type: String, default: '' },
    },
    estiloVisual: {
      cores: [{ type: String }],
      logoUrl: { type: String, default: '' },
      estilo: {
        type: String,
        enum: [
          'minimalista',
          'colorido',
          'elegante',
          'moderno',
          'rustico',
          'feminino',
          'corporativo',
        ],
        default: null,
      },
      fontes: { type: String, default: '' },
      paleta: { type: String, default: '' },
      descricao: { type: String, default: '' },
      referenciaUrl: { type: String, default: '' },
    },
    onboardingCompleto: { type: Boolean, default: false },
    onboardingStep: {
      type: String,
      enum: [
        'inicio',
        'analise',
        'objetivo',
        'marca',
        'publico',
        'identidade',
        'estilo',
        'completo',
      ],
      default: 'inicio',
    },
    onboardingFonte: {
      type: String,
      enum: ['instagram', 'site', 'manual'],
      default: null,
    },
    instagramConectado: { type: Boolean, default: false },
    instagramHandle: { type: String, default: '' },
    owner_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
)

CompanySchema.index({ status: 1 })
CompanySchema.index({ 'billing.status': 1 })
CompanySchema.index({ niche: 1 })
CompanySchema.index({ document: 1 }, { sparse: true })
CompanySchema.index({ onboardingCompleto: 1 })
CompanySchema.index({ owner_user_id: 1 })

export const Company =
  mongoose.models.Company ||
  mongoose.model<ICompany>('Company', CompanySchema)
