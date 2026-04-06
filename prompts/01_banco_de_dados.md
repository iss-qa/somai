# Soma.ai — Banco de Dados (MongoDB)

---

## Visão geral das collections

```
AUTENTICAÇÃO E EMPRESAS
├── admin_users          → operadores do painel admin
├── companies            → empresas parceiras cadastradas
├── users                → donos/usuários das companies
└── plans                → planos disponíveis e seus limites

CONFIGURAÇÃO
├── integrations         → tokens Meta API, Evolution, Gemini por empresa
├── niche_configs        → paletas, prompts e templates padrão por nicho
└── hashtag_sets         → pacotes de hashtags por segmento

CONTEÚDO GERADO
├── media_library        → logos, fotos de produto enviados pela empresa
├── templates            → templates de card por nicho e formato
├── cards                → cards gerados e aprovados
├── videos               → vídeos gerados (referências, status, URL)
└── scripts              → roteiros de comunicação (texto + mídia)

PUBLICAÇÃO
├── campaigns            → agrupamento de posts por campanha temática
├── schedules            → configuração de horários por empresa
├── post_queue           → fila de jobs aguardando publicação
└── posts                → histórico completo de postagens

CALENDÁRIO E SUGESTÕES
└── dates_calendar       → datas comemorativas com sugestão de pauta

SISTEMA
├── analytics            → métricas retornadas pela Meta API por post
├── notifications        → alertas para empresa e admin
└── audit_logs           → log de ações administrativas
```

---

## Schemas detalhados

### admin_users
```js
{
  _id: ObjectId,
  name: String,
  email: String,
  password_hash: String,           // bcrypt
  role: String,                    // 'superadmin' | 'support'
  active: Boolean,
  last_login: Date,
  created_at: Date
}
```

---

### plans
```js
{
  _id: ObjectId,
  slug: String,                    // 'starter' | 'pro'
  name: String,                    // 'Starter' | 'Pro'
  setup_price: Number,             // 297 | 497
  monthly_price: Number,           // 39.90 | 69.90
  features: {
    instagram: Boolean,
    facebook: Boolean,
    cards_limit: Number,           // -1 = ilimitado
    video_generation: Boolean,
    videos_per_day: Number,        // 0 | 2
    scripts: Boolean,
    whatsapp: Boolean,
    campaigns: Boolean,
    date_suggestions: Boolean,
    analytics: Boolean
  },
  active: Boolean,
  created_at: Date
}
```

---

### companies
```js
{
  _id: ObjectId,
  name: String,                    // 'Farmácia Central'
  slug: String,                    // 'farmacia-central' (URL do painel)
  niche: String,                   // 'farmacia' | 'pet' | 'moda' | 'cosmeticos' | 'mercearia' | 'calcados' | 'outro'
  city: String,
  state: String,
  responsible_name: String,
  whatsapp: String,
  email: String,
  logo_url: String,                // R2 storage
  brand_colors: {
    primary: String,               // hex
    secondary: String
  },
  plan_id: ObjectId,               // ref: plans
  status: String,                  // 'active' | 'blocked' | 'setup_pending' | 'trial' | 'cancelled'
  access_enabled: Boolean,         // controle manual de acesso
  setup_paid: Boolean,
  setup_paid_at: Date,
  setup_amount: Number,
  billing: {
    monthly_amount: Number,
    due_day: Number,               // 1, 5, 10, 15, 20
    last_paid_at: Date,
    next_due_at: Date,
    overdue_days: Number,          // calculado
    status: String                 // 'paid' | 'pending' | 'overdue'
  },
  notes: String,                   // observações internas do admin
  created_at: Date,
  updated_at: Date
}
```

---

### users
```js
{
  _id: ObjectId,
  company_id: ObjectId,            // ref: companies
  name: String,
  email: String,
  password_hash: String,
  role: String,                    // 'owner' | 'operator'
  active: Boolean,
  last_login: Date,
  created_at: Date
}
```

---

