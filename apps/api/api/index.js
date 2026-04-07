"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/_handler.ts
var handler_exports = {};
__export(handler_exports, {
  default: () => handler
});
module.exports = __toCommonJS(handler_exports);

// src/app.ts
var import_fastify = __toESM(require("fastify"));
var import_cors = __toESM(require("@fastify/cors"));
var import_cookie = __toESM(require("@fastify/cookie"));
var import_jwt = __toESM(require("@fastify/jwt"));

// ../../packages/db/src/connection.ts
var import_mongoose = __toESM(require("mongoose"));
var isConnected = false;
async function connectDB(uri) {
  if (isConnected) return;
  await import_mongoose.default.connect(uri);
  isConnected = true;
  console.log("MongoDB conectado");
}

// ../../packages/db/src/models/AdminUser.ts
var import_mongoose2 = __toESM(require("mongoose"));
var AdminUserSchema = new import_mongoose2.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "support"], required: true },
  active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});
var AdminUser = import_mongoose2.default.models.AdminUser || import_mongoose2.default.model("AdminUser", AdminUserSchema);

// ../../packages/db/src/models/Plan.ts
var import_mongoose3 = __toESM(require("mongoose"));
var PlanSchema = new import_mongoose3.Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  setup_price: { type: Number, required: true },
  monthly_price: { type: Number, required: true },
  features: {
    instagram: { type: Boolean, default: false },
    facebook: { type: Boolean, default: false },
    cards_limit: { type: Number, default: 0 },
    video_generation: { type: Boolean, default: false },
    videos_per_day: { type: Number, default: 0 },
    scripts: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    campaigns: { type: Boolean, default: false },
    date_suggestions: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false }
  },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});
var Plan = import_mongoose3.default.models.Plan || import_mongoose3.default.model("Plan", PlanSchema);

// ../../packages/db/src/models/Company.ts
var import_mongoose4 = __toESM(require("mongoose"));
var CompanySchema = new import_mongoose4.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    niche: {
      type: String,
      enum: [
        "farmacia",
        "pet",
        "moda",
        "cosmeticos",
        "mercearia",
        "calcados",
        "outro"
      ],
      required: true
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    responsible_name: { type: String, required: true },
    whatsapp: { type: String, required: true },
    email: { type: String, required: true },
    logo_url: { type: String, default: "" },
    brand_colors: {
      primary: { type: String, default: "#000000" },
      secondary: { type: String, default: "#FFFFFF" }
    },
    plan_id: { type: import_mongoose4.Schema.Types.ObjectId, ref: "Plan", default: null },
    status: {
      type: String,
      enum: ["active", "blocked", "setup_pending", "trial", "cancelled"],
      default: "setup_pending"
    },
    access_enabled: { type: Boolean, default: false },
    setup_paid: { type: Boolean, default: false },
    setup_paid_at: { type: Date, default: null },
    setup_amount: { type: Number, default: 0 },
    billing: {
      monthly_amount: { type: Number, default: 0 },
      due_day: { type: Number, default: 10 },
      last_paid_at: { type: Date, default: null },
      next_due_at: { type: Date, default: null },
      overdue_days: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["paid", "pending", "overdue"],
        default: "pending"
      }
    },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);
CompanySchema.index({ status: 1 });
CompanySchema.index({ "billing.status": 1 });
CompanySchema.index({ niche: 1 });
var Company = import_mongoose4.default.models.Company || import_mongoose4.default.model("Company", CompanySchema);

// ../../packages/db/src/models/User.ts
var import_mongoose5 = __toESM(require("mongoose"));
var UserSchema = new import_mongoose5.Schema({
  company_id: { type: import_mongoose5.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ["owner", "operator"], required: true },
  active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});
UserSchema.index({ email: 1 }, { unique: true });
var User = import_mongoose5.default.models.User || import_mongoose5.default.model("User", UserSchema);

// ../../packages/db/src/models/Integration.ts
var import_mongoose6 = __toESM(require("mongoose"));
var IntegrationSchema = new import_mongoose6.Schema({
  company_id: { type: import_mongoose6.Schema.Types.ObjectId, ref: "Company", required: true },
  meta: {
    access_token: { type: String, default: "" },
    token_expires_at: { type: Date, default: null },
    instagram_account_id: { type: String, default: "" },
    instagram_username: { type: String, default: "" },
    facebook_page_id: { type: String, default: "" },
    facebook_page_name: { type: String, default: "" },
    connected: { type: Boolean, default: false },
    connected_at: { type: Date, default: null },
    last_verified_at: { type: Date, default: null },
    status: { type: String, default: "disconnected" }
  },
  whatsapp: {
    instance_name: { type: String, default: "" },
    connected: { type: Boolean, default: false },
    status: { type: String, default: "disconnected" }
  },
  gemini: {
    api_key: { type: String, default: "" },
    active: { type: Boolean, default: false },
    last_tested_at: { type: Date, default: null }
  },
  updated_at: { type: Date, default: Date.now }
});
IntegrationSchema.index({ company_id: 1 });
var Integration = import_mongoose6.default.models.Integration || import_mongoose6.default.model("Integration", IntegrationSchema);

// ../../packages/db/src/models/NicheConfig.ts
var import_mongoose7 = __toESM(require("mongoose"));
var NicheConfigSchema = new import_mongoose7.Schema(
  {
    niche: { type: String, required: true },
    label: { type: String, required: true },
    default_colors: {
      primary: { type: String, default: "#000000" },
      secondary: { type: String, default: "#FFFFFF" },
      accent: { type: String, default: "#FF0000" }
    },
    post_types: [{ type: String }],
    ai_prompts: {
      card_base: { type: String, default: "" },
      caption_base: { type: String, default: "" },
      video_base: { type: String, default: "" }
    },
    default_hashtags: [{ type: String }]
  },
  { timestamps: true }
);
var NicheConfig = import_mongoose7.default.models.NicheConfig || import_mongoose7.default.model("NicheConfig", NicheConfigSchema);

// ../../packages/db/src/models/HashtagSet.ts
var import_mongoose8 = __toESM(require("mongoose"));
var HashtagSetSchema = new import_mongoose8.Schema({
  company_id: { type: import_mongoose8.Schema.Types.ObjectId, ref: "Company", default: null },
  niche: { type: String, required: true },
  name: { type: String, required: true },
  hashtags: [{ type: String }],
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
var HashtagSet = import_mongoose8.default.models.HashtagSet || import_mongoose8.default.model("HashtagSet", HashtagSetSchema);

// ../../packages/db/src/models/MediaLibrary.ts
var import_mongoose9 = __toESM(require("mongoose"));
var MediaLibrarySchema = new import_mongoose9.Schema({
  company_id: { type: import_mongoose9.Schema.Types.ObjectId, ref: "Company", required: true },
  type: {
    type: String,
    enum: ["logo", "product_photo", "banner", "video_thumbnail"],
    required: true
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail_url: { type: String, default: "" },
  size_bytes: { type: Number, default: 0 },
  mime_type: { type: String, default: "" },
  tags: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});
MediaLibrarySchema.index({ company_id: 1 });
var MediaLibrary = import_mongoose9.default.models.MediaLibrary || import_mongoose9.default.model("MediaLibrary", MediaLibrarySchema);

// ../../packages/db/src/models/Template.ts
var import_mongoose10 = __toESM(require("mongoose"));
var TemplateSchema = new import_mongoose10.Schema({
  name: { type: String, required: true },
  niche: { type: String, default: null },
  format: { type: String, required: true },
  post_type: { type: String, required: true },
  thumbnail_url: { type: String, default: "" },
  config: {
    background_style: { type: String, default: "" },
    font_headline: { type: String, default: "" },
    font_body: { type: String, default: "" },
    layout_zones: { type: import_mongoose10.Schema.Types.Mixed, default: {} }
  },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});
var Template = import_mongoose10.default.models.Template || import_mongoose10.default.model("Template", TemplateSchema);

// ../../packages/db/src/models/Card.ts
var import_mongoose11 = __toESM(require("mongoose"));
var CardSchema = new import_mongoose11.Schema(
  {
    company_id: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    },
    template_id: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "Template",
      default: null
    },
    format: { type: String, required: true },
    post_type: { type: String, required: true },
    headline: { type: String, default: "" },
    subtext: { type: String, default: "" },
    cta: { type: String, default: "" },
    product_name: { type: String, default: "" },
    price_original: { type: Number, default: 0 },
    price_promo: { type: Number, default: 0 },
    ai_prompt_used: { type: String, default: "" },
    generated_image_url: { type: String, default: "" },
    caption: { type: String, default: "" },
    hashtags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "approved", "scheduled", "posted", "archived"],
      default: "draft"
    },
    approved_at: { type: Date, default: null },
    campaign_id: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null
    },
    post_id: { type: import_mongoose11.Schema.Types.ObjectId, ref: "Post", default: null }
  },
  { timestamps: true }
);
CardSchema.index({ company_id: 1, status: 1 });
CardSchema.index({ format: 1 });
var Card = import_mongoose11.default.models.Card || import_mongoose11.default.model("Card", CardSchema);

// ../../packages/db/src/models/Video.ts
var import_mongoose12 = __toESM(require("mongoose"));
var SubtitleSegmentSchema = new import_mongoose12.Schema(
  {
    text: { type: String, required: true },
    start_ms: { type: Number, required: true },
    end_ms: { type: Number, required: true }
  },
  { _id: false }
);
var VideoSlideSchema = new import_mongoose12.Schema(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ["card", "text", "image"], default: "text" },
    card_id: { type: import_mongoose12.Schema.Types.ObjectId, ref: "Card", default: null },
    title: { type: String, default: "" },
    text: { type: String, default: "" },
    image_url: { type: String, default: "" },
    duration_ms: { type: Number, default: 5e3 }
  },
  { _id: false }
);
var VideoSchema = new import_mongoose12.Schema(
  {
    company_id: {
      type: import_mongoose12.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    title: { type: String, required: true },
    type: { type: String, required: true },
    source_card_id: {
      type: import_mongoose12.Schema.Types.ObjectId,
      ref: "Card",
      default: null
    },
    // Template & format
    template: {
      type: String,
      enum: [
        "dica_rapida",
        "passo_a_passo",
        "beneficio_destaque",
        "depoimento",
        "comparativo",
        "lancamento"
      ],
      default: "dica_rapida"
    },
    target_duration: { type: Number, default: 15 },
    aspect_ratio: {
      type: String,
      enum: ["9:16", "16:9", "1:1"],
      default: "9:16"
    },
    // Product
    product_name: { type: String, default: "" },
    product_images: [{ type: String }],
    price_original: { type: Number, default: 0 },
    price_promo: { type: Number, default: 0 },
    extra_text: { type: String, default: "" },
    // Narration
    narration_text: { type: String, default: "" },
    voice_type: {
      type: String,
      enum: ["feminino", "masculino", "neutro"],
      default: "feminino"
    },
    voice_speed: { type: Number, default: 1 },
    narration_audio_url: { type: String, default: "" },
    // Music
    background_music: {
      type: String,
      enum: ["nenhuma", "upbeat", "calma", "motivacional", "corporativa"],
      default: "nenhuma"
    },
    // Visual
    palette: {
      type: String,
      enum: [
        "juntix_verde",
        "escuro_premium",
        "vibrante_tropical",
        "minimalista_clean",
        "custom"
      ],
      default: "juntix_verde"
    },
    site_link: { type: String, default: "" },
    company_logo_url: { type: String, default: "" },
    // Subtitles
    subtitle_mode: {
      type: String,
      enum: ["auto", "manual", "off"],
      default: "auto"
    },
    subtitle_text: { type: String, default: "" },
    subtitles: [SubtitleSegmentSchema],
    // Slides
    slides: [VideoSlideSchema],
    // AI Generation
    gemini_prompt: { type: String, default: "" },
    gemini_script: { type: String, default: "" },
    generation_method: {
      type: String,
      enum: ["gemini_veo", "remotion", "template", ""],
      default: ""
    },
    gemini_model_used: { type: String, default: "" },
    use_gemini_veo: { type: Boolean, default: false },
    // Output
    video_url: { type: String, default: "" },
    thumbnail_url: { type: String, default: "" },
    duration_seconds: { type: Number, default: 0 },
    has_audio: { type: Boolean, default: false },
    audio_url: { type: String, default: "" },
    // Status
    status: {
      type: String,
      enum: ["queued", "generating", "ready", "failed", "posted"],
      default: "queued"
    },
    error_message: { type: String, default: "" },
    generation_time_ms: { type: Number, default: 0 },
    generation_progress: { type: Number, default: 0, min: 0, max: 100 },
    scheduled_post_id: {
      type: import_mongoose12.Schema.Types.ObjectId,
      ref: "PostQueue",
      default: null
    }
  },
  { timestamps: true }
);
VideoSchema.index({ company_id: 1, status: 1 });
VideoSchema.index({ company_id: 1, createdAt: -1 });
var Video = import_mongoose12.default.models.Video || import_mongoose12.default.model("Video", VideoSchema);

// ../../packages/db/src/models/Script.ts
var import_mongoose13 = __toESM(require("mongoose"));
var ScriptSchema = new import_mongoose13.Schema(
  {
    company_id: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    title: { type: String, required: true },
    category: { type: String, default: "" },
    text: { type: String, default: "" },
    char_count: { type: Number, default: 0 },
    audio_url: { type: String, default: "" },
    video_url: { type: String, default: "" },
    images: [{ type: String }],
    sent_via_whatsapp: { type: Boolean, default: false },
    whatsapp_sent_at: { type: Date, default: null },
    campaign_id: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null
    }
  },
  { timestamps: true }
);
var Script = import_mongoose13.default.models.Script || import_mongoose13.default.model("Script", ScriptSchema);

