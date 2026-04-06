# Soma.ai — Arquitetura Técnica e Fluxos

---

## Visão macro

```
┌─────────────────────────────────────────────────────────┐
│                     SOMA.AI                             │
│                                                         │
│  ┌─────────────────┐      ┌─────────────────┐          │
│  │  Company Panel  │      │   Admin Panel   │          │
│  │  (Next.js)      │      │   (Next.js)     │          │
│  │  /app/*         │      │   /admin/*      │          │
│  └────────┬────────┘      └────────┬────────┘          │
│           │                        │                    │
│           └──────────┬─────────────┘                   │
│                      │                                  │
│             ┌────────▼────────┐                        │
│             │   API Fastify   │                        │
│             │   :3001         │                        │
│             └────────┬────────┘                        │
│                      │                                  │
│        ┌─────────────┼─────────────┐                   │
│        │             │             │                    │
│   ┌────▼────┐  ┌─────▼─────┐ ┌───▼────┐              │
│   │ MongoDB │  │   Redis   │ │  R2    │              │
│   │         │  │  BullMQ   │ │Storage │              │
│   └─────────┘  └─────┬─────┘ └────────┘              │
│                      │                                  │
│              ┌───────▼────────┐                        │
│              │    Workers     │                        │
│              │  (Schedulers)  │                        │
│              └───────┬────────┘                        │
│                      │                                  │
│        ┌─────────────┼─────────────┐                   │
│        │             │             │                    │
│   ┌────▼──────┐ ┌────▼──────┐ ┌──▼──────────┐        │
│   │ Meta API  │ │ Evolution │ │ Gemini API  │        │
│   │ IG + FB   │ │ WhatsApp  │ │ (BYOK)      │        │
│   └───────────┘ └───────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Estrutura de pastas detalhada

```
soma-ai/
│
├── apps/
│   │
│   ├── web/                          → Next.js 14 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (company)/            → painel da empresa
│   │   │   │   ├── dashboard/
│   │   │   │   ├── cards/
│   │   │   │   │   ├── generate/
│   │   │   │   │   └── library/
│   │   │   │   ├── videos/
│   │   │   │   ├── scripts/
│   │   │   │   ├── calendar/
│   │   │   │   ├── posts/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── whatsapp/
│   │   │   │   └── settings/
│   │   │   │       └── integrations/
│   │   │   └── (admin)/              → painel admin
│   │   │       ├── dashboard/
│   │   │       ├── companies/
│   │   │       │   ├── [id]/
│   │   │       │   └── new/
│   │   │       ├── financial/
│   │   │       ├── health/
│   │   │       ├── logs/
│   │   │       ├── plans/
│   │   │       └── config/
│   │   ├── components/
│   │   │   ├── ui/                   → shadcn/ui
│   │   │   ├── company/              → componentes do painel company
│   │   │   └── admin/                → componentes do painel admin
│   │   ├── lib/
│   │   │   ├── api.ts                → cliente HTTP para a API Fastify
│   │   │   └── auth.ts               → next-auth config
│   │   └── middleware.ts             → proteção de rotas
│   │
│   └── api/                          → Fastify
│       ├── src/
│       │   ├── server.ts             → bootstrap
│       │   ├── plugins/
│       │   │   ├── mongo.ts
│       │   │   ├── redis.ts
│       │   │   └── auth.ts           → JWT verify
│       │   ├── routes/
│       │   │   ├── auth/
│       │   │   ├── companies/
│       │   │   ├── cards/
│       │   │   ├── videos/
│       │   │   ├── scripts/
│       │   │   ├── posts/
│       │   │   ├── campaigns/
│       │   │   ├── schedules/
│       │   │   ├── integrations/
│       │   │   ├── admin/
│       │   │   └── webhooks/
│       │   ├── workers/              → BullMQ workers
│       │   │   ├── post.worker.ts    → publica posts agendados
│       │   │   ├── video.worker.ts   → gera vídeos com Gemini
│       │   │   ├── analytics.worker.ts → coleta métricas Meta API
│       │   │   └── billing.worker.ts → verifica inadimplência diariamente
│       │   ├── services/
│       │   │   ├── meta.service.ts   → Meta Graph API
│       │   │   ├── evolution.service.ts → Evolution API
│       │   │   ├── gemini.service.ts → Gemini API
│       │   │   ├── storage.service.ts → R2 / storage
│       │   │   └── notification.service.ts
│       │   └── queues/
│       │       ├── post.queue.ts
│       │       ├── video.queue.ts
│       │       └── billing.queue.ts
│       └── Dockerfile
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── connection.ts
│   │   │   └── models/               → um arquivo por collection
│   │   │       ├── Company.ts
│   │   │       ├── User.ts
│   │   │       ├── Card.ts
│   │   │       ├── Video.ts
│   │   │       ├── Script.ts
│   │   │       ├── Post.ts
│   │   │       ├── PostQueue.ts
│   │   │       ├── Schedule.ts
│   │   │       ├── Campaign.ts
│   │   │       ├── Integration.ts
│   │   │       ├── Analytics.ts
│   │   │       ├── Notification.ts
│   │   │       └── AuditLog.ts
│   │   └── package.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── types/                → interfaces TypeScript
│       │   ├── enums/                → status, nichos, formatos
│       │   ├── constants/            → planos, limites, nichos
│       │   └── utils/                → formatação, datas, validação
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── turbo.json                        → Turborepo
└── package.json
```

---

## Fluxo 1 — Geração e publicação de card

```
[1] Usuário acessa "Gerar Card"
         │