### integrations
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  // Meta Graph API
  meta: {
    access_token: String,          // long-lived token (criptografado)
    token_expires_at: Date,
    instagram_account_id: String,
    instagram_username: String,
    facebook_page_id: String,
    facebook_page_name: String,
    connected: Boolean,
    connected_at: Date,
    last_verified_at: Date,
    status: String                 // 'ok' | 'expired' | 'error' | 'disconnected'
  },
  // Evolution API (WhatsApp)
  whatsapp: {
    instance_name: String,         // ex: 'inst_farmacia_01'
    connected: Boolean,
    status: String                 // 'open' | 'close' | 'connecting'
  },
  // BYOK — chave do cliente
  gemini: {
    api_key: String,               // criptografada
    active: Boolean,
    last_tested_at: Date
  },
  updated_at: Date
}
```

---

### niche_configs
```js
{
  _id: ObjectId,
  niche: String,                   // 'farmacia' | 'pet' | etc.
  label: String,                   // 'Farmácia'
  default_colors: {
    primary: String,
    secondary: String,
    accent: String
  },
  post_types: [String],            // ['promocao', 'dica_saude', 'novidade', 'institucional', 'data_comemorativa']
  ai_prompts: {
    card_base: String,             // prompt base para geração de cards
    caption_base: String,          // prompt base para legenda/caption
    video_base: String             // prompt base para roteiro de vídeo
  },
  default_hashtags: [String],
  created_at: Date,
  updated_at: Date
}
```

---

### hashtag_sets
```js
{
  _id: ObjectId,
  company_id: ObjectId,            // null = global/padrão do nicho
  niche: String,
  name: String,                    // 'Set Promoção Farmácia'
  hashtags: [String],
  is_default: Boolean,
  created_at: Date
}
```

---

### media_library
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  type: String,                    // 'logo' | 'product_photo' | 'banner' | 'video_thumbnail'
  name: String,
  url: String,                     // R2 storage
  thumbnail_url: String,
  size_bytes: Number,
  mime_type: String,
  tags: [String],                  // para busca interna
  created_at: Date
}
```

---

### templates
```js
{
  _id: ObjectId,
  name: String,                    // 'Dark Gold Farmácia'
  niche: String,                   // null = universal
  format: String,                  // 'feed_1x1' | 'stories_9x16' | 'reels' | 'carousel'
  post_type: String,               // 'promocao' | 'dica' | 'novidade' | etc.
  thumbnail_url: String,
  config: {                        // configuração do layout
    background_style: String,
    font_headline: String,
    font_body: String,
    layout_zones: Object           // posições de cada elemento
  },
  active: Boolean,
  created_at: Date
}
```

---

### cards
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  template_id: ObjectId,
  format: String,                  // 'feed_1x1' | 'stories_9x16' | 'reels' | 'carousel'
  post_type: String,               // 'promocao' | 'dica' | 'novidade' | 'institucional' | 'data_comemorativa'
  // conteúdo gerado
  headline: String,
  subtext: String,
  cta: String,
  product_name: String,
  price_original: Number,
  price_promo: Number,
  // IA e geração
  ai_prompt_used: String,
  generated_image_url: String,     // R2 storage
  // caption para redes sociais
  caption: String,
  hashtags: [String],
  // status
  status: String,                  // 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived'
  approved_at: Date,
  // referências
  campaign_id: ObjectId,           // opcional
  post_id: ObjectId,               // preenchido após publicação
  created_at: Date,
  updated_at: Date
}
```

---

### videos
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  title: String,
  type: String,                    // 'product_promo' | 'carousel_animated' | 'reel' | 'story'
  // insumos
  source_card_id: ObjectId,        // card usado como base (opcional)
  product_name: String,
  product_images: [String],        // URLs de imagem de produto
  price_original: Number,
  price_promo: Number,
  extra_text: String,
  // geração
  gemini_prompt: String,
  gemini_script: String,           // roteiro gerado pelo Gemini
  // resultado
  video_url: String,               // R2 storage
  thumbnail_url: String,
  duration_seconds: Number,
  has_audio: Boolean,
  audio_url: String,
  // status
  status: String,                  // 'queued' | 'generating' | 'ready' | 'failed' | 'posted'
  error_message: String,
  generation_time_ms: Number,
  // agendamento
  scheduled_post_id: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

---

### scripts
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  title: String,
  category: String,                // 'apresentacao' | 'promocao' | 'dica' | 'depoimento' | 'lancamento'
  text: String,                    // conteúdo do roteiro
  char_count: Number,
  // mídias opcionais
  audio_url: String,
  video_url: String,
  images: [String],
  // uso
  sent_via_whatsapp: Boolean,
  whatsapp_sent_at: Date,
  // referência
  campaign_id: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

---

### campaigns
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  name: String,                    // 'Semana da Saúde', 'Dia das Mães'
  description: String,
  theme: String,
  start_date: Date,
  end_date: Date,
  status: String,                  // 'draft' | 'active' | 'completed'
  // conteúdo vinculado
  card_ids: [ObjectId],
  video_ids: [ObjectId],
  script_ids: [ObjectId],
  post_ids: [ObjectId],
  created_at: Date,
  updated_at: Date
}
```

