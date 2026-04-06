/* ──────────────────────────────────────────────
 * Soma.ai — Shared TypeScript Interfaces
 * ────────────────────────────────────────────── */

import type {
  AdminRole,
  BillingStatus,
  CardFormat,
  CardStatus,
  CompanyStatus,
  IntegrationStatus,
  Niche,
  NotificationType,
  PlanSlug,
  PostStatus,
  PostType,
  QueueStatus,
  UserRole,
  VideoStatus,
  WhatsAppStatus,
} from '../enums';

// ── admin_users ──────────────────────────────

export interface IAdminUser {
  _id: string;
  name: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  active: boolean;
  last_login: Date;
  created_at: Date;
}

// ── plans ────────────────────────────────────

export interface IPlanFeatures {
  instagram: boolean;
  facebook: boolean;
  cards_limit: number;
  video_generation: boolean;
  videos_per_day: number;
  scripts: boolean;
  whatsapp: boolean;
  campaigns: boolean;
  date_suggestions: boolean;
  analytics: boolean;
}

export interface IPlan {
  _id: string;
  slug: PlanSlug;
  name: string;
  setup_price: number;
  monthly_price: number;
  features: IPlanFeatures;
  active: boolean;
  created_at: Date;
}

// ── companies ────────────────────────────────

export interface IBrandColors {
  primary: string;
  secondary: string;
}

export interface IBilling {
  monthly_amount: number;
  due_day: number;
  last_paid_at: Date;
  next_due_at: Date;
  overdue_days: number;
  status: BillingStatus;
}

