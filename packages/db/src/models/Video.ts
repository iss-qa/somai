import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISubtitleSegment {
  text: string
  start_ms: number
  end_ms: number
}

export interface IVideoSlide {
  order: number
  type: 'card' | 'text' | 'image'
  card_id: Types.ObjectId | null
  title: string
  text: string
  image_url: string
  duration_ms: number
}

export interface IVideo extends Document {
  company_id: Types.ObjectId
  title: string
  type: string
  source_card_id: Types.ObjectId | null

  // Template & format
  template: string
  target_duration: number
  aspect_ratio: string

  // Product data (legacy compat)
  product_name: string
  product_images: string[]
  price_original: number
  price_promo: number
  extra_text: string

  // Narration
  narration_text: string
  voice_type: string
  voice_speed: number
  narration_audio_url: string

  // Music
  background_music: string

  // Visual
  palette: string
  site_link: string
  company_logo_url: string

  // Subtitles
  subtitle_mode: string
  subtitle_text: string
  subtitles: ISubtitleSegment[]

  // Slides
  slides: IVideoSlide[]

  // AI Generation
  gemini_prompt: string
  gemini_script: string
  generation_method: string
  gemini_model_used: string
  use_gemini_veo: boolean

  // Output
  video_url: string
  thumbnail_url: string
  duration_seconds: number
  has_audio: boolean
  audio_url: string

  // Status
  status: 'queued' | 'generating' | 'ready' | 'failed' | 'posted'
  error_message: string
  generation_time_ms: number
  generation_progress: number
  scheduled_post_id: Types.ObjectId | null

  createdAt: Date
  updatedAt: Date
}

const SubtitleSegmentSchema = new Schema(
  {
    text: { type: String, required: true },
    start_ms: { type: Number, required: true },
    end_ms: { type: Number, required: true },
  },
  { _id: false },
)

const VideoSlideSchema = new Schema(
  {
    order: { type: Number, required: true },
    type: { type: String, enum: ['card', 'text', 'image'], default: 'text' },
    card_id: { type: Schema.Types.ObjectId, ref: 'Card', default: null },
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    image_url: { type: String, default: '' },
    duration_ms: { type: Number, default: 5000 },
  },
  { _id: false },
)

const VideoSchema = new Schema<IVideo>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: { type: String, required: true },
    type: { type: String, required: true },
    source_card_id: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
    },

    // Template & format
    template: {
      type: String,
      enum: [
        'dica_rapida',
        'passo_a_passo',
        'beneficio_destaque',
        'depoimento',
        'comparativo',
        'lancamento',
      ],
      default: 'dica_rapida',
    },
    target_duration: { type: Number, default: 15 },
    aspect_ratio: {
      type: String,
      enum: ['9:16', '16:9', '1:1'],
      default: '9:16',
    },

    // Product
    product_name: { type: String, default: '' },
    product_images: [{ type: String }],
    price_original: { type: Number, default: 0 },
    price_promo: { type: Number, default: 0 },
    extra_text: { type: String, default: '' },

    // Narration
    narration_text: { type: String, default: '' },
    voice_type: {
      type: String,
      enum: ['feminino', 'masculino', 'neutro'],
      default: 'feminino',
    },
    voice_speed: { type: Number, default: 1.0 },
    narration_audio_url: { type: String, default: '' },

    // Music
    background_music: {
      type: String,
      enum: ['nenhuma', 'upbeat', 'calma', 'motivacional', 'corporativa'],
      default: 'nenhuma',
    },

    // Visual
    palette: {
      type: String,
      enum: [
        'juntix_verde',
        'escuro_premium',
        'vibrante_tropical',
        'minimalista_clean',
        'custom',
      ],
      default: 'juntix_verde',
    },
    site_link: { type: String, default: '' },
    company_logo_url: { type: String, default: '' },

    // Subtitles
    subtitle_mode: {
      type: String,
      enum: ['auto', 'manual', 'off'],
      default: 'auto',
    },
    subtitle_text: { type: String, default: '' },
    subtitles: [SubtitleSegmentSchema],

    // Slides
    slides: [VideoSlideSchema],

    // AI Generation
    gemini_prompt: { type: String, default: '' },
    gemini_script: { type: String, default: '' },
    generation_method: {
      type: String,
      enum: ['gemini_veo', 'remotion', 'template', ''],
      default: '',
    },
    gemini_model_used: { type: String, default: '' },
    use_gemini_veo: { type: Boolean, default: false },

    // Output
    video_url: { type: String, default: '' },
    thumbnail_url: { type: String, default: '' },
    duration_seconds: { type: Number, default: 0 },
    has_audio: { type: Boolean, default: false },
    audio_url: { type: String, default: '' },

    // Status
    status: {
      type: String,
      enum: ['queued', 'generating', 'ready', 'failed', 'posted'],
      default: 'queued',
    },
    error_message: { type: String, default: '' },
    generation_time_ms: { type: Number, default: 0 },
    generation_progress: { type: Number, default: 0, min: 0, max: 100 },
    scheduled_post_id: {
      type: Schema.Types.ObjectId,
      ref: 'PostQueue',
      default: null,
    },
  },
  { timestamps: true },
)

VideoSchema.index({ company_id: 1, status: 1 })
VideoSchema.index({ company_id: 1, createdAt: -1 })

export const Video =
  mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema)