---

### schedules
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  active: Boolean,
  publish_instagram: Boolean,
  publish_facebook: Boolean,
  publish_stories: Boolean,
  frequency: String,               // 'daily' | '2x_day' | 'weekdays' | 'custom'
  // slots por dia da semana (0=dom, 1=seg ... 6=sáb)
  weekly_slots: [
    {
      day: Number,
      time: String,                // 'HH:MM'
      format: String               // 'feed' | 'stories' | 'reels'
    }
  ],
  updated_at: Date
}
```

---

### post_queue
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  card_id: ObjectId,
  video_id: ObjectId,              // alternativo ao card
  scheduled_at: Date,
  platforms: [String],             // ['instagram', 'facebook']
  post_type: String,               // 'feed' | 'stories' | 'reels'
  caption: String,
  hashtags: [String],
  status: String,                  // 'queued' | 'processing' | 'done' | 'failed' | 'cancelled'
  bullmq_job_id: String,
  retry_count: Number,
  max_retries: Number,             // padrão: 3
  created_at: Date
}
```

---

### posts
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  queue_id: ObjectId,
  card_id: ObjectId,
  video_id: ObjectId,
  // publicação
  platforms: [String],
  post_type: String,
  caption: String,
  hashtags: [String],
  // resultado
  status: String,                  // 'published' | 'failed' | 'cancelled'
  published_at: Date,
  // IDs retornados pela Meta API
  instagram_post_id: String,
  facebook_post_id: String,
  // erro (se houver)
  error_code: String,
  error_message: String,
  retry_count: Number,
  // analytics (preenchido depois pelo job de analytics)
  analytics_id: ObjectId,
  created_at: Date
}
```

---

### dates_calendar
```js
{
  _id: ObjectId,
  date: String,                    // 'MM-DD' (anual) ou 'YYYY-MM-DD' (específica)
  name: String,                    // 'Dia do Farmacêutico'
  description: String,
  niches: [String],                // quais nichos relevantes. [] = todos
  suggested_post_type: String,     // 'institucional' | 'promocao' | 'dica'
  suggested_headline: String,
  ai_prompt_hint: String,
  active: Boolean
}
```

---

### analytics
```js
{
  _id: ObjectId,
  company_id: ObjectId,
  post_id: ObjectId,
  platform: String,                // 'instagram' | 'facebook'
  platform_post_id: String,
  // métricas
  impressions: Number,
  reach: Number,
  likes: Number,
  comments: Number,
  shares: Number,
  saves: Number,
  // stories específico
  story_replies: Number,
  story_exits: Number,
  // coleta
  fetched_at: Date,
  created_at: Date
}
```

---

### notifications
```js
{
  _id: ObjectId,
  target: String,                  // 'company' | 'admin'
  company_id: ObjectId,            // null se for para admin global
  type: String,                    // 'token_expired' | 'post_failed' | 'payment_due' | 'payment_overdue' | 'access_blocked' | 'setup_pending'
  title: String,
  message: String,
  read: Boolean,
  action_url: String,
  created_at: Date
}
```

---

### audit_logs
```js
{
  _id: ObjectId,
  admin_user_id: ObjectId,
  action: String,                  // 'company.block' | 'company.unblock' | 'plan.change' | 'payment.confirm' etc.
  target_type: String,             // 'company' | 'user' | 'plan'
  target_id: ObjectId,
  details: Object,                 // snapshot do estado antes/depois
  ip: String,
  created_at: Date
}
```

---

## Índices recomendados

```js
// Performance crítica
companies:     { status: 1 }, { 'billing.status': 1 }, { niche: 1 }
posts:         { company_id: 1, status: 1 }, { published_at: -1 }
post_queue:    { company_id: 1, status: 1 }, { scheduled_at: 1, status: 1 }
cards:         { company_id: 1, status: 1 }, { format: 1 }
videos:        { company_id: 1, status: 1 }
integrations:  { company_id: 1 }, { 'meta.token_expires_at': 1 }
notifications: { target: 1, company_id: 1, read: 1 }
analytics:     { company_id: 1 }, { post_id: 1 }
```
