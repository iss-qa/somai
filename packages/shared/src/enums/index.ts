/* ──────────────────────────────────────────────
 * Soma.ai — Shared Enums
 * ────────────────────────────────────────────── */

// ── Companies ────────────────────────────────

export enum CompanyStatus {
  Active = 'active',
  Blocked = 'blocked',
  SetupPending = 'setup_pending',
  Trial = 'trial',
  Cancelled = 'cancelled',
}

// ── Cards ────────────────────────────────────

export enum CardStatus {
  Draft = 'draft',
  Approved = 'approved',
  Scheduled = 'scheduled',
  Posted = 'posted',
  Archived = 'archived',
}

// ── Posts ─────────────────────────────────────

export enum PostStatus {
  Published = 'published',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// ── Post Queue ───────────────────────────────

export enum QueueStatus {
  Queued = 'queued',
  Processing = 'processing',
  Done = 'done',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// ── Videos ───────────────────────────────────

export enum VideoStatus {
  Queued = 'queued',
  Generating = 'generating',
  Ready = 'ready',
  Failed = 'failed',
  Posted = 'posted',
}

export enum VideoTemplate {
  DicaRapida = 'dica_rapida',
  PassoAPasso = 'passo_a_passo',
  BeneficioDestaque = 'beneficio_destaque',
  Depoimento = 'depoimento',
  Comparativo = 'comparativo',
  Lancamento = 'lancamento',
}

export enum VoiceType {
  Feminino = 'feminino',
  Masculino = 'masculino',
  Neutro = 'neutro',
}

export enum VoiceSpeed {
  Lenta = 0.8,
  Normal = 1.0,
  Rapida = 1.2,
}

export enum SubtitleMode {
  Auto = 'auto',
  Manual = 'manual',
  Off = 'off',
}

export enum BackgroundMusic {
  Nenhuma = 'nenhuma',
  Upbeat = 'upbeat',
  Calma = 'calma',
  Motivacional = 'motivacional',
  Corporativa = 'corporativa',
}

export enum VideoPalette {
  JuntixVerde = 'juntix_verde',
  EscuroPremium = 'escuro_premium',
  VibranteTropical = 'vibrante_tropical',
  MinimalistaClean = 'minimalista_clean',
  Custom = 'custom',
}

export enum AspectRatio {
  Portrait = '9:16',
  Landscape = '16:9',
  Square = '1:1',
}

export enum GenerationMethod {
  GeminiVeo = 'gemini_veo',
  Remotion = 'remotion',
  Template = 'template',
}

// ── Card Format ──────────────────────────────

export enum CardFormat {
  Feed1x1 = 'feed_1x1',
  Stories9x16 = 'stories_9x16',
  Reels = 'reels',
  Carousel = 'carousel',
}

// ── Post Type ────────────────────────────────

export enum PostType {
  Promocao = 'promocao',
  Dica = 'dica',
  Novidade = 'novidade',
  Institucional = 'institucional',
  DataComemorativa = 'data_comemorativa',
}

// ── Niche ────────────────────────────────────

export enum Niche {
  Farmacia = 'farmacia',
  Pet = 'pet',
  Moda = 'moda',
  Cosmeticos = 'cosmeticos',
  Mercearia = 'mercearia',
  Calcados = 'calcados',
  Outro = 'outro',
}

// ── Billing ──────────────────────────────────

export enum BillingStatus {
  Paid = 'paid',
  Pending = 'pending',
  Overdue = 'overdue',
}

// ── Plans ────────────────────────────────────

export enum PlanSlug {
  Starter = 'starter',
  Pro = 'pro',
  Enterprise = 'enterprise',
}

// ── User Roles ───────────────────────────────

export enum UserRole {
  Owner = 'owner',
  Operator = 'operator',
}

export enum AdminRole {
  Superadmin = 'superadmin',
  Support = 'support',
}

// ── Integrations ─────────────────────────────

export enum IntegrationStatus {
  Ok = 'ok',
  Expired = 'expired',
  Error = 'error',
  Disconnected = 'disconnected',
}

export enum WhatsAppStatus {
  Open = 'open',
  Close = 'close',
  Connecting = 'connecting',
}

// ── Notifications ────────────────────────────

export enum NotificationType {
  TokenExpired = 'token_expired',
  PostFailed = 'post_failed',
  PaymentDue = 'payment_due',
  PaymentOverdue = 'payment_overdue',
  AccessBlocked = 'access_blocked',
  SetupPending = 'setup_pending',
  VideoReady = 'video_ready',
  VideoFailed = 'video_failed',
  CampaignPublished = 'campaign_published',
  CampaignCompleted = 'campaign_completed',
}

// ── Campaigns ────────────────────────────────

export enum CampaignStatus {
  Draft = 'draft',
  Review = 'review',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CampaignType {
  Awareness = 'awareness',
  Traffic = 'traffic',
  Engagement = 'engagement',
  Leads = 'leads',
  Sales = 'sales',
  Messages = 'messages',
  LocalStore = 'local_store',
}

export enum CampaignCTA {
  LearnMore = 'LEARN_MORE',
  ShopNow = 'SHOP_NOW',
  SendMessage = 'SEND_MESSAGE',
  CallNow = 'CALL_NOW',
  SignUp = 'SIGN_UP',
  BookNow = 'BOOK_NOW',
  GetQuote = 'GET_QUOTE',
  WhatsApp = 'WHATSAPP_MESSAGE',
}

export enum AdPlacement {
  InstagramFeed = 'instagram_feed',
  InstagramStories = 'instagram_stories',
  InstagramReels = 'instagram_reels',
  FacebookFeed = 'facebook_feed',
  FacebookStories = 'facebook_stories',
  AudienceNetwork = 'audience_network',
  GoogleSearch = 'google_search',
  GoogleDisplay = 'google_display',
  YouTube = 'youtube',
  GoogleDiscovery = 'google_discovery',
}
