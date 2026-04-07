# Soma.ai

> Sistema Operacional de Marketing Automatizado com IA

Marketing automatico para pequenas empresas. Voce atende, a Soma cuida das redes.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Fastify 5 + TypeScript |
| Banco de Dados | MongoDB (Mongoose) |
| Fila de Jobs | BullMQ + Redis |
| Monorepo | pnpm workspaces + Turborepo |
| Testes | Playwright (API + E2E + Mobile) |
| Deploy | Vercel (Frontend + API serverless) |
| Banco Producao | MongoDB Atlas |

---

## Arquitetura

```
soma-ai/
├── apps/
│   ├── api/             Fastify backend (porta 3001)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── routes/           16 arquivos de rotas
│   │   │   ├── services/         Meta, Evolution, Gemini, Encryption
│   │   │   ├── workers/          Post, Video, Campaign, Billing
│   │   │   ├── queues/           Post, Video, Billing
│   │   │   └── plugins/          Auth (JWT), Redis
│   │   └── seed.ts
│   └── web/             Next.js frontend (porta 3000)
│       └── src/
│           ├── app/
│           │   ├── login/            Autenticacao
│           │   ├── app/              Painel Empresa (11 paginas)
│           │   ├── admin/            Painel Admin (8 paginas)
│           │   └── api/[...path]/    Bridge Fastify (serverless)
│           ├── components/
│           │   ├── ui/               shadcn/ui (14 componentes)
│           │   ├── company/          MetricCard, PostItem, FeatureGate
│           │   └── admin/            StatusBadge, AlertItem
│           ├── lib/                  API client, utils
│           └── store/                Zustand (auth)
├── packages/
│   ├── db/              Mongoose models (20 collections)
│   └── shared/          Enums, Types, Constants
├── tests/e2e/           Playwright (6 arquivos de teste)
└── prompts/             Templates de IA
```

---

## Planos

| | Starter | Pro | Enterprise |
|---|---------|-----|------------|
| Setup | R$ 297 | R$ 497 | R$ 720 |
| Mensal | R$ 39,90 | R$ 69,90 | R$ 89,90 |
| Cards | Ilimitado | Ilimitado | Ilimitado |
| Instagram | Sim | Sim | Sim |
| Facebook | - | Sim | Sim |
| Videos | - | 2/dia | 5/dia |
| WhatsApp | - | Sim | Sim |
| Campanhas | - | Sim | Sim |
| Trafego Pago | - | - | Sim |
| Reconhecimento | - | - | Sim |

---

## Funcionalidades

### Painel da Empresa
- Dashboard com metricas e resumo
- Gerador de cards com IA (Gemini)
- Gerador de videos com IA
- Gerador de scripts/roteiros
- Agendamento de posts (Instagram/Facebook)
- Integracao WhatsApp (Evolution API)
- Campanhas de marketing (Meta Ads)
- Biblioteca de midias
- Calendario de datas comemorativas
- Configuracoes e integracoes

### Painel Admin
- Dashboard geral com alertas
- Gestao de empresas parceiras
- Financeiro (cobrancas, pagamentos)
- Configuracoes globais (planos, nichos)
- Health check de servicos
- Logs do sistema

---

## Requisitos

- **Node.js** >= 20
- **pnpm** >= 9
- **MongoDB** rodando em `localhost:27017`
- **Redis** rodando (default porta `6380`)
- **Docker** (opcional, para subir Redis/MongoDB)

---

## Setup Local

```bash
# 1. Clonar e instalar
git clone https://github.com/iss-qa/somai.git
cd somai
pnpm install

# 2. Configurar .env
cp .env.example .env

# 3. Subir Redis (se necessario)
docker run -d --name soma-redis -p 6380:6379 redis:7-alpine

# 4. Seed do banco
npx tsx apps/api/src/seed.ts

# 5. Rodar em dev
pnpm dev
```

Acesse:
- **Web:** http://localhost:3000
- **API:** http://localhost:3001

---

## Testes

```bash
pnpm test          # Todos os testes
pnpm test:api      # Testes da API (CRUD)
pnpm test:e2e      # Testes E2E (UI)
pnpm test:mobile   # Testes mobile
pnpm test:ui       # Playwright UI interativo
```

---

## Deploy

O projeto esta deployado na **Vercel** com frontend e backend no mesmo projeto.

- **Producao:** https://somai.issqa.com.br
- **Banco:** MongoDB Atlas
- **CI/CD:** Deploy automatico via push na branch `main`

---

## Licenca

Projeto privado - ISSQA.