// ../../packages/db/src/models/Campaign.ts
var import_mongoose14 = __toESM(require("mongoose"));
var LocationSchema = new import_mongoose14.Schema(
  {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "BR" },
    radius_km: { type: Number, default: 10 }
  },
  { _id: false }
);
var InterestSchema = new import_mongoose14.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, default: "" }
  },
  { _id: false }
);
var CampaignSchema = new import_mongoose14.Schema(
  {
    company_id: {
      type: import_mongoose14.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: [
        "awareness",
        "traffic",
        "engagement",
        "leads",
        "sales",
        "messages",
        "local_store"
      ],
      default: "traffic"
    },
    status: {
      type: String,
      enum: ["draft", "review", "active", "paused", "completed", "failed"],
      default: "draft"
    },
    // Content
    card_ids: [{ type: import_mongoose14.Schema.Types.ObjectId, ref: "Card" }],
    video_ids: [{ type: import_mongoose14.Schema.Types.ObjectId, ref: "Video" }],
    script_ids: [{ type: import_mongoose14.Schema.Types.ObjectId, ref: "Script" }],
    post_ids: [{ type: import_mongoose14.Schema.Types.ObjectId, ref: "Post" }],
    ad_copy: { type: String, default: "" },
    cta_type: {
      type: String,
      enum: [
        "LEARN_MORE",
        "SHOP_NOW",
        "SEND_MESSAGE",
        "CALL_NOW",
        "SIGN_UP",
        "BOOK_NOW",
        "GET_QUOTE",
        "WHATSAPP_MESSAGE"
      ],
      default: "LEARN_MORE"
    },
    destination_url: { type: String, default: "" },
    // Targeting
    targeting: {
      locations: [LocationSchema],
      age_min: { type: Number, default: 18 },
      age_max: { type: Number, default: 65 },
      genders: [{ type: String }],
      interests: [InterestSchema],
      custom_audience_id: { type: String, default: "" }
    },
    // Budget
    budget: {
      daily_amount: { type: Number, default: 0 },
      total_amount: { type: Number, default: 0 },
      currency: { type: String, default: "BRL" }
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
        campaign_id: { type: String, default: "" },
        adset_id: { type: String, default: "" },
        ad_ids: [{ type: String }],
        status: { type: String, default: "" }
      },
      google_ads: {
        enabled: { type: Boolean, default: false },
        campaign_types: [{ type: String }],
        campaign_id: { type: String, default: "" },
        ad_group_id: { type: String, default: "" },
        ad_ids: [{ type: String }],
        keywords: [{ type: String }],
        status: { type: String, default: "" }
      }
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
      last_synced_at: { type: Date, default: null }
    },
    // Estimates
    estimates: {
      daily_reach_min: { type: Number, default: 0 },
      daily_reach_max: { type: Number, default: 0 },
      total_reach_min: { type: Number, default: 0 },
      total_reach_max: { type: Number, default: 0 }
    },
    // Meta
    created_by: { type: import_mongoose14.Schema.Types.ObjectId, ref: "User", default: null },
    published_at: { type: Date, default: null },
    completed_at: { type: Date, default: null }
  },
  { timestamps: true }
);
CampaignSchema.index({ company_id: 1, status: 1 });
CampaignSchema.index({ company_id: 1, createdAt: -1 });
CampaignSchema.index({ status: 1, end_date: 1 });
var Campaign = import_mongoose14.default.models.Campaign || import_mongoose14.default.model("Campaign", CampaignSchema);

// ../../packages/db/src/models/Schedule.ts
var import_mongoose15 = __toESM(require("mongoose"));
var WeeklySlotSchema = new import_mongoose15.Schema(
  {
    day: { type: Number, required: true },
    time: { type: String, required: true },
    format: { type: String, required: true }
  },
  { _id: false }
);
var ScheduleSchema = new import_mongoose15.Schema({
  company_id: { type: import_mongoose15.Schema.Types.ObjectId, ref: "Company", required: true },
  active: { type: Boolean, default: true },
  publish_instagram: { type: Boolean, default: true },
  publish_facebook: { type: Boolean, default: false },
  publish_stories: { type: Boolean, default: false },
  frequency: {
    type: String,
    enum: ["daily", "2x_day", "weekdays", "custom"],
    default: "daily"
  },
  weekly_slots: [WeeklySlotSchema],
  updated_at: { type: Date, default: Date.now }
});
ScheduleSchema.index({ company_id: 1 });
var Schedule = import_mongoose15.default.models.Schedule || import_mongoose15.default.model("Schedule", ScheduleSchema);

// ../../packages/db/src/models/PostQueue.ts
var import_mongoose16 = __toESM(require("mongoose"));
var PostQueueSchema = new import_mongoose16.Schema({
  company_id: { type: import_mongoose16.Schema.Types.ObjectId, ref: "Company", required: true },
  card_id: { type: import_mongoose16.Schema.Types.ObjectId, ref: "Card", required: true },
  video_id: { type: import_mongoose16.Schema.Types.ObjectId, ref: "Video", default: null },
  scheduled_at: { type: Date, required: true },
  platforms: [{ type: String }],
  post_type: { type: String, required: true },
  caption: { type: String, default: "" },
  hashtags: [{ type: String }],
  status: {
    type: String,
    enum: ["queued", "processing", "done", "failed", "cancelled"],
    default: "queued"
  },
  bullmq_job_id: { type: String, default: "" },
  retry_count: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  created_at: { type: Date, default: Date.now }
});
PostQueueSchema.index({ company_id: 1, status: 1 });
PostQueueSchema.index({ scheduled_at: 1, status: 1 });
var PostQueue = import_mongoose16.default.models.PostQueue || import_mongoose16.default.model("PostQueue", PostQueueSchema);

// ../../packages/db/src/models/Post.ts
var import_mongoose17 = __toESM(require("mongoose"));
var PostSchema = new import_mongoose17.Schema({
  company_id: { type: import_mongoose17.Schema.Types.ObjectId, ref: "Company", required: true },
  queue_id: { type: import_mongoose17.Schema.Types.ObjectId, ref: "PostQueue", required: true },
  card_id: { type: import_mongoose17.Schema.Types.ObjectId, ref: "Card", required: true },
  video_id: { type: import_mongoose17.Schema.Types.ObjectId, ref: "Video", default: null },
  platforms: [{ type: String }],
  post_type: { type: String, required: true },
  caption: { type: String, default: "" },
  hashtags: [{ type: String }],
  status: {
    type: String,
    enum: ["published", "failed", "cancelled"],
    required: true
  },
  published_at: { type: Date, default: null },
  instagram_post_id: { type: String, default: "" },
  facebook_post_id: { type: String, default: "" },
  error_code: { type: String, default: "" },
  error_message: { type: String, default: "" },
  retry_count: { type: Number, default: 0 },
  analytics_id: {
    type: import_mongoose17.Schema.Types.ObjectId,
    ref: "Analytics",
    default: null
  },
  created_at: { type: Date, default: Date.now }
});
PostSchema.index({ company_id: 1, status: 1 });
PostSchema.index({ published_at: -1 });
var Post = import_mongoose17.default.models.Post || import_mongoose17.default.model("Post", PostSchema);

// ../../packages/db/src/models/DatesCalendar.ts
var import_mongoose18 = __toESM(require("mongoose"));
var DatesCalendarSchema = new import_mongoose18.Schema({
  date: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  niches: [{ type: String }],
  suggested_post_type: { type: String, default: "" },
  suggested_headline: { type: String, default: "" },
  ai_prompt_hint: { type: String, default: "" },
  active: { type: Boolean, default: true }
});
var DatesCalendar = import_mongoose18.default.models.DatesCalendar || import_mongoose18.default.model("DatesCalendar", DatesCalendarSchema);

// ../../packages/db/src/models/Analytics.ts
var import_mongoose19 = __toESM(require("mongoose"));
var AnalyticsSchema = new import_mongoose19.Schema({
  company_id: { type: import_mongoose19.Schema.Types.ObjectId, ref: "Company", required: true },
  post_id: { type: import_mongoose19.Schema.Types.ObjectId, ref: "Post", required: true },
  platform: { type: String, required: true },
  platform_post_id: { type: String, default: "" },
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  story_replies: { type: Number, default: 0 },
  story_exits: { type: Number, default: 0 },
  fetched_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});
AnalyticsSchema.index({ company_id: 1 });
AnalyticsSchema.index({ post_id: 1 });
var Analytics = import_mongoose19.default.models.Analytics || import_mongoose19.default.model("Analytics", AnalyticsSchema);

// ../../packages/db/src/models/Notification.ts
var import_mongoose20 = __toESM(require("mongoose"));
var NotificationSchema = new import_mongoose20.Schema({
  target: { type: String, enum: ["company", "admin"], required: true },
  company_id: { type: import_mongoose20.Schema.Types.ObjectId, ref: "Company", default: null },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  read: { type: Boolean, default: false },
  action_url: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});
NotificationSchema.index({ target: 1, company_id: 1, read: 1 });
var Notification = import_mongoose20.default.models.Notification || import_mongoose20.default.model("Notification", NotificationSchema);

// ../../packages/db/src/models/AuditLog.ts
var import_mongoose21 = __toESM(require("mongoose"));
var AuditLogSchema = new import_mongoose21.Schema({
  admin_user_id: {
    type: import_mongoose21.Schema.Types.ObjectId,
    ref: "AdminUser",
    required: true
  },
  action: { type: String, required: true },
  target_type: { type: String, required: true },
  target_id: { type: String, required: true },
  details: { type: import_mongoose21.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: "" },
  created_at: { type: Date, default: Date.now }
});
var AuditLog = import_mongoose21.default.models.AuditLog || import_mongoose21.default.model("AuditLog", AuditLogSchema);

// ../../packages/shared/src/constants/index.ts
var PLAN_STARTER = {
  name: "Starter",
  slug: "starter" /* Starter */,
  setup_price: 297,
  monthly_price: 39.9,
  features: {
    instagram: true,
    facebook: false,
    cards_limit: -1,
    video_generation: false,
    videos_per_day: 0,
    scripts: false,
    whatsapp: false,
    campaigns: false,
    date_suggestions: false,
    analytics: false
  }
};
var PLAN_PRO = {
  name: "Pro",
  slug: "pro" /* Pro */,
  setup_price: 497,
  monthly_price: 69.9,
  features: {
    instagram: true,
    facebook: true,
    cards_limit: -1,
    video_generation: true,
    videos_per_day: 2,
    scripts: true,
    whatsapp: true,
    campaigns: true,
    date_suggestions: true,
    analytics: true
  }
};
var PLAN_ENTERPRISE = {
  name: "Enterprise",
  slug: "enterprise" /* Enterprise */,
  setup_price: 720,
  monthly_price: 89.9,
  features: {
    instagram: true,
    facebook: true,
    cards_limit: -1,
    video_generation: true,
    videos_per_day: 5,
    scripts: true,
    whatsapp: true,
    campaigns: true,
    date_suggestions: true,
    analytics: true
  }
};
var NICHE_OPTIONS = [
  { value: "farmacia" /* Farmacia */, label: "Farmacia" },
  { value: "pet" /* Pet */, label: "Pet Shop" },
  { value: "moda" /* Moda */, label: "Moda" },
  { value: "cosmeticos" /* Cosmeticos */, label: "Cosmeticos" },
  { value: "mercearia" /* Mercearia */, label: "Mercearia" },
  { value: "calcados" /* Calcados */, label: "Calcados" },
  { value: "outro" /* Outro */, label: "Outro" }
];
var POST_TYPE_OPTIONS = [
  { value: "promocao" /* Promocao */, label: "Promocao" },
  { value: "dica" /* Dica */, label: "Dica" },
  { value: "novidade" /* Novidade */, label: "Novidade" },
  { value: "institucional" /* Institucional */, label: "Institucional" },
  { value: "data_comemorativa" /* DataComemorativa */, label: "Data Comemorativa" }
];
var CARD_FORMAT_OPTIONS = [
  { value: "feed_1x1" /* Feed1x1 */, label: "Feed 1:1" },
  { value: "stories_9x16" /* Stories9x16 */, label: "Stories 9:16" },
  { value: "reels" /* Reels */, label: "Reels" },
  { value: "carousel" /* Carousel */, label: "Carousel" }
];

