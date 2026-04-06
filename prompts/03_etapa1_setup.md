# Soma.ai — Etapa 1: Setup Inicial do Monorepo

**Objetivo:** Ter o projeto rodando localmente com Next.js, Fastify, MongoDB e Redis funcionando em conjunto.

**Estimativa:** 1 dia de trabalho

---

## 1.1 Criar o monorepo com Turborepo

```bash
mkdir soma-ai && cd soma-ai
npx create-turbo@latest .
```

Quando perguntar a estrutura, escolher **npm workspaces** ou **pnpm workspaces** (pnpm recomendado para monorepo).

Depois, limpar os apps de exemplo e recriar a estrutura:

```bash
# Remover apps de exemplo do turborepo
rm -rf apps/docs apps/web

# Criar estrutura base
mkdir -p apps/web apps/api packages/db packages/shared
```

---

## 1.2 package.json raiz

```json
{
  "name": "soma-ai",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5",
    "@types/node": "^20"
  }
}
```

---

## 1.3 Criar app web (Next.js)

```bash
cd apps
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Instalar dependências do web

```bash
cd apps/web
npm install @soma-ai/db @soma-ai/shared
npm install next-auth @auth/mongodb-adapter
npm install lucide-react class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init
```

### shadcn/ui — componentes base para instalar

```bash
npx shadcn-ui@latest add button input label select textarea
npx shadcn-ui@latest add card badge table tabs dialog
npx shadcn-ui@latest add toast alert dropdown-menu
npx shadcn-ui@latest add calendar form switch
```

---

## 1.4 Criar app api (Fastify)

```bash
cd apps/api
npm init -y
```

```bash
npm install fastify @fastify/cors @fastify/jwt @fastify/multipart
npm install bullmq ioredis
npm install mongoose bcryptjs
npm install @soma-ai/db @soma-ai/shared
npm install -D typescript @types/node ts-node nodemon
```

### apps/api/src/server.ts

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { connectDB } from '@soma-ai/db'

const app = Fastify({ logger: true })

app.register(cors, { origin: process.env.APP_URL })
app.register(jwt, { secret: process.env.JWT_SECRET! })

// rotas
app.register(import('./routes/auth'), { prefix: '/api/auth' })
app.register(import('./routes/companies'), { prefix: '/api/companies' })
app.register(import('./routes/cards'), { prefix: '/api/cards' })
app.register(import('./routes/posts'), { prefix: '/api/posts' })

const start = async () => {
  await connectDB(process.env.MONGODB_URI!)
  await app.listen({ port: 3001, host: '0.0.0.0' })
}

start()
```

---

## 1.5 Criar package db (Mongoose)

```bash
cd packages/db
npm init -y
npm install mongoose
npm install -D typescript @types/mongoose
```

### packages/db/src/connection.ts

```typescript
import mongoose from 'mongoose'

let isConnected = false

export async function connectDB(uri: string) {
  if (isConnected) return
  await mongoose.connect(uri)
  isConnected = true
  console.log('MongoDB conectado')
}
```

### packages/db/package.json

```json
{
  "name": "@soma-ai/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

---

## 1.6 Criar package shared

```bash
cd packages/shared
npm init -y
npm install -D typescript
```

### packages/shared/src/enums/index.ts

```typescript
export enum CompanyStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  SETUP_PENDING = 'setup_pending',
  TRIAL = 'trial',
  CANCELLED = 'cancelled'
}

export enum CardStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  POSTED = 'posted',
  ARCHIVED = 'archived'
}

export enum PostStatus {
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum QueueStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum VideoStatus {
  QUEUED = 'queued',
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
  POSTED = 'posted'
}

export enum CardFormat {
  FEED_1X1 = 'feed_1x1',
  STORIES_9X16 = 'stories_9x16',
  REELS = 'reels',
  CAROUSEL = 'carousel'
}

export enum PostType {
  PROMOCAO = 'promocao',
  DICA = 'dica',
  NOVIDADE = 'novidade',
  INSTITUCIONAL = 'institucional',
  DATA_COMEMORATIVA = 'data_comemorativa'
}

export enum Niche {
  FARMACIA = 'farmacia',
  PET = 'pet',
  MODA = 'moda',
  COSMETICOS = 'cosmeticos',
  MERCEARIA = 'mercearia',
  CALCADOS = 'calcados',
  OUTRO = 'outro'
}

export enum BillingStatus {
  PAID = 'paid',
  PENDING = 'pending',
  OVERDUE = 'overdue'
}

export enum Plan {
  STARTER = 'starter',
  PRO = 'pro'
}
```

---

## 1.7 Docker Compose (dev)

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    container_name: soma-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: soma-ai

  redis:
    image: redis:7-alpine
    container_name: soma-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

```bash
# Subir banco e redis em background
docker-compose up -d mongo redis
```

---

## 1.8 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": [".next/**", "dist/**"]
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

---

## 1.9 Scripts de desenvolvimento

### .env (raiz, não commitar)

```bash
cp .env.example .env
# preencher as variáveis necessárias para dev
```

### Rodar tudo junto

```bash
# Terminal 1 — banco e redis
docker-compose up -d

# Terminal 2 — monorepo completo
pnpm dev

# Ou separado:
# Terminal 2 — API
cd apps/api && npx nodemon src/server.ts

# Terminal 3 — Web
cd apps/web && npm run dev
```

---

## Checklist da Etapa 1

- [ ] Monorepo criado com Turborepo
- [ ] Next.js rodando em `localhost:3000`
- [ ] Fastify rodando em `localhost:3001`
- [ ] MongoDB rodando via Docker em `localhost:27017`
- [ ] Redis rodando via Docker em `localhost:6379`
- [ ] packages/db conectando ao MongoDB
- [ ] packages/shared com enums e types base
- [ ] shadcn/ui instalado e configurado
- [ ] .env configurado

---

## Próxima etapa

→ `04_etapa2_company_panel.md` — Autenticação e painel da empresa