export interface ICompany {
  _id: string;
  name: string;
  slug: string;
  niche: Niche;
  city: string;
  state: string;
  responsible_name: string;
  whatsapp: string;
  email: string;
  logo_url: string;
  brand_colors: IBrandColors;
  plan_id: string;
  status: CompanyStatus;
  access_enabled: boolean;
  setup_paid: boolean;
  setup_paid_at: Date;
  setup_amount: number;
  billing: IBilling;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

// ── users ────────────────────────────────────

export interface IUser {
  _id: string;
  company_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  last_login: Date;
  created_at: Date;
}

// ── integrations ─────────────────────────────

export interface IMeta {
  access_token: string;
  token_expires_at: Date;
  instagram_account_id: string;
  instagram_username: string;
  facebook_page_id: string;
  facebook_page_name: string;
  connected: boolean;
  connected_at: Date;
  last_verified_at: Date;
  status: IntegrationStatus;
}

export interface IWhatsApp {
  instance_name: string;
  connected: boolean;
  status: WhatsAppStatus;
}

export interface IGemini {
  api_key: string;
  active: boolean;
  last_tested_at: Date;
}

export interface IIntegration {
  _id: string;
  company_id: string;
  meta: IMeta;
  whatsapp: IWhatsApp;
  gemini: IGemini;
  updated_at: Date;
}

// ── niche_configs ────────────────────────────

export interface INicheConfigColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface INicheConfigAiPrompts {
  card_base: string;
  caption_base: string;
  video_base: string;
}

export interface INicheConfig {
  _id: string;
  niche: Niche;
  label: string;
  default_colors: INicheConfigColors;
  post_types: string[];
  ai_prompts: INicheConfigAiPrompts;
  default_hashtags: string[];
  created_at: Date;
  updated_at: Date;
}

// ── hashtag_sets ─────────────────────────────

export interface IHashtagSet {
  _id: string;
  company_id: string | null;
  niche: Niche;
  name: string;
  hashtags: string[];
  is_default: boolean;
  created_at: Date;
}

// ── media_library ────────────────────────────

export interface IMediaLibrary {
  _id: string;
  company_id: string;
  type: string;
  name: string;
  url: string;
  thumbnail_url: string;
  size_bytes: number;
  mime_type: string;
  tags: string[];
  created_at: Date;
}

// ── templates ────────────────────────────────

export interface ITemplateConfig {
  background_style: string;
  font_headline: string;
  font_body: string;
  layout_zones: Record<string, unknown>;
}

export interface ITemplate {
  _id: string;
  name: string;
  niche: Niche | null;
  format: CardFormat;
  post_type: PostType;
  thumbnail_url: string;
  config: ITemplateConfig;
  active: boolean;
  created_at: Date;
}

// ── cards ────────────────────────────────────

export interface ICard {
  _id: string;
  company_id: string;
  template_id: string;
  format: CardFormat;
  post_type: PostType;
  headline: string;
  subtext: string;
  cta: string;
  product_name: string;
  price_original: number;
  price_promo: number;
  ai_prompt_used: string;
  generated_image_url: string;
  caption: string;
  hashtags: string[];
  status: CardStatus;
  approved_at: Date;
  campaign_id: string | null;
  post_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── videos ───────────────────────────────────

export interface IVideo {
  _id: string;
  company_id: string;
  title: string;
  type: string;
  source_card_id: string | null;
  product_name: string;
  product_images: string[];
  price_original: number;
  price_promo: number;
  extra_text: string;
  gemini_prompt: string;
  gemini_script: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  has_audio: boolean;
  audio_url: string;
  status: VideoStatus;
  error_message: string;
  generation_time_ms: number;
  scheduled_post_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── scripts ──────────────────────────────────

export interface IScript {
  _id: string;
  company_id: string;
  title: string;
  category: string;
  text: string;
  char_count: number;
  audio_url: string;
  video_url: string;
  images: string[];
  sent_via_whatsapp: boolean;
  whatsapp_sent_at: Date;
  campaign_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── campaigns ────────────────────────────────

export interface ICampaign {
  _id: string;
  company_id: string;
  name: string;
  description: string;
  theme: string;
  start_date: Date;
  end_date: Date;
  status: string;
  card_ids: string[];
  video_ids: string[];
  script_ids: string[];
  post_ids: string[];
  created_at: Date;
  updated_at: Date;
}

// ── schedules ────────────────────────────────

export interface IWeeklySlot {
  day: number;
  time: string;
  format: string;
}

export interface ISchedule {
  _id: string;
  company_id: string;
  active: boolean;
  publish_instagram: boolean;
  publish_facebook: boolean;
  publish_stories: boolean;
  frequency: string;
  weekly_slots: IWeeklySlot[];
  updated_at: Date;
}

// ── post_queue ───────────────────────────────

export interface IPostQueue {
  _id: string;
  company_id: string;
  card_id: string;
  video_id: string | null;
  scheduled_at: Date;
  platforms: string[];
  post_type: string;
  caption: string;
  hashtags: string[];
  status: QueueStatus;
  bullmq_job_id: string;
  retry_count: number;
  max_retries: number;
  created_at: Date;
}

// ── posts ────────────────────────────────────

export interface IPost {
  _id: string;
  company_id: string;
  queue_id: string;
  card_id: string;
  video_id: string | null;
  platforms: string[];
  post_type: string;
  caption: string;
  hashtags: string[];
  status: PostStatus;
  published_at: Date;
  instagram_post_id: string;
  facebook_post_id: string;
  error_code: string;
  error_message: string;
  retry_count: number;
  analytics_id: string | null;
  created_at: Date;
}

// ── dates_calendar ───────────────────────────

export interface IDatesCalendar {
  _id: string;
  date: string;
  name: string;
  description: string;
  niches: string[];
  suggested_post_type: string;
  suggested_headline: string;
  ai_prompt_hint: string;
  active: boolean;
}

// ── analytics ────────────────────────────────

export interface IAnalytics {
  _id: string;
  company_id: string;
  post_id: string;
  platform: string;
  platform_post_id: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  story_replies: number;
  story_exits: number;
  fetched_at: Date;
  created_at: Date;
}

// ── notifications ────────────────────────────

export interface INotification {
  _id: string;
  target: string;
  company_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url: string;
  created_at: Date;
}

// ── audit_logs ───────────────────────────────

export interface IAuditLog {
  _id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip: string;
  created_at: Date;
}