// src/plugins/auth.ts
async function authenticate(request, reply) {
  try {
    let token = request.cookies["soma-token"];
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }
    if (!token) {
      return reply.status(401).send({ error: "Token nao fornecido" });
    }
    const decoded = request.server.jwt.verify(token);
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: "Token invalido ou expirado" });
  }
}
async function adminOnly(request, reply) {
  if (!request.user || request.user.role !== "superadmin" && request.user.role !== "support") {
    return reply.status(403).send({ error: "Acesso restrito a administradores" });
  }
}

// src/routes/dashboard.ts
async function dashboardRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get("/summary", async (request, reply) => {
    const { companyId } = request.user;
    const now = /* @__PURE__ */ new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const query = {};
    if (companyId) query.company_id = companyId;
    const [postsThisMonth, approvedCards, scheduledToday, videosGenerated] = await Promise.all([
      Post.countDocuments({
        ...query,
        status: "published" /* Published */,
        published_at: { $gte: monthStart }
      }),
      Card.countDocuments({ ...query, status: "approved" /* Approved */ }),
      PostQueue.countDocuments({
        ...query,
        status: "queued" /* Queued */,
        scheduled_at: { $gte: todayStart, $lte: todayEnd }
      }),
      Video.countDocuments({ ...query })
    ]);
    const upcomingPosts = await PostQueue.find({
      ...query,
      status: "queued" /* Queued */,
      scheduled_at: { $gte: /* @__PURE__ */ new Date() }
    }).sort({ scheduled_at: 1 }).limit(5).populate("card_id", "headline generated_image_url").lean();
    const posts = upcomingPosts.map((p) => ({
      id: String(p._id),
      caption: p.caption || p.card_id?.headline || "",
      thumbnail: p.card_id?.generated_image_url || null,
      platforms: p.platforms || [],
      scheduledAt: p.scheduled_at,
      status: p.status
    }));
    return reply.send({
      metrics: { postsThisMonth, approvedCards, scheduledToday, videosGenerated },
      upcomingPosts: posts
    });
  });
}

// src/routes/auth.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
async function authRoutes(app2) {
  app2.post(
    "/login",
    async (request, reply) => {
      const { email, password } = request.body;
      if (!email || !password) {
        return reply.status(400).send({ error: "Email e senha sao obrigatorios" });
      }
      let foundUser = await AdminUser.findOne({ email, active: true }).lean();
      let isAdmin = false;
      if (foundUser) {
        isAdmin = true;
      } else {
        foundUser = await User.findOne({ email, active: true }).lean();
      }
      if (!foundUser) {
        return reply.status(401).send({ error: "Credenciais invalidas" });
      }
      const passwordValid = await import_bcryptjs.default.compare(password, foundUser.password_hash);
      if (!passwordValid) {
        return reply.status(401).send({ error: "Credenciais invalidas" });
      }
      const Model = isAdmin ? AdminUser : User;
      await Model.findByIdAndUpdate(foundUser._id, { last_login: /* @__PURE__ */ new Date() });
      const payload = {
        userId: String(foundUser._id),
        companyId: isAdmin ? null : String(foundUser.company_id),
        role: foundUser.role
      };
      const token = app2.jwt.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
      });
      let companyName = null;
      let planSlug = null;
      let niche = null;
      if (!isAdmin && foundUser.company_id) {
        const company = await Company.findById(foundUser.company_id).populate("plan_id").lean();
        if (company) {
          companyName = company.name;
          planSlug = company.plan_id?.slug || null;
          niche = company.niche || null;
        }
      }
      reply.setCookie("soma-token", token, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60
        // 7 days
      }).send({
        token,
        user: {
          id: String(foundUser._id),
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          companyId: isAdmin ? null : String(foundUser.company_id),
          companyName,
          plan: planSlug,
          niche
        }
      });
    }
  );
  app2.post(
    "/register",
    { preHandler: [authenticate, adminOnly] },
    async (request, reply) => {
      const { name, email, password, role, company_id } = request.body;
      if (!name || !email || !password || !role) {
        return reply.status(400).send({ error: "Campos obrigatorios: name, email, password, role" });
      }
      const existingUser = await User.findOne({ email }).lean();
      const existingAdmin = await AdminUser.findOne({ email }).lean();
      if (existingUser || existingAdmin) {
        return reply.status(409).send({ error: "Email ja cadastrado" });
      }
      const password_hash = await import_bcryptjs.default.hash(password, 12);
      if (role === "superadmin" || role === "support") {
        const admin = await AdminUser.create({
          name,
          email,
          password_hash,
          role
        });
        return reply.status(201).send({
          user: {
            id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        });
      }
      if (!company_id) {
        return reply.status(400).send({ error: "company_id e obrigatorio para usuarios nao-admin" });
      }
      const user = await User.create({
        name,
        email,
        password_hash,
        role,
        company_id
      });
      return reply.status(201).send({
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: String(user.company_id)
        }
      });
    }
  );
  app2.post("/logout", async (_request, reply) => {
    reply.clearCookie("soma-token", { path: "/" }).send({ message: "Logout realizado" });
  });
  app2.get(
    "/me",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { userId, role } = request.user;
      const isAdmin = role === "superadmin" || role === "support";
      const Model = isAdmin ? AdminUser : User;
      const user = await Model.findById(userId).select("-password_hash").lean();
      if (!user) {
        return reply.status(404).send({ error: "Usuario nao encontrado" });
      }
      return reply.send({ user: { ...user, _id: String(user._id) } });
    }
  );
}

// src/routes/companies.ts
async function companiesRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get("/", async (request, reply) => {
    const { role, companyId } = request.user;
    if (role === "superadmin" || role === "support") {
      const companies = await Company.find().populate("plan_id").sort({ createdAt: -1 }).lean();
      return reply.send({ companies });
    }
    if (!companyId) {
      return reply.status(400).send({ error: "Empresa nao encontrada para este usuario" });
    }
    const company = await Company.findById(companyId).populate("plan_id").lean();
    if (!company) {
      return reply.status(404).send({ error: "Empresa nao encontrada" });
    }
    return reply.send({ companies: [company] });
  });
  app2.get(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { role, companyId } = request.user;
      if (role !== "superadmin" && role !== "support" && companyId !== id) {
        return reply.status(403).send({ error: "Sem permissao para acessar esta empresa" });
      }
      const company = await Company.findById(id).populate("plan_id").lean();
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      return reply.send(company);
    }
  );
  app2.post(
    "/",
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { plan, setupPaid, billingDay, ...rest } = request.body;
      const planDoc = await Plan.findOne({ slug: plan });
      const company = await Company.create({
        ...rest,
        whatsapp: rest.whatsapp.replace(/\D/g, ""),
        plan_id: planDoc?._id ?? null,
        status: "setup_pending" /* SetupPending */,
        access_enabled: false,
        setup_paid: setupPaid ?? false,
        setup_amount: planDoc?.setup_price ?? 0,
        billing: {
          monthly_amount: planDoc?.monthly_price ?? 0,
          due_day: parseInt(billingDay ?? "10", 10),
          overdue_days: 0,
          status: "pending"
        }
      });
      await Integration.create({ company_id: company._id });
      await Schedule.create({
        company_id: company._id,
        active: false,
        weekly_slots: []
      });
      return reply.status(201).send(company);
    }
  );
  app2.put(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { role, companyId } = request.user;
      if (role !== "superadmin" && role !== "support" && companyId !== id) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      const company = await Company.findByIdAndUpdate(id, request.body, {
        new: true
      }).lean();
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      return reply.send(company);
    }
  );
  app2.post(
    "/:id/block",
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { id } = request.params;
      const company = await Company.findByIdAndUpdate(
        id,
        {
          access_enabled: false,
          status: "blocked" /* Blocked */
        },
        { new: true }
      ).lean();
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      return reply.send({ ...company, message: "Acesso bloqueado" });
    }
  );
  app2.post(
    "/:id/unblock",
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { id } = request.params;
      const company = await Company.findByIdAndUpdate(
        id,
        {
          access_enabled: true,
          status: "active" /* Active */
        },
        { new: true }
      ).lean();
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      return reply.send({ ...company, message: "Acesso desbloqueado" });
    }
  );
}

// src/services/encryption.service.ts
var import_node_crypto = __toESM(require("node:crypto"));
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
function getKey() {
  const raw = process.env.ENCRYPTION_KEY || "soma_ai_encryption_key_32chars!";
  return import_node_crypto.default.createHash("sha256").update(raw).digest();
}
var EncryptionService = class {
  static encrypt(plaintext) {
    const key = getKey();
    const iv = import_node_crypto.default.randomBytes(IV_LENGTH);
    const cipher = import_node_crypto.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }
  static decrypt(ciphertext) {
    const key = getKey();
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Formato de dados criptografados invalido");
    }
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const decipher = import_node_crypto.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
};

// src/routes/cards.ts
async function cardsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { format, status, page = "1", limit = "20" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (format) query.format = format;
      if (status) query.status = status;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [cards, total] = await Promise.all([
        Card.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Card.countDocuments(query)
      ]);
      return reply.send({
        cards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.get(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const card = await Card.findById(id).lean();
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      return reply.send(card);
    }
  );
  app2.post(
    "/generate",
    async (request, reply) => {
      const { companyId } = request.user;
      const body = request.body;
      if (!body.format || !body.post_type) {
        return reply.status(400).send({ error: "Campos obrigatorios: format, post_type" });
      }
      const card = await Card.create({
        company_id: companyId || null,
        template_id: body.template_id || null,
        format: body.format,
        post_type: body.post_type,
        headline: body.headline || "",
        subtext: body.subtext || "",
        cta: body.cta || "",
        product_name: body.product_name || "",
        price_original: body.price_original || 0,
        price_promo: body.price_promo || 0,
        caption: body.caption || "",
        hashtags: body.hashtags || [],
        campaign_id: body.campaign_id || null,
        status: "draft" /* Draft */,
        ai_prompt_used: `Generate ${body.post_type} card for ${body.product_name || "product"}`,
        generated_image_url: ""
        // Placeholder - AI generation would fill this
      });
      return reply.status(201).send(card);
    }
  );
  app2.patch(
    "/:id/approve",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const card = await Card.findById(id);
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      card.status = "approved" /* Approved */;
      card.approved_at = /* @__PURE__ */ new Date();
      const body = request.body;
      if (body?.generated_image_url) {
        card.generated_image_url = body.generated_image_url;
      }
      await card.save();
      return reply.send(card);
    }
  );
  app2.patch(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const card = await Card.findById(id).lean();
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      const { company_id, _id, ...updateData } = request.body;
      const updated = await Card.findByIdAndUpdate(id, updateData, {
        new: true
      }).lean();
      return reply.send(updated);
    }
  );
  app2.delete(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const card = await Card.findById(id);
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      await card.deleteOne();
      return reply.send({ message: "Card excluido", _id: id });
    }
  );
  app2.post(
    "/generate-caption/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const card = await Card.findById(id).lean();
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      const integration = await Integration.findOne({ company_id: companyId }).lean();
      const encryptedKey = integration?.gemini?.api_key;
      if (!encryptedKey || !integration?.gemini?.active) {
        return reply.status(400).send({
          error: "Configure sua chave Gemini em Configuracoes > Integracoes"
        });
      }
      let apiKey;
      try {
        apiKey = EncryptionService.decrypt(encryptedKey);
      } catch {
        return reply.status(500).send({ error: "Erro ao descriptografar chave Gemini" });
      }
      const prompt = `Voce e um social media manager profissional para pequenos negocios no Brasil.
Crie uma legenda engajante e hashtags para um post de Instagram.

Dados do card:
- Tipo: ${card.post_type || "feed"}
- Produto: ${card.product_name || "produto"}
- Titulo: ${card.headline || ""}
- Texto adicional: ${card.subtext || ""}
- CTA: ${card.cta || ""}
${card.price_promo ? `- Preco promocional: R$ ${card.price_promo}` : ""}
${card.price_original ? `- Preco original: R$ ${card.price_original}` : ""}

Responda EXATAMENTE neste formato JSON (sem markdown, sem code blocks):
{"caption": "legenda aqui com emojis", "hashtags": ["#tag1", "#tag2", "#tag3"]}`;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );
        if (!res.ok) {
          return reply.status(502).send({ error: "Erro ao chamar API Gemini" });
        }
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        try {
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return reply.send({
            caption: parsed.caption || "",
            hashtags: parsed.hashtags || []
          });
        } catch {
          return reply.send({ caption: raw.trim(), hashtags: [] });
        }
      } catch {
        return reply.status(502).send({ error: "Erro de conexao com API Gemini" });
      }
    }
  );
}