[2] Seleciona tipo de post + preenche produto/preço
         │
[3] Frontend chama POST /api/cards/generate
         │
[4] API monta prompt com niche_config da empresa
    + chama IA (DALL-E ou Ideogram) para imagem
    + gera caption e hashtags
         │
[5] Card salvo no MongoDB com status: 'draft'
    + imagem salva no R2
         │
[6] Preview exibido para o usuário
         │
[7] Usuário aprova → PATCH /api/cards/:id/approve
    status muda para: 'approved'
         │
[8] Usuário agenda → POST /api/post-queue
    job criado no BullMQ com delay até o horário
         │
[9] Na hora agendada, post.worker dispara:
    → chama Meta API (Instagram e/ou Facebook)
    → salva resultado em posts collection
    → atualiza card status para: 'posted'
    → cria notification se falhar
```

---

## Fluxo 2 — Scheduler automático

```
[1] Admin configura horários em schedules collection
         │
[2] billing.worker roda todo dia às 00:01
    verifica companies com auto-post ativo
         │
[3] Para cada company:
    → verifica próximo slot do schedule
    → busca card approved mais antigo sem post
    → cria job na post_queue com scheduled_at
         │
[4] post.worker executa na hora certa
    → verifica se access_enabled = true
    → verifica se token Meta está válido
    → publica via Meta API
    → registra em posts
```

---

## Fluxo 3 — Controle de acesso por inadimplência

```
[1] billing.worker roda todo dia às 06:00
         │
[2] Para cada company:
    → calcula overdue_days = hoje - next_due_at
         │
[3] overdue_days >= 5  → cria notification 'payment_due'
                         envia WhatsApp de lembrete
         │
[4] overdue_days >= 30 → seta access_enabled = false
                          status = 'blocked'
                          para todos os jobs da empresa
                          cria notification 'access_blocked'
                          envia WhatsApp de aviso
         │
[5] Admin confirma pagamento manualmente
    → access_enabled = true
    → status = 'active'
    → overdue_days = 0
    → next_due_at recalculado
    → audit_log registrado
```

---

## Fluxo 4 — Geração de vídeo com Gemini

```
[1] Usuário acessa "Gerar Vídeo"
    informa: produto, imagens, preço, texto extra
         │
[2] POST /api/videos/generate
    verifica se company tem gemini.api_key configurada
         │
[3] video.worker entra na fila
         │
[4] Worker monta prompt → chama Gemini API
    (usando a api_key da empresa — BYOK)
         │
[5] Gemini retorna script + timeline do vídeo
         │
[6] Worker usa FFmpeg/Remotion para montar o vídeo
    com imagens do produto + texto animado + áudio TTS
         │
[7] Vídeo salvo no R2
    status: 'ready'
    notification enviada ao usuário
         │
[8] Usuário baixa ou agenda o vídeo
```

---

## Variáveis de ambiente (.env.example)

```bash
# App
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
JWT_SECRET=

# MongoDB
MONGODB_URI=mongodb://localhost:27017/soma-ai

# Redis
REDIS_URL=redis://localhost:6379

# Meta Graph API
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Encryption (para tokens de terceiros)
ENCRYPTION_KEY=

# BullMQ
BULL_REDIS_URL=redis://localhost:6379
```
