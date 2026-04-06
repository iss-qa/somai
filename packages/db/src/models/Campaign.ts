import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ICampaignLocation {
  city: string
  state: string
  country: string
  radius_km: number
}

export interface ICampaignInterest {
  id: string
  name: string
}

export interface ICampaignTargeting {
  locations: ICampaignLocation[]
  age_min: number
  age_max: number
  genders: string[]
  interests: ICampaignInterest[]
  custom_audience_id: string
}

export interface ICampaignBudget {
  daily_amount: number
  total_amount: number
  currency: string
}

export interface ICampaignMetaAds {
  enabled: boolean
  placements: string[]
  campaign_id: string
  adset_id: string
  ad_ids: string[]
  status: string
}

export interface ICampaignGoogleAds {
  enabled: boolean
  campaign_types: string[]
  campaign_id: string
  ad_group_id: string
  ad_ids: string[]
  keywords: string[]
  status: string
}

export interface ICampaignMetrics {
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  cost_per_conversion: number
  total_spent: number
  last_synced_at: Date | null
}

export interface ICampaignEstimates {
  daily_reach_min: number
  daily_reach_max: number
  total_reach_min: number
  total_reach_max: number
}

export interface ICampaign extends Document {
  company_id: Types.ObjectId
  name: string
  description: string
  type: string
  status: string

  // Content
  card_ids: Types.ObjectId[]
  video_ids: Types.ObjectId[]
  script_ids: Types.ObjectId[]
  post_ids: Types.ObjectId[]
  ad_copy: string
  cta_type: string
  destination_url: string

  // Targeting
  targeting: ICampaignTargeting

  // Budget
  budget: ICampaignBudget

  // Period
  start_date: Date | null
  end_date: Date | null
  duration_days: number

  // Platforms
  platforms: {
    meta_ads: ICampaignMetaAds
    google_ads: ICampaignGoogleAds
  }

  // Metrics
  metrics: ICampaignMetrics

  // Estimates
  estimates: ICampaignEstimates

  // Meta
  created_by: Types.ObjectId | null
  published_at: Date | null
  completed_at: Date | null

  createdAt: Date
  updatedAt: Date
}

const LocationSchema = new Schema(
  {
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'BR' },
    radius_km: { type: Number, default: 10 },
  },
  { _id: false },
)

const InterestSchema = new Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false },
)

const CampaignSchema = new Schema<ICampaign>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: [
        'awareness',
        'traffic',
        'engagement',
        'leads',
        'sales',
        'messages',
        'local_store',
      ],
      default: 'traffic',
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'active', 'paused', 'completed', 'failed'],
      default: 'draft',
    },

    // Content
    card_ids: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    video_ids: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    script_ids: [{ type: Schema.Types.ObjectId, ref: 'Script' }],
    post_ids: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    ad_copy: { type: String, default: '' },
    cta_type: {
      type: String,
      enum: [
        'LEARN_MORE',
        'SHOP_NOW',
        'SEND_MESSAGE',
        'CALL_NOW',
        'SIGN_UP',
        'BOOK_NOW',
        'GET_QUOTE',
        'WHATSAPP_MESSAGE',
      ],
      default: 'LEARN_MORE',
    },
    destination_url: { type: String, default: '' },

    // Targeting
    targeting: {
      locations: [LocationSchema],
      age_min: { type: Number, default: 18 },
      age_max: { type: Number, default: 65 },
      genders: [{ type: String }],
      interests: [InterestSchema],
      custom_audience_id: { type: String, default: '' },
    },

    // Budget
    budget: {
      daily_amount: { type: Number, default: 0 },
      total_amount: { type: Number, default: 0 },
      currency: { type: String, default: 'BRL' },
    },

    // Period
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    duration_days: { type: Number, default: 7 },

    // Platforms
    platforms: {
      meta_ads: {
        enabled: { type: Boolean, default: false },
        placements: [{ type: String }],
        campaign_id: { type: String, default: '' },
        adset_id: { type: String, default: '' },
        ad_ids: [{ type: String }],
        status: { type: String, default: '' },
      },
      google_ads: {
        enabled: { type: Boolean, default: false },
        campaign_types: [{ type: String }],
        campaign_id: { type: String, default: '' },
        ad_group_id: { type: String, default: '' },
        ad_ids: [{ type: String }],
        keywords: [{ type: String }],
        status: { type: String, default: '' },
      },
    },

    // Metrics
    metrics: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      cost_per_conversion: { type: Number, default: 0 },
      total_spent: { type: Number, default: 0 },
      last_synced_at: { type: Date, default: null },
    },

    // Estimates
    estimates: {
      daily_reach_min: { type: Number, default: 0 },
      daily_reach_max: { type: Number, default: 0 },
      total_reach_min: { type: Number, default: 0 },
      total_reach_max: { type: Number, default: 0 },
    },

    // Meta
    created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    published_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
  },
  { timestamps: true },
)

CampaignSchema.index({ company_id: 1, status: 1 })
CampaignSchema.index({ company_id: 1, createdAt: -1 })
CampaignSchema.index({ status: 1, end_date: 1 })

export const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>('Campaign', CampaignSchema)