// src/queues/post.queue.ts
var import_bullmq = require("bullmq");

// src/plugins/redis.ts
var import_ioredis = __toESM(require("ioredis"));
var REDIS_URL = process.env.REDIS_URL || "redis://localhost:6380";
var redis = new import_ioredis.default(REDIS_URL, {
  maxRetriesPerRequest: null
});
redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});
redis.on("connect", () => {
  console.log("Redis conectado");
});
var redis_default = redis;

// src/queues/post.queue.ts
var postQueue = new import_bullmq.Queue("post-queue", {
  connection: redis_default,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5e3
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 }
  }
});
var post_queue_default = postQueue;

// src/routes/posts.ts
async function postsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { status, platform, page = "1", limit = "20" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (status) query.status = status;
      if (platform) query.platforms = platform;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [posts, total] = await Promise.all([
        Post.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum).populate("card_id").lean(),
        Post.countDocuments(query)
      ]);
      return reply.send({
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.post(
    "/:id/retry",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const post = await Post.findById(id).lean();
      if (!post) {
        return reply.status(404).send({ error: "Post nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(post.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      if (post.status !== "failed") {
        return reply.status(400).send({ error: "Apenas posts com falha podem ser reenviados" });
      }
      const card = await Card.findById(post.card_id).lean();
      const queueItem = await PostQueue.create({
        company_id: post.company_id,
        card_id: post.card_id,
        video_id: post.video_id,
        scheduled_at: /* @__PURE__ */ new Date(),
        platforms: post.platforms,
        post_type: post.post_type,
        caption: post.caption,
        hashtags: post.hashtags,
        status: "queued" /* Queued */
      });
      const job = await post_queue_default.add("publish", {
        queueId: String(queueItem._id),
        companyId: String(post.company_id),
        cardId: String(post.card_id),
        videoId: post.video_id ? String(post.video_id) : void 0,
        platforms: post.platforms,
        postType: post.post_type,
        caption: post.caption,
        hashtags: post.hashtags,
        imageUrl: card?.generated_image_url || ""
      });
      await PostQueue.findByIdAndUpdate(queueItem._id, {
        bullmq_job_id: job.id
      });
      return reply.send({
        message: "Post reenfileirado para publicacao",
        queueId: String(queueItem._id),
        jobId: job.id
      });
    }
  );
}

// src/routes/post-queue.ts
async function postQueueRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { month, status, page = "1", limit = "50" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (status) query.status = status;
      if (month) {
        const [year, m] = month.split("-").map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 0, 23, 59, 59, 999);
        query.scheduled_at = { $gte: startDate, $lte: endDate };
      }
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [items, total] = await Promise.all([
        PostQueue.find(query).sort({ scheduled_at: 1 }).skip(skip).limit(limitNum).populate("card_id").lean(),
        PostQueue.countDocuments(query)
      ]);
      return reply.send({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.post(
    "/",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      if (!body.card_id || !body.scheduled_at || !body.platforms?.length || !body.post_type) {
        return reply.status(400).send({
          error: "Campos obrigatorios: card_id, scheduled_at, platforms, post_type"
        });
      }
      const card = await Card.findById(body.card_id).lean();
      if (!card) {
        return reply.status(404).send({ error: "Card nao encontrado" });
      }
      if (String(card.company_id) !== companyId) {
        return reply.status(403).send({ error: "Card nao pertence a esta empresa" });
      }
      const scheduledAt = new Date(body.scheduled_at);
      const queueItem = await PostQueue.create({
        company_id: companyId,
        card_id: body.card_id,
        video_id: body.video_id || null,
        scheduled_at: scheduledAt,
        platforms: body.platforms,
        post_type: body.post_type,
        caption: body.caption || card.caption || "",
        hashtags: body.hashtags || card.hashtags || [],
        status: "queued" /* Queued */
      });
      const delay = Math.max(0, scheduledAt.getTime() - Date.now());
      const job = await post_queue_default.add(
        "publish",
        {
          queueId: String(queueItem._id),
          companyId,
          cardId: body.card_id,
          videoId: body.video_id,
          platforms: body.platforms,
          postType: body.post_type,
          caption: queueItem.caption,
          hashtags: queueItem.hashtags,
          imageUrl: card.generated_image_url || ""
        },
        { delay }
      );
      await PostQueue.findByIdAndUpdate(queueItem._id, {
        bullmq_job_id: job.id
      });
      await Card.findByIdAndUpdate(body.card_id, { status: "scheduled" });
      return reply.status(201).send({
        item: queueItem,
        jobId: job.id
      });
    }
  );
  app2.delete(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const queueItem = await PostQueue.findById(id);
      if (!queueItem) {
        return reply.status(404).send({ error: "Item nao encontrado na fila" });
      }
      if (role !== "superadmin" && role !== "support" && String(queueItem.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      if (queueItem.status === "done" || queueItem.status === "processing") {
        return reply.status(400).send({ error: "Nao e possivel cancelar um item ja processado ou em processamento" });
      }
      if (queueItem.bullmq_job_id) {
        try {
          const job = await post_queue_default.getJob(queueItem.bullmq_job_id);
          if (job) await job.remove();
        } catch {
        }
      }
      queueItem.status = "cancelled" /* Cancelled */;
      await queueItem.save();
      await Card.findByIdAndUpdate(queueItem.card_id, { status: "approved" });
      return reply.send({ message: "Agendamento cancelado", item: queueItem });
    }
  );
}

// src/services/gemini-video.service.ts
var GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
async function callGemini(apiKey, prompt, options) {
  const res = await fetch(
    `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxOutputTokens ?? 2048
        }
      })
    }
  );
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errBody = await res.text();
      const parsed = JSON.parse(errBody);
      errorDetail = parsed?.error?.message || parsed?.error?.status || errBody.slice(0, 200);
    } catch {
      errorDetail = `HTTP ${res.status}`;
    }
    throw new Error(`Erro na API Gemini: ${errorDetail}`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === "SAFETY") {
      throw new Error("A IA bloqueou a resposta por questoes de seguranca. Tente reformular.");
    }
    if (data?.candidates?.length === 0 || !data?.candidates) {
      throw new Error("A IA nao retornou nenhuma resposta. Tente novamente.");
    }
    throw new Error("Resposta vazia da IA. Tente novamente.");
  }
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
      }
    }
    throw new Error(
      "A IA retornou um formato inesperado. Tente novamente."
    );
  }
}
var GeminiVideoService = class {
  /**
   * Get the best available Gemini API key:
   * 1. Company BYOK key (from integrations)
   * 2. Master key (from env)
   */
  static async getApiKey(companyId) {
    try {
      const integration = await Integration.findOne({
        company_id: companyId
      }).lean();
      if (integration?.gemini?.api_key && integration?.gemini?.active) {
        try {
          return EncryptionService.decrypt(integration.gemini.api_key);
        } catch {
          console.warn("[gemini] BYOK key decryption failed, using master key");
        }
      }
    } catch {
      console.warn("[gemini] Integration query failed, using master key");
    }
    const masterKey = process.env.GEMINI_API_KEY;
    if (!masterKey) {
      throw new Error(
        "Nenhuma chave Gemini configurada. Adicione GEMINI_API_KEY no .env ou configure em Integracoes."
      );
    }
    return masterKey;
  }
  /**
   * Generate a video script/storyboard using Gemini
   */
  static async generateScript(params) {
    const templateDescriptions = {
      dica_rapida: "Video curto com 1 slide principal, narracao direta e CTA. Ideal para dicas rapidas.",
      passo_a_passo: "Video com 3 slides sequenciais mostrando etapas. Cada slide tem titulo e descricao.",
      beneficio_destaque: "Video focado em destacar um beneficio ou estatistica impactante com texto grande.",
      depoimento: "Video com texto de depoimento/avaliacao de cliente, aspas e CTA de confianca.",
      comparativo: "Video com 2 slides: antes/depois ou com/sem, mostrando diferenca clara.",
      lancamento: "Video com 3-4 slides: teaser, reveal do produto e CTA. Gera expectativa."
    };
    const prompt = `Voce e um diretor criativo de videos curtos para redes sociais (Reels/TikTok/Shorts).
Crie um roteiro para um video de ${params.targetDuration} segundos.

CONTEXTO:
- Empresa: ${params.companyName} (${params.niche})
- Template: ${params.template} \u2014 ${templateDescriptions[params.template] || "Video criativo"}
- Produto/Tema: ${params.productName || params.headline || "conteudo geral"}
- Titulo do card: ${params.headline || "nao definido"}
- Texto complementar: ${params.subtext || "nenhum"}

REGRAS:
- Portugues brasileiro coloquial e envolvente
- Texto de narracao com no maximo 150 caracteres
- Cada slide deve ter titulo curto (max 30 chars) e texto (max 60 chars)
- Incluir transicoes entre slides (fade, slide, zoom, bounce)
- Distribuir duracao dos slides proporcionalmente
- Sugerir trilha sonora (upbeat, calma, motivacional, corporativa)

Responda SOMENTE com JSON valido (sem markdown):
{
  "narration": "texto completo da narracao",
  "slides": [
    {
      "order": 1,
      "title": "titulo do slide",
      "text": "texto do slide",
      "duration_ms": 5000,
      "transition": "fade"
    }
  ],
  "subtitles": [
    { "text": "trecho da legenda", "start_ms": 0, "end_ms": 3000 }
  ],
  "suggested_music": "upbeat"
}`;
    return callGemini(params.apiKey, prompt);
  }
  /**
   * Generate narration text using Gemini
   */
  static async generateNarration(params) {
    const prompt = `Voce e um copywriter de videos curtos para redes sociais.
Crie um texto de narracao para um video de ${params.targetDuration} segundos.

CONTEXTO:
- Nicho: ${params.niche}
- Template: ${params.template}
- Titulo: ${params.headline}
- Texto base: ${params.subtext || "nenhum"}

REGRAS:
- Maximo 150 caracteres
- Tom envolvente e direto
- Inclua CTA no final
- Portugues brasileiro

Responda SOMENTE com JSON (sem markdown):
{"narration": "texto da narracao aqui", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]}`;
    return callGemini(
      params.apiKey,
      prompt
    );
  }
  /**
   * Generate synchronized subtitles from narration text
   */
  static generateSubtitles(narrationText, totalDurationMs) {
    if (!narrationText) return [];
    const phrases = narrationText.split(/[.!?,;]+/).map((p) => p.trim()).filter((p) => p.length > 0);
    if (phrases.length === 0) return [];
    const totalChars = phrases.reduce((sum, p) => sum + p.length, 0);
    let currentMs = 0;
    const subtitles = [];
    for (const phrase of phrases) {
      const proportion = phrase.length / totalChars;
      const durationMs = Math.round(proportion * totalDurationMs);
      subtitles.push({
        text: phrase,
        start_ms: currentMs,
        end_ms: currentMs + durationMs
      });
      currentMs += durationMs;
    }
    return subtitles;
  }
  /**
   * Generate video using Gemini Veo model
   */
  static async generateVideoWithVeo(params) {
    const veoPrompt = `Create a ${params.durationSeconds}-second promotional video: ${params.prompt}.
Style: modern, clean, professional. Colors: vibrant. Motion: smooth transitions.
Format: vertical ${params.aspectRatio}. No text overlays needed.`;
    const res = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${params.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: veoPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024
          }
        })
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini Veo error: ${res.status} \u2014 ${errBody.slice(0, 200)}`);
    }
    return {
      videoUrl: "",
      thumbnailUrl: "",
      durationSeconds: params.durationSeconds,
      model: "gemini-2.0-flash"
    };
  }
  /**
   * Generate ad copy for campaigns
   */
  static async generateAdCopy(params) {
    const prompt = `Voce e um especialista em anuncios para Facebook/Instagram Ads.
Gere copy para um anuncio de "${params.campaignType}".

CONTEXTO:
- Empresa: ${params.companyName} (${params.niche})
- Card base: "${params.cardHeadline}" \u2014 "${params.cardSubtext}"
- Link destino: ${params.destinationUrl}

REGRAS:
- Portugues brasileiro, tom acessivel
- Inclua emojis estrategicos
- CTA claro e direto

Responda SOMENTE com JSON (sem markdown):
{
  "primary_text": "Texto principal (max 125 chars)",
  "headline": "Titulo do anuncio (max 40 chars)",
  "description": "Descricao (max 30 chars)"
}`;
    return callGemini(params.apiKey, prompt);
  }
  /**
   * Suggest interests for ad targeting based on niche
   */
  static async suggestInterests(params) {
    const prompt = `Voce e especialista em marketing digital e segmentacao de anuncios.
Sugira 12 interesses/segmentacoes para anuncios no Facebook/Instagram Ads.

CONTEXTO:
- Nicho: ${params.niche}
- Objetivo: ${params.campaignType}

Responda SOMENTE com JSON array (sem markdown):
[{"name": "nome do interesse", "category": "categoria"}]

Exemplos de categorias: "comportamento", "interesse", "demografico", "compras"
Seja especifico para o nicho ${params.niche}.`;
    return callGemini(
      params.apiKey,
      prompt
    );
  }
};

// src/services/meta-ads.service.ts
var META_GRAPH_URL = "https://graph.facebook.com/v21.0";
var OBJECTIVE_MAP = {
  awareness: "OUTCOME_AWARENESS",
  traffic: "OUTCOME_TRAFFIC",
  engagement: "OUTCOME_ENGAGEMENT",
  leads: "OUTCOME_LEADS",
  sales: "OUTCOME_SALES",
  messages: "OUTCOME_ENGAGEMENT",
  local_store: "OUTCOME_AWARENESS"
};
var MetaAdsService = class {
  /**
   * Get Meta Ads access token for a company
   */
  static async getToken(companyId) {
    const integration = await Integration.findOne({
      company_id: companyId
    }).lean();
    if (!integration?.meta_ads?.ad_account_id || !integration?.meta?.access_token) {
      return null;
    }
    try {
      const token = EncryptionService.decrypt(integration.meta.access_token);
      return {
        token,
        adAccountId: integration.meta_ads.ad_account_id,
        pageId: integration.meta.facebook_page_id || ""
      };
    } catch {
      return null;
    }
  }
  /**
   * List ad accounts for a user token
   */
  static async listAdAccounts(accessToken) {
    const res = await fetch(
      `${META_GRAPH_URL}/me/adaccounts?fields=id,name,currency,account_status&access_token=${accessToken}`
    );
    if (!res.ok) {
      throw new Error(`Meta API error: ${res.status}`);
    }
    const data = await res.json();
    return data.data || [];
  }
  /**
   * Create a full campaign (campaign + adset + ad)
   */
  static async createCampaign(params) {
    const metaObjective = OBJECTIVE_MAP[params.objective] || "OUTCOME_TRAFFIC";
    const campaignRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/campaigns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Soma.ai \u2014 ${params.name}`,
          objective: metaObjective,
          status: "PAUSED",
          special_ad_categories: [],
          access_token: params.accessToken
        })
      }
    );
    if (!campaignRes.ok) {
      const err = await campaignRes.text();
      throw new Error(`Erro ao criar campanha Meta: ${err}`);
    }
    const campaign = await campaignRes.json();
    const campaignId = campaign.id;
    const targetingSpec = {
      age_min: params.targeting.age_min,
      age_max: params.targeting.age_max
    };
    if (params.targeting.genders?.length && !params.targeting.genders.includes("all")) {
      targetingSpec.genders = params.targeting.genders.map(
        (g) => g === "male" ? 1 : 2
      );
    }
    if (params.targeting.locations?.length) {
      targetingSpec.geo_locations = {
        cities: params.targeting.locations.map((loc) => ({
          key: loc.city,
          radius: loc.radius_km,
          distance_unit: "kilometer"
        }))
      };
    }
    if (params.targeting.interests?.length) {
      targetingSpec.interests = params.targeting.interests.map((i) => ({
        id: i.id,
        name: i.name
      }));
    }
    const adsetRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/adsets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: `Conjunto \u2014 ${params.name}`,
          billing_event: "IMPRESSIONS",
          optimization_goal: "LINK_CLICKS",
          daily_budget: Math.round(params.dailyBudget * 100),
          // Centavos
          start_time: params.startDate,
          end_time: params.endDate,
          targeting: targetingSpec,
          status: "PAUSED",
          access_token: params.accessToken
        })
      }
    );
    if (!adsetRes.ok) {
      const err = await adsetRes.text();
      throw new Error(`Erro ao criar conjunto de anuncios: ${err}`);
    }
    const adset = await adsetRes.json();
    const adsetId = adset.id;
    const creativeBody = {
      name: `Criativo \u2014 ${params.headline}`,
      object_story_spec: {
        page_id: params.pageId,
        link_data: {
          link: params.destinationUrl,
          message: params.adCopy,
          name: params.headline,
          call_to_action: {
            type: params.ctaType,
            value: { link: params.destinationUrl }
          }
        }
      },
      access_token: params.accessToken
    };
    if (params.imageUrl) {
      creativeBody.object_story_spec.link_data.image_url = params.imageUrl;
    }
    const creativeRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/adcreatives`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeBody)
      }
    );
    if (!creativeRes.ok) {
      const err = await creativeRes.text();
      throw new Error(`Erro ao criar criativo: ${err}`);
    }
    const creative = await creativeRes.json();
    const adRes = await fetch(
      `${META_GRAPH_URL}/act_${params.adAccountId}/ads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adset_id: adsetId,
          creative: { creative_id: creative.id },
          name: `Anuncio \u2014 ${params.name}`,
          status: "PAUSED",
          access_token: params.accessToken
        })
      }
    );
    if (!adRes.ok) {
      const err = await adRes.text();
      throw new Error(`Erro ao criar anuncio: ${err}`);
    }
    const ad = await adRes.json();
    return {
      campaign_id: campaignId,
      adset_id: adsetId,
      ad_id: ad.id
    };
  }
  /**
   * Update campaign status (ACTIVE / PAUSED)
   */
  static async updateCampaignStatus(campaignId, status, accessToken) {
    await fetch(`${META_GRAPH_URL}/${campaignId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, access_token: accessToken })
    });
  }
  /**
   * Fetch campaign metrics/insights
   */
  static async fetchMetrics(campaignId, accessToken) {
    const res = await fetch(
      `${META_GRAPH_URL}/${campaignId}/insights?fields=impressions,reach,clicks,ctr,cpc,cpm,conversions,spend&access_token=${accessToken}`
    );
    if (!res.ok) {
      return {
        impressions: 0,
        reach: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        conversions: 0,
        spend: 0
      };
    }
    const data = await res.json();
    const insight = data.data?.[0] || {};
    return {
      impressions: parseInt(insight.impressions || "0"),
      reach: parseInt(insight.reach || "0"),
      clicks: parseInt(insight.clicks || "0"),
      ctr: parseFloat(insight.ctr || "0"),
      cpc: parseFloat(insight.cpc || "0"),
      cpm: parseFloat(insight.cpm || "0"),
      conversions: parseInt(insight.conversions || "0"),
      spend: parseFloat(insight.spend || "0")
    };
  }
  /**
   * Estimate reach for a given targeting + budget
   */
  static async estimateReach(params) {
    const targetingSpec = {
      age_min: params.targeting.age_min,
      age_max: params.targeting.age_max
    };
    if (params.targeting.interests?.length) {
      targetingSpec.interests = params.targeting.interests;
    }
    const avgCpm = 10;
    const dailyImpressions = params.dailyBudget / avgCpm * 1e3;
    const dailyReach = dailyImpressions * 0.6;
    return {
      daily_reach_min: Math.round(dailyReach * 0.7),
      daily_reach_max: Math.round(dailyReach * 1.3)
    };
  }
  /**
   * Search interests for targeting
   */
  static async searchInterests(query, accessToken) {
    const res = await fetch(
      `${META_GRAPH_URL}/search?type=adinterest&q=${encodeURIComponent(query)}&access_token=${accessToken}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item) => ({
      id: item.id,
      name: item.name,
      audience_size: item.audience_size || 0
    }));
  }
};

// src/routes/campaigns.ts
async function campaignsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { status, type, page = "1", limit = "20" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (status) query.status = status;
      if (type) query.type = type;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [campaigns, total] = await Promise.all([
        Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Campaign.countDocuments(query)
      ]);
      return reply.send({
        campaigns,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.get(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const campaign = await Campaign.findById(id).populate("card_ids", "headline subtext generated_image_url format status").populate("video_ids", "title thumbnail_url video_url status template").populate("script_ids").lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (role !== "superadmin" && role !== "support" && String(campaign.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      return reply.send({ campaign });
    }
  );
  app2.post(
    "/",
    async (request, reply) => {
      const { companyId, userId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      if (!body.name) {
        return reply.status(400).send({ error: "Nome da campanha e obrigatorio" });
      }
      let durationDays = body.duration_days || 7;
      let startDate = body.start_date ? new Date(body.start_date) : null;
      let endDate = body.end_date ? new Date(body.end_date) : null;
      if (startDate && endDate) {
        durationDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)
        );
      } else if (startDate && durationDays) {
        endDate = new Date(
          startDate.getTime() + durationDays * 24 * 60 * 60 * 1e3
        );
      }
      const dailyAmount = body.budget?.daily_amount || 0;
      const totalAmount = dailyAmount * durationDays;
      let estimates = {
        daily_reach_min: 0,
        daily_reach_max: 0,
        total_reach_min: 0,
        total_reach_max: 0
      };
      if (dailyAmount > 0) {
        const avgCpm = 10;
        const dailyImpressions = dailyAmount / avgCpm * 1e3;
        const dailyReach = dailyImpressions * 0.6;
        estimates = {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * durationDays),
          total_reach_max: Math.round(dailyReach * 1.3 * durationDays)
        };
      }
      const campaign = await Campaign.create({
        company_id: companyId,
        name: body.name,
        description: body.description || "",
        type: body.type || "traffic",
        status: "draft",
        card_ids: body.card_ids || [],
        video_ids: body.video_ids || [],
        script_ids: [],
        post_ids: [],
        ad_copy: body.ad_copy || "",
        cta_type: body.cta_type || "LEARN_MORE",
        destination_url: body.destination_url || "",
        targeting: {
          locations: body.targeting?.locations || [],
          age_min: body.targeting?.age_min || 18,
          age_max: body.targeting?.age_max || 65,
          genders: body.targeting?.genders || ["all"],
          interests: body.targeting?.interests || [],
          custom_audience_id: ""
        },
        budget: {
          daily_amount: dailyAmount,
          total_amount: totalAmount,
          currency: "BRL"
        },
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        platforms: {
          meta_ads: {
            enabled: body.platforms?.meta_ads?.enabled || false,
            placements: body.platforms?.meta_ads?.placements || [],
            campaign_id: "",
            adset_id: "",
            ad_ids: [],
            status: ""
          },
          google_ads: {
            enabled: body.platforms?.google_ads?.enabled || false,
            campaign_types: body.platforms?.google_ads?.campaign_types || [],
            campaign_id: "",
            ad_group_id: "",
            ad_ids: [],
            keywords: body.platforms?.google_ads?.keywords || [],
            status: ""
          }
        },
        estimates,
        created_by: userId || null
      });
      return reply.status(201).send({ campaign });
    }
  );
  app2.put(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const existing = await Campaign.findById(id).lean();
      if (!existing) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (role !== "superadmin" && role !== "support" && String(existing.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      if (!["draft", "paused"].includes(existing.status)) {
        return reply.status(400).send({
          error: "Apenas campanhas em rascunho ou pausadas podem ser editadas"
        });
      }
      const { company_id, _id, ...updateData } = request.body;
      if (updateData.budget?.daily_amount) {
        const days = updateData.duration_days || existing.duration_days || 7;
        updateData.budget.total_amount = updateData.budget.daily_amount * days;
        const avgCpm = 10;
        const dailyImpressions = updateData.budget.daily_amount / avgCpm * 1e3;
        const dailyReach = dailyImpressions * 0.6;
        updateData.estimates = {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * days),
          total_reach_max: Math.round(dailyReach * 1.3 * days)
        };
      }
      const campaign = await Campaign.findByIdAndUpdate(id, updateData, {
        new: true
      }).lean();
      return reply.send({ campaign });
    }
  );
  app2.post(
    "/:id/publish",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (campaign.status !== "draft" && campaign.status !== "review") {
        return reply.status(400).send({
          error: "Apenas campanhas em rascunho podem ser publicadas"
        });
      }
      if (!campaign.card_ids?.length && !campaign.video_ids?.length) {
        return reply.status(400).send({
          error: "Selecione pelo menos um card ou video para a campanha"
        });
      }
      if (!campaign.budget?.daily_amount || campaign.budget.daily_amount < 6) {
        return reply.status(400).send({
          error: "Orcamento diario minimo e R$ 6,00"
        });
      }
      let metaResult = null;
      if (campaign.platforms?.meta_ads?.enabled) {
        try {
          const meta = await MetaAdsService.getToken(companyId);
          if (meta) {
            let imageUrl = "";
            if (campaign.card_ids?.length) {
              const card = await Card.findById(campaign.card_ids[0]).lean();
              imageUrl = card?.generated_image_url || "";
            }
            metaResult = await MetaAdsService.createCampaign({
              accessToken: meta.token,
              adAccountId: meta.adAccountId,
              pageId: meta.pageId,
              name: campaign.name,
              objective: campaign.type,
              targeting: campaign.targeting,
              dailyBudget: campaign.budget.daily_amount,
              startDate: campaign.start_date?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
              endDate: campaign.end_date?.toISOString() || new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1e3
              ).toISOString(),
              imageUrl,
              adCopy: campaign.ad_copy,
              headline: campaign.name,
              ctaType: campaign.cta_type,
              destinationUrl: campaign.destination_url
            });
          }
        } catch (err) {
          console.error("Meta Ads publish error:", err.message);
        }
      }
      const updateData = {
        status: "active",
        published_at: /* @__PURE__ */ new Date()
      };
      if (metaResult) {
        updateData["platforms.meta_ads.campaign_id"] = metaResult.campaign_id;
        updateData["platforms.meta_ads.adset_id"] = metaResult.adset_id;
        updateData["platforms.meta_ads.ad_ids"] = [metaResult.ad_id];
        updateData["platforms.meta_ads.status"] = "ACTIVE";
      }
      const updated = await Campaign.findByIdAndUpdate(id, updateData, {
        new: true
      }).lean();
      return reply.send({
        campaign: updated,
        meta_ads: metaResult ? { status: "published", ...metaResult } : { status: "skipped" }
      });
    }
  );
  app2.post(
    "/:id/pause",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (campaign.status !== "active") {
        return reply.status(400).send({ error: "Campanha nao esta ativa" });
      }
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId);
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              "PAUSED",
              meta.token
            );
          }
        } catch {
        }
      }
      const updated = await Campaign.findByIdAndUpdate(
        id,
        { status: "paused", "platforms.meta_ads.status": "PAUSED" },
        { new: true }
      ).lean();
      return reply.send({ campaign: updated });
    }
  );
  app2.post(
    "/:id/resume",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (campaign.status !== "paused") {
        return reply.status(400).send({ error: "Campanha nao esta pausada" });
      }
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId);
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              "ACTIVE",
              meta.token
            );
          }
        } catch {
        }
      }
      const updated = await Campaign.findByIdAndUpdate(
        id,
        { status: "active", "platforms.meta_ads.status": "ACTIVE" },
        { new: true }
      ).lean();
      return reply.send({ campaign: updated });
    }
  );
  app2.post(
    "/:id/complete",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId);
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              "PAUSED",
              meta.token
            );
          }
        } catch {
        }
      }
      const updated = await Campaign.findByIdAndUpdate(
        id,
        {
          status: "completed",
          completed_at: /* @__PURE__ */ new Date(),
          "platforms.meta_ads.status": "PAUSED"
        },
        { new: true }
      ).lean();
      return reply.send({ campaign: updated });
    }
  );
  app2.get(
    "/:id/metrics",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(companyId);
          if (meta) {
            const metrics = await MetaAdsService.fetchMetrics(
              campaign.platforms.meta_ads.campaign_id,
              meta.token
            );
            await Campaign.findByIdAndUpdate(id, {
              "metrics.impressions": metrics.impressions,
              "metrics.reach": metrics.reach,
              "metrics.clicks": metrics.clicks,
              "metrics.ctr": metrics.ctr,
              "metrics.cpc": metrics.cpc,
              "metrics.cpm": metrics.cpm,
              "metrics.conversions": metrics.conversions,
              "metrics.total_spent": metrics.spend,
              "metrics.last_synced_at": /* @__PURE__ */ new Date()
            });
            return reply.send({ metrics, source: "live" });
          }
        } catch {
        }
      }
      return reply.send({
        metrics: campaign.metrics,
        source: "cached"
      });
    }
  );
  app2.post(
    "/estimate-reach",
    async (request, reply) => {
      const { daily_amount, duration_days, targeting } = request.body;
      if (!daily_amount || daily_amount < 1) {
        return reply.status(400).send({ error: "Orcamento diario invalido" });
      }
      const avgCpm = 10;
      const dailyImpressions = daily_amount / avgCpm * 1e3;
      const dailyReach = dailyImpressions * 0.6;
      const days = duration_days || 7;
      return reply.send({
        estimates: {
          daily_reach_min: Math.round(dailyReach * 0.7),
          daily_reach_max: Math.round(dailyReach * 1.3),
          total_reach_min: Math.round(dailyReach * 0.7 * days),
          total_reach_max: Math.round(dailyReach * 1.3 * days),
          daily_impressions: Math.round(dailyImpressions),
          total_impressions: Math.round(dailyImpressions * days),
          estimated_cpc: Math.round(daily_amount / (dailyImpressions * 0.025) * 100) / 100
        },
        budget: {
          daily: daily_amount,
          total: daily_amount * days,
          currency: "BRL"
        }
      });
    }
  );
  app2.post(
    "/suggest-interests",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const company = await Company.findById(companyId).lean();
      const campaignType = request.body.campaign_type || "traffic";
      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId);
        const interests = await GeminiVideoService.suggestInterests({
          niche: company?.niche || "outro",
          campaignType,
          apiKey
        });
        return reply.send({ interests });
      } catch (err) {
        return reply.status(502).send({ error: err.message || "Erro ao sugerir interesses" });
      }
    }
  );
  app2.post(
    "/generate-copy",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const company = await Company.findById(companyId).lean();
      const body = request.body;
      let headline = "";
      let subtext = "";
      if (body.card_id) {
        const card = await Card.findById(body.card_id).lean();
        if (card) {
          headline = card.headline;
          subtext = card.subtext;
        }
      }
      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId);
        const copy = await GeminiVideoService.generateAdCopy({
          cardHeadline: headline,
          cardSubtext: subtext,
          companyName: company?.name || "Empresa",
          niche: company?.niche || "outro",
          campaignType: body.campaign_type || "traffic",
          destinationUrl: body.destination_url || "",
          apiKey
        });
        return reply.send(copy);
      } catch (err) {
        return reply.status(502).send({ error: err.message || "Erro ao gerar copy" });
      }
    }
  );
  app2.delete(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) {
        return reply.status(404).send({ error: "Campanha nao encontrada" });
      }
      if (role !== "superadmin" && role !== "support" && String(campaign.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      if (campaign.status === "active") {
        return reply.status(400).send({
          error: "Encerre a campanha antes de deletar"
        });
      }
      await Campaign.findByIdAndDelete(id);
      return reply.send({ message: "Campanha removida" });
    }
  );
}

// src/routes/schedules.ts
async function schedulesRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get("/", async (request, reply) => {
    const { companyId, role } = request.user;
    if (role !== "superadmin" && role !== "support" && !companyId) {
      return reply.status(400).send({ error: "Empresa nao encontrada" });
    }
    const query = {};
    if (role !== "superadmin" && role !== "support") {
      query.company_id = companyId;
    }
    const schedule = await Schedule.findOne(query).lean();
    if (!schedule) {
      return reply.status(404).send({ error: "Agendamento nao encontrado" });
    }
    return reply.send({ schedule });
  });
  app2.put(
    "/",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      const schedule = await Schedule.findOneAndUpdate(
        { company_id: companyId },
        {
          ...body,
          updated_at: /* @__PURE__ */ new Date()
        },
        { new: true, upsert: true }
      ).lean();
      return reply.send({ schedule });
    }
  );
}

// src/services/tts.service.ts
var GEMINI_BASE_URL2 = "https://generativelanguage.googleapis.com/v1beta";
var TTSService = class {
  /**
   * Generate speech audio from text using Gemini's TTS capabilities
   * Falls back to a simple estimation if TTS is not available
   */
  static async generateSpeech(params) {
    const voiceMap = {
      feminino: "Puck",
      masculino: "Charon",
      neutro: "Kore"
    };
    try {
      const res = await fetch(
        `${GEMINI_BASE_URL2}/models/gemini-2.0-flash:generateContent?key=${params.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Leia o seguinte texto em portugues brasileiro, com voz ${params.voice}, velocidade ${params.speed}x: "${params.text}"`
                  }
                ]
              }
            ],
            generationConfig: {
              response_modalities: ["TEXT"],
              maxOutputTokens: 512
            }
          })
        }
      );
      if (!res.ok) {
        throw new Error(`TTS request failed: ${res.status}`);
      }
      const wordCount = params.text.split(/\s+/).length;
      const baseDurationMs = wordCount / 2.5 * 1e3;
      const adjustedDurationMs = Math.round(baseDurationMs / params.speed);
      return {
        audioBase64: "",
        // Audio would come from actual TTS service
        durationMs: adjustedDurationMs
      };
    } catch {
      const wordCount = params.text.split(/\s+/).length;
      const baseDurationMs = wordCount / 2.5 * 1e3;
      const adjustedDurationMs = Math.round(baseDurationMs / params.speed);
      return {
        audioBase64: "",
        durationMs: adjustedDurationMs
      };
    }
  }
  /**
   * Estimate narration duration without generating audio
   */
  static estimateDuration(text, speed = 1) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const baseDurationMs = wordCount / 2.5 * 1e3;
    return Math.round(baseDurationMs / speed);
  }
};

// src/queues/video.queue.ts
var import_bullmq2 = require("bullmq");
var videoQueue = new import_bullmq2.Queue("video-queue", {
  connection: redis_default,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1e4
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 }
  }
});
var video_queue_default = videoQueue;

// src/routes/videos.ts
async function videosRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { status, template, page = "1", limit = "20" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (status) query.status = status;
      if (template) query.template = template;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [videos, total] = await Promise.all([
        Video.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate("source_card_id", "headline subtext generated_image_url").lean(),
        Video.countDocuments(query)
      ]);
      return reply.send({
        videos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.get(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const video = await Video.findById(id).populate("source_card_id").populate("slides.card_id", "headline subtext generated_image_url").lean();
      if (!video) {
        return reply.status(404).send({ error: "Video nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(video.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      return reply.send({ video });
    }
  );
  app2.get(
    "/:id/status",
    async (request, reply) => {
      const { id } = request.params;
      const video = await Video.findById(id).select("status generation_progress error_message video_url thumbnail_url").lean();
      if (!video) {
        return reply.status(404).send({ error: "Video nao encontrado" });
      }
      return reply.send({
        status: video.status,
        progress: video.generation_progress,
        error: video.error_message,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url
      });
    }
  );
  app2.post(
    "/generate",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      if (!body.title || !body.type) {
        return reply.status(400).send({ error: "Campos obrigatorios: title, type" });
      }
      if (body.use_gemini_veo) {
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Video.countDocuments({
          company_id: companyId,
          use_gemini_veo: true,
          createdAt: { $gte: today }
        });
        if (todayCount >= 2) {
          return reply.status(429).send({
            error: "Limite de 2 videos com IA por dia atingido",
            limit: 2,
            used: todayCount
          });
        }
      }
      const slides = (body.slides || []).map((s, i) => ({
        order: i + 1,
        type: s.type || "text",
        card_id: s.card_id || null,
        title: s.title || "",
        text: s.text || "",
        image_url: s.image_url || "",
        duration_ms: Math.round(
          (body.target_duration || 15) * 1e3 / Math.max(1, body.slides?.length || 1)
        )
      }));
      const video = await Video.create({
        company_id: companyId,
        title: body.title,
        type: body.type,
        template: body.template || "dica_rapida",
        target_duration: body.target_duration || 15,
        aspect_ratio: body.aspect_ratio || "9:16",
        source_card_id: body.source_card_id || null,
        slides,
        narration_text: body.narration_text || "",
        voice_type: body.voice_type || "feminino",
        voice_speed: body.voice_speed || 1,
        palette: body.palette || "juntix_verde",
        background_music: body.background_music || "nenhuma",
        site_link: body.site_link || "",
        subtitle_mode: body.subtitle_mode || "auto",
        subtitle_text: body.subtitle_text || "",
        product_name: body.product_name || "",
        product_images: body.product_images || [],
        price_original: body.price_original || 0,
        price_promo: body.price_promo || 0,
        extra_text: body.extra_text || "",
        use_gemini_veo: body.use_gemini_veo || false,
        status: "queued" /* Queued */
      });
      const job = await video_queue_default.add("generate", {
        videoId: String(video._id),
        companyId
      });
      return reply.status(201).send({
        video,
        jobId: job.id,
        message: "Video enfileirado para geracao"
      });
    }
  );
  app2.post(
    "/generate-narration",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const { headline, subtext, template, target_duration } = request.body;
      if (!headline) {
        return reply.status(400).send({ error: "headline e obrigatorio" });
      }
      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId);
        const company = await Company.findById(companyId).lean();
        const result = await GeminiVideoService.generateNarration({
          headline,
          subtext: subtext || "",
          niche: company?.niche || "outro",
          template: template || "dica_rapida",
          targetDuration: target_duration || 15,
          apiKey
        });
        return reply.send(result);
      } catch (err) {
        return reply.status(502).send({ error: err.message || "Erro ao gerar narracao" });
      }
    }
  );
  app2.post(
    "/generate-subtitles",
    async (request, reply) => {
      const { narration_text, duration_ms } = request.body;
      if (!narration_text) {
        return reply.status(400).send({ error: "narration_text e obrigatorio" });
      }
      const subtitles = GeminiVideoService.generateSubtitles(
        narration_text,
        duration_ms || 15e3
      );
      return reply.send({ subtitles });
    }
  );
  app2.post(
    "/generate-script",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      const company = await Company.findById(companyId).lean();
      let headline = body.headline || "";
      let subtext = body.subtext || "";
      let productName = body.product_name || "";
      if (body.source_card_id) {
        const card = await Card.findById(body.source_card_id).lean();
        if (card) {
          headline = headline || card.headline;
          subtext = subtext || card.subtext;
          productName = productName || card.product_name;
        }
      }
      try {
        const apiKey = await GeminiVideoService.getApiKey(companyId);
        const script = await GeminiVideoService.generateScript({
          companyName: company?.name || "Empresa",
          niche: company?.niche || "outro",
          template: body.template || "dica_rapida",
          productName,
          headline,
          subtext,
          targetDuration: body.target_duration || 15,
          apiKey
        });
        return reply.send({ script });
      } catch (err) {
        return reply.status(502).send({ error: err.message || "Erro ao gerar roteiro" });
      }
    }
  );
  app2.patch(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const existing = await Video.findById(id).lean();
      if (!existing) {
        return reply.status(404).send({ error: "Video nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(existing.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      const { company_id, _id, ...updateData } = request.body;
      const video = await Video.findByIdAndUpdate(id, updateData, {
        new: true
      }).lean();
      return reply.send({ video });
    }
  );
  app2.delete(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const video = await Video.findById(id).lean();
      if (!video) {
        return reply.status(404).send({ error: "Video nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(video.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      await Video.findByIdAndDelete(id);
      return reply.send({ message: "Video removido" });
    }
  );
  app2.post(
    "/estimate-tts",
    async (request, reply) => {
      const { text, speed } = request.body;
      if (!text) {
        return reply.status(400).send({ error: "text e obrigatorio" });
      }
      const durationMs = TTSService.estimateDuration(text, speed || 1);
      return reply.send({
        duration_ms: durationMs,
        duration_seconds: Math.round(durationMs / 1e3),
        word_count: text.split(/\s+/).filter(Boolean).length
      });
    }
  );
}

// src/routes/scripts.ts
async function scriptsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get(
    "/",
    async (request, reply) => {
      const { companyId, role } = request.user;
      const { category, page = "1", limit = "20" } = request.query;
      const query = {};
      if (role !== "superadmin" && role !== "support") {
        if (!companyId) {
          return reply.status(400).send({ error: "Empresa nao encontrada" });
        }
        query.company_id = companyId;
      }
      if (category) query.category = category;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [scripts, total] = await Promise.all([
        Script.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Script.countDocuments(query)
      ]);
      return reply.send({
        scripts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.post(
    "/",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      if (!body.title) {
        return reply.status(400).send({ error: "Titulo do roteiro e obrigatorio" });
      }
      const script = await Script.create({
        company_id: companyId,
        title: body.title,
        category: body.category || "",
        text: body.text || "",
        char_count: (body.text || "").length,
        audio_url: body.audio_url || "",
        video_url: body.video_url || "",
        images: body.images || [],
        campaign_id: body.campaign_id || null
      });
      return reply.status(201).send({ script });
    }
  );
  app2.post(
    "/ai/improve",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const { text, category, niche } = request.body;
      if (!text || text.trim().length === 0) {
        return reply.status(400).send({ error: "Texto do roteiro e obrigatorio" });
      }
      const integration = await Integration.findOne({ company_id: companyId }).lean();
      const encryptedKey = integration?.gemini?.api_key;
      if (!encryptedKey || !integration?.gemini?.active) {
        return reply.status(400).send({
          error: "Configure sua chave da API Gemini em Configuracoes > Integracoes para usar a IA"
        });
      }
      let apiKey;
      try {
        apiKey = EncryptionService.decrypt(encryptedKey);
      } catch {
        return reply.status(500).send({ error: "Erro ao descriptografar chave Gemini" });
      }
      const prompt = `Voce e um especialista em comunicacao e marketing para pequenos negocios no Brasil.
Melhore o texto abaixo de um roteiro de comunicacao${category ? ` da categoria "${category}"` : ""}${niche ? ` para um negocio do tipo "${niche}"` : ""}.
Mantenha o tom informal e amigavel, use emojis quando apropriado, e torne a mensagem mais persuasiva e engajante.
Mantenha o significado original mas melhore a clareza, o tom e o impacto.
Responda APENAS com o texto melhorado, sem explicacoes adicionais.

Texto original:
${text}`;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return reply.status(502).send({
            error: errData?.error?.message || "Erro ao chamar API Gemini"
          });
        }
        const data = await res.json();
        const improved = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!improved) {
          return reply.status(502).send({ error: "Gemini nao retornou texto" });
        }
        return reply.send({ improved_text: improved.trim() });
      } catch {
        return reply.status(502).send({ error: "Erro de conexao com API Gemini" });
      }
    }
  );
  app2.get(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const script = await Script.findById(id).lean();
      if (!script) {
        return reply.status(404).send({ error: "Roteiro nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(script.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      return reply.send({ script });
    }
  );
  app2.put(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const existing = await Script.findById(id).lean();
      if (!existing) {
        return reply.status(404).send({ error: "Roteiro nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(existing.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      const { company_id, _id, ...updateData } = request.body;
      if (typeof updateData.text === "string") {
        updateData.char_count = updateData.text.length;
      }
      const script = await Script.findByIdAndUpdate(id, updateData, {
        new: true
      }).lean();
      return reply.send({ script });
    }
  );
  app2.delete(
    "/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { companyId, role } = request.user;
      const script = await Script.findById(id).lean();
      if (!script) {
        return reply.status(404).send({ error: "Roteiro nao encontrado" });
      }
      if (role !== "superadmin" && role !== "support" && String(script.company_id) !== companyId) {
        return reply.status(403).send({ error: "Sem permissao" });
      }
      await Script.findByIdAndDelete(id);
      return reply.send({ message: "Roteiro removido" });
    }
  );
}

// src/routes/integrations.ts
async function integrationsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.get("/meta", async (request, reply) => {
    const { companyId } = request.user;
    if (!companyId) {
      return reply.status(400).send({ error: "Empresa nao encontrada" });
    }
    const integration = await Integration.findOne({
      company_id: companyId
    }).lean();
    if (!integration) {
      return reply.status(404).send({ error: "Integracao nao encontrada" });
    }
    const meta = { ...integration.meta };
    if (meta.access_token) {
      meta.access_token = meta.access_token.substring(0, 8) + "..." + meta.access_token.substring(meta.access_token.length - 4);
    }
    return reply.send({
      integration: {
        ...integration,
        meta
      }
    });
  });
  app2.post(
    "/meta",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const body = request.body;
      if (!body.access_token) {
        return reply.status(400).send({ error: "access_token e obrigatorio" });
      }
      const encryptedToken = EncryptionService.encrypt(body.access_token);
      const integration = await Integration.findOneAndUpdate(
        { company_id: companyId },
        {
          "meta.access_token": encryptedToken,
          "meta.instagram_account_id": body.instagram_account_id || "",
          "meta.instagram_username": body.instagram_username || "",
          "meta.facebook_page_id": body.facebook_page_id || "",
          "meta.facebook_page_name": body.facebook_page_name || "",
          "meta.connected": true,
          "meta.connected_at": /* @__PURE__ */ new Date(),
          "meta.status": "ok",
          "meta.token_expires_at": new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1e3
          ),
          // 60 days
          updated_at: /* @__PURE__ */ new Date()
        },
        { new: true, upsert: true }
      ).lean();
      return reply.send({
        message: "Integracao Meta salva com sucesso",
        integration: {
          connected: true,
          instagram_username: body.instagram_username || "",
          facebook_page_name: body.facebook_page_name || "",
          status: "ok"
        }
      });
    }
  );
  app2.post(
    "/meta/test",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const integration = await Integration.findOne({
        company_id: companyId
      }).lean();
      if (!integration?.meta?.access_token) {
        return reply.send({
          valid: false,
          message: "Token Meta nao configurado"
        });
      }
      return reply.send({
        valid: true,
        message: "Token valido (placeholder)",
        expires_at: integration.meta.token_expires_at
      });
    }
  );
  app2.get("/whatsapp", async (request, reply) => {
    const { companyId } = request.user;
    if (!companyId) {
      return reply.status(400).send({ error: "Empresa nao encontrada" });
    }
    const integration = await Integration.findOne({
      company_id: companyId
    }).lean();
    if (!integration) {
      return reply.send({
        whatsapp: { connected: false, status: "disconnected" }
      });
    }
    return reply.send({ whatsapp: integration.whatsapp });
  });
  app2.post(
    "/gemini",
    async (request, reply) => {
      const { companyId } = request.user;
      if (!companyId) {
        return reply.status(400).send({ error: "Empresa nao encontrada" });
      }
      const { api_key } = request.body;
      if (!api_key) {
        return reply.status(400).send({ error: "api_key e obrigatoria" });
      }
      const encryptedKey = EncryptionService.encrypt(api_key);
      await Integration.findOneAndUpdate(
        { company_id: companyId },
        {
          "gemini.api_key": encryptedKey,
          "gemini.active": true,
          "gemini.last_tested_at": /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        },
        { upsert: true }
      );
      return reply.send({ message: "Chave Gemini salva com sucesso" });
    }
  );
}

// src/routes/webhooks.ts
async function webhooksRoutes(app2) {
  app2.get(
    "/meta/callback",
    async (request, reply) => {
      const { code, state, error, error_description } = request.query;
      if (error) {
        console.error(
          `[MetaCallback] OAuth error: ${error} - ${error_description}`
        );
        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?error=${encodeURIComponent(error_description || error)}`
        );
      }
      if (!code || !state) {
        return reply.status(400).send({ error: "Parametros invalidos" });
      }
      try {
        const companyId = state;
        const META_APP_ID = process.env.META_APP_ID;
        const META_APP_SECRET = process.env.META_APP_SECRET;
        const META_REDIRECT_URI = process.env.META_REDIRECT_URI;
        const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI || "")}&client_secret=${META_APP_SECRET}&code=${code}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          console.error("[MetaCallback] Failed to get token:", tokenData);
          return reply.redirect(
            `${process.env.APP_URL}/dashboard/integrations?error=token_exchange_failed`
          );
        }
        const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`;
        const longLivedRes = await fetch(longLivedUrl);
        const longLivedData = await longLivedRes.json();
        const accessToken = longLivedData.access_token || tokenData.access_token;
        const expiresIn = longLivedData.expires_in || 5184e3;
        const encryptedToken = EncryptionService.encrypt(accessToken);
        await Integration.findOneAndUpdate(
          { company_id: companyId },
          {
            "meta.access_token": encryptedToken,
            "meta.connected": true,
            "meta.connected_at": /* @__PURE__ */ new Date(),
            "meta.status": "ok",
            "meta.token_expires_at": new Date(
              Date.now() + expiresIn * 1e3
            ),
            updated_at: /* @__PURE__ */ new Date()
          },
          { upsert: true }
        );
        console.log(
          `[MetaCallback] Successfully connected Meta for company ${companyId}`
        );
        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?success=true`
        );
      } catch (err) {
        console.error("[MetaCallback] Error:", err);
        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?error=internal_error`
        );
      }
    }
  );
  app2.post(
    "/evolution",
    async (request, reply) => {
      const body = request.body;
      const event = body.event;
      const instance = body.instance;
      console.log(
        `[EvolutionWebhook] Event: ${event}, Instance: ${instance}`
      );
      if (!event || !instance) {
        return reply.status(400).send({ error: "Payload invalido" });
      }
      try {
        switch (event) {
          case "connection.update": {
            const connectionState = body.data?.state || "disconnected";
            const isConnected2 = connectionState === "open";
            await Integration.updateMany(
              { "whatsapp.instance_name": instance },
              {
                "whatsapp.connected": isConnected2,
                "whatsapp.status": connectionState,
                updated_at: /* @__PURE__ */ new Date()
              }
            );
            console.log(
              `[EvolutionWebhook] Instance ${instance} status: ${connectionState}`
            );
            break;
          }
          case "messages.upsert": {
            console.log(
              `[EvolutionWebhook] New message on instance ${instance}`
            );
            break;
          }
          case "qrcode.updated": {
            console.log(
              `[EvolutionWebhook] QR Code updated for instance ${instance}`
            );
            break;
          }
          default:
            console.log(
              `[EvolutionWebhook] Unhandled event: ${event}`
            );
        }
        return reply.send({ received: true });
      } catch (err) {
        console.error("[EvolutionWebhook] Error:", err);
        return reply.status(500).send({ error: "Erro ao processar webhook" });
      }
    }
  );
}

// src/routes/admin/dashboard.ts
async function adminDashboardRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.addHook("preHandler", adminOnly);
  app2.get("/summary", async (_request, reply) => {
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const [
      activeCompanies,
      setupPending,
      overdueCompanies,
      allCompanies,
      postsToday,
      failedPostsToday
    ] = await Promise.all([
      Company.countDocuments({ status: "active" /* Active */ }),
      Company.countDocuments({ status: "setup_pending" /* SetupPending */ }),
      Company.countDocuments({ "billing.status": "overdue" /* Overdue */ }),
      Company.find({ status: "active" /* Active */ }).select("billing.monthly_amount").lean(),
      Post.countDocuments({
        status: "published" /* Published */,
        published_at: { $gte: todayStart, $lte: todayEnd }
      }),
      Post.countDocuments({
        status: "failed" /* Failed */,
        created_at: { $gte: todayStart, $lte: todayEnd }
      })
    ]);
    const monthlyRevenue = allCompanies.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0
    );
    return reply.send({
      activeCompanies,
      monthlyRevenue,
      setupPending,
      overdueCount: overdueCompanies,
      postsToday,
      failedPostsToday
    });
  });
  app2.get("/alerts", async (_request, reply) => {
    const alerts = await Notification.find({
      target: "admin",
      read: false
    }).sort({ created_at: -1 }).limit(50).lean();
    return reply.send({ alerts });
  });
}

// src/services/notification.service.ts
var NotificationService = class {
  static async create(data) {
    const notification = await Notification.create({
      target: data.target,
      company_id: data.company_id || null,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.action_url || "",
      read: false
    });
    return notification;
  }
  static async markRead(id) {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    return notification;
  }
  static async getUnread(target, companyId) {
    const query = { target, read: false };
    if (companyId) {
      query.company_id = companyId;
    }
    const notifications = await Notification.find(query).sort({ created_at: -1 }).limit(50).lean();
    return notifications;
  }
};

// src/routes/admin/financial.ts
async function adminFinancialRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.addHook("preHandler", adminOnly);
  app2.get("/summary", async (_request, reply) => {
    const [
      totalCompanies,
      paidCount,
      pendingCount,
      overdueCount,
      allActive
    ] = await Promise.all([
      Company.countDocuments({ status: { $ne: "cancelled" } }),
      Company.countDocuments({ "billing.status": "paid" /* Paid */ }),
      Company.countDocuments({ "billing.status": "pending" /* Pending */ }),
      Company.countDocuments({ "billing.status": "overdue" /* Overdue */ }),
      Company.find({ status: "active" /* Active */ }).select("billing.monthly_amount setup_amount setup_paid").lean()
    ]);
    const monthlyRevenue = allActive.reduce(
      (sum, c) => sum + (c.billing?.monthly_amount || 0),
      0
    );
    const setupRevenue = allActive.filter((c) => c.setup_paid).reduce((sum, c) => sum + (c.setup_amount || 0), 0);
    return reply.send({
      summary: {
        total_companies: totalCompanies,
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
        monthly_revenue: monthlyRevenue,
        setup_revenue: setupRevenue
      }
    });
  });
  app2.get(
    "/billing",
    async (request, reply) => {
      const { status, page = "1", limit = "20" } = request.query;
      const query = {
        status: { $ne: "cancelled" }
      };
      if (status) {
        query["billing.status"] = status;
      }
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [companies, total] = await Promise.all([
        Company.find(query).select(
          "name slug niche status access_enabled billing setup_paid setup_amount plan_id"
        ).populate("plan_id", "name slug monthly_price").sort({ "billing.overdue_days": -1 }).skip(skip).limit(limitNum).lean(),
        Company.countDocuments(query)
      ]);
      return reply.send({
        companies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
  app2.post(
    "/billing/:id/confirm",
    async (request, reply) => {
      const { id } = request.params;
      const company = await Company.findById(id);
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      const now = /* @__PURE__ */ new Date();
      const dueDay = company.billing?.due_day || 10;
      let nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      if (nextDue <= now) {
        nextDue = new Date(now.getFullYear(), now.getMonth() + 2, dueDay);
      }
      await Company.findByIdAndUpdate(id, {
        "billing.status": "paid" /* Paid */,
        "billing.last_paid_at": now,
        "billing.next_due_at": nextDue,
        "billing.overdue_days": 0,
        access_enabled: true,
        status: "active" /* Active */
      });
      return reply.send({
        message: "Pagamento confirmado",
        next_due_at: nextDue
      });
    }
  );
  app2.post(
    "/billing/:id/notify",
    async (request, reply) => {
      const { id } = request.params;
      const company = await Company.findById(id).lean();
      if (!company) {
        return reply.status(404).send({ error: "Empresa nao encontrada" });
      }
      await NotificationService.create({
        target: "company",
        company_id: id,
        type: "payment_due" /* PaymentDue */,
        title: "Lembrete de pagamento",
        message: `Ola ${company.responsible_name}, sua fatura esta pendente. Regularize seu pagamento para continuar usando a plataforma.`,
        action_url: "/dashboard/billing"
      });
      return reply.send({
        message: `Lembrete de pagamento enviado para ${company.name}`
      });
    }
  );
}

// src/routes/admin/health.ts
var import_mongoose22 = __toESM(require("mongoose"));
async function adminHealthRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.addHook("preHandler", adminOnly);
  app2.get("/services", async (_request, reply) => {
    let mongoStatus = "disconnected";
    try {
      const state = import_mongoose22.default.connection.readyState;
      mongoStatus = state === 1 ? "connected" : state === 2 ? "connecting" : "disconnected";
    } catch {
      mongoStatus = "error";
    }
    let redisStatus = "disconnected";
    try {
      const pong = await redis_default.ping();
      redisStatus = pong === "PONG" ? "connected" : "error";
    } catch {
      redisStatus = "error";
    }
    return reply.send({
      mongodb: {
        status: mongoStatus,
        host: import_mongoose22.default.connection.host || "unknown",
        name: import_mongoose22.default.connection.name || "unknown"
      },
      redis: {
        status: redisStatus
      }
    });
  });
  app2.get(
    "/integrations",
    async (_request, reply) => {
      const integrations = await Integration.find().populate("company_id", "name slug").select("company_id meta.connected meta.status meta.token_expires_at whatsapp.connected whatsapp.status").lean();
      const result = integrations.map((i) => ({
        company: i.company_id,
        meta: {
          connected: i.meta?.connected || false,
          status: i.meta?.status || "disconnected",
          token_expires_at: i.meta?.token_expires_at || null,
          token_expired: i.meta?.token_expires_at ? new Date(i.meta.token_expires_at) < /* @__PURE__ */ new Date() : false
        },
        whatsapp: {
          connected: i.whatsapp?.connected || false,
          status: i.whatsapp?.status || "disconnected"
        }
      }));
      return reply.send({ integrations: result });
    }
  );
  app2.get("/queue", async (_request, reply) => {
    const [pending, processing, failed, done] = await Promise.all([
      PostQueue.countDocuments({ status: "queued" /* Queued */ }),
      PostQueue.countDocuments({ status: "processing" /* Processing */ }),
      PostQueue.countDocuments({ status: "failed" /* Failed */ }),
      PostQueue.countDocuments({ status: "done" /* Done */ })
    ]);
    const recentItems = await PostQueue.find({
      status: { $in: ["queued" /* Queued */, "processing" /* Processing */] }
    }).sort({ scheduled_at: 1 }).limit(20).populate("company_id", "name").populate("card_id", "headline format").lean();
    return reply.send({
      queue: {
        pending,
        processing,
        failed,
        done,
        recent_items: recentItems
      }
    });
  });
  app2.get("/errors", async (_request, reply) => {
    const recentErrors = await Post.find({
      status: "failed" /* Failed */
    }).sort({ created_at: -1 }).limit(50).populate("company_id", "name slug").populate("card_id", "headline format post_type").lean();
    return reply.send({ errors: recentErrors });
  });
}

// src/routes/admin/logs.ts
async function adminLogsRoutes(app2) {
  app2.addHook("preHandler", authenticate);
  app2.addHook("preHandler", adminOnly);
  app2.get(
    "/",
    async (request, reply) => {
      const {
        company_id,
        status,
        platform,
        date_from,
        date_to,
        page = "1",
        limit = "30"
      } = request.query;
      const query = {};
      if (company_id) query.company_id = company_id;
      if (status) query.status = status;
      if (platform) query.platforms = platform;
      if (date_from || date_to) {
        const dateFilter = {};
        if (date_from) dateFilter.$gte = new Date(date_from);
        if (date_to) {
          const endDate = new Date(date_to);
          endDate.setHours(23, 59, 59, 999);
          dateFilter.$lte = endDate;
        }
        query.created_at = dateFilter;
      }
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;
      const [posts, total] = await Promise.all([
        Post.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum).populate("company_id", "name slug niche").populate("card_id", "headline format post_type generated_image_url").lean(),
        Post.countDocuments(query)
      ]);
      return reply.send({
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    }
  );
}

// src/app.ts
var app = null;
async function getApp() {
  if (app) return app;
  app = (0, import_fastify.default)({ logger: false });
  await app.register(import_cors.default, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });
  await app.register(import_cookie.default);
  await app.register(import_jwt.default, {
    secret: process.env.JWT_SECRET || "fallback_secret",
    cookie: {
      cookieName: "soma-token",
      signed: false
    }
  });
  await connectDB(process.env.MONGO_URI || "mongodb://localhost:27017/soma_ai_dev");
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(companiesRoutes, { prefix: "/api/companies" });
  await app.register(cardsRoutes, { prefix: "/api/cards" });
  await app.register(postsRoutes, { prefix: "/api/posts" });
  await app.register(postQueueRoutes, { prefix: "/api/post-queue" });
  await app.register(campaignsRoutes, { prefix: "/api/campaigns" });
  await app.register(schedulesRoutes, { prefix: "/api/schedules" });
  await app.register(videosRoutes, { prefix: "/api/videos" });
  await app.register(scriptsRoutes, { prefix: "/api/scripts" });
  await app.register(integrationsRoutes, { prefix: "/api/integrations" });
  await app.register(webhooksRoutes, { prefix: "/api/webhooks" });
  await app.register(adminDashboardRoutes, { prefix: "/api/admin/dashboard" });
  await app.register(adminFinancialRoutes, { prefix: "/api/admin/financial" });
  await app.register(adminHealthRoutes, { prefix: "/api/admin/health" });
  await app.register(adminLogsRoutes, { prefix: "/api/admin/logs" });
  await app.ready();
  return app;
}

// api/_handler.ts
async function handler(req, res) {
  try {
    const app2 = await getApp();
    app2.routing(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5)
    }));
  }
}
module.exports=module.exports.default||module.exports;
