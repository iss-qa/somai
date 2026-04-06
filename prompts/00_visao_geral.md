# Soma.ai — Visão Geral do Projeto

> **Sistema Operacional de Marketing Automatizado com IA**  
> Marketing automático para pequenas empresas. Você atende, a Soma cuida das redes.

---

## O que é

Soma.ai é um SaaS B2B de marketing digital automatizado voltado para pequenas empresas de bairro (farmácias, pet shops, lojas de moda, cosméticos, mercearias, etc.) que não têm equipe, tempo ou conhecimento para gerenciar redes sociais.

O produto gera cards, vídeos e roteiros com IA, agenda e publica automaticamente no Instagram e Facebook, e envia conteúdo via WhatsApp — tudo com o mínimo de ação do usuário.

---

## Dois painéis

| Painel | Usuário | Função |
|---|---|---|
| **Company Panel** | Dono da empresa parceira | Gerar conteúdo, aprovar, agendar, acompanhar |
| **Admin Panel** | Isaias (operador Soma.ai) | Gerenciar clientes, cobranças, saúde do sistema |

---

## Planos

| | Starter | Pro |
|---|---|---|
| Setup (único) | R$ 297 | R$ 497 |
| Mensalidade | R$ 39,90 | R$ 69,90 |
| Gerador de cards | ✅ ilimitado | ✅ ilimitado |
| Calendário e agendamento | ✅ | ✅ |
| Instagram | ✅ | ✅ |
| Facebook | ❌ | ✅ |
| Gerador de vídeos (BYOK Gemini) | ❌ | ✅ 2/dia |
| Roteiros de comunicação | ❌ | ✅ |
| WhatsApp (envio ao próprio número) | ❌ | ✅ |
| Campanhas temáticas | ❌ | ✅ |
| Sugestão de pauta por data comemorativa | ❌ | ✅ |

---

## Stack tecnológica

```
Frontend     → Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
Backend      → Node.js + Fastify
Scheduler    → BullMQ + Redis
Banco        → MongoDB (Mongoose) — localhost em dev, Atlas em prod
Automação    → Meta Graph API (Instagram + Facebook)
WhatsApp     → Evolution API
Vídeo IA     → Gemini API (chave do cliente — BYOK)
Imagem IA    → DALL-E ou Ideogram (opcional BYOK)
Storage      → Cloudflare R2 (logos, mídias, cards gerados)
Infra        → Docker Compose (dev) → VPS em prod
Monorepo     → estrutura apps/ + packages/
```

---

## Estrutura de pastas

```
soma-ai/
├── apps/
│   ├── web/                  → Next.js — painéis company e admin
│   └── api/                  → Fastify — scheduler, webhooks, jobs
├── packages/
│   ├── db/                   → Mongoose schemas e conexão
│   └── shared/               → Types, utils, constantes, enums
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Etapas do projeto

| Etapa | Conteúdo | Arquivo |
|---|---|---|
| 00 | Visão geral (este arquivo) | `00_visao_geral.md` |
| 01 | Banco de dados — collections MongoDB | `01_banco_de_dados.md` |
| 02 | Arquitetura técnica e fluxos | `02_arquitetura.md` |
| 03 | Setup inicial do monorepo | `03_etapa1_setup.md` |
| 04 | Painel Company — MVP | `04_etapa2_company_panel.md` |
| 05 | Painel Admin | `05_etapa3_admin_panel.md` |
| 06 | Integrações (Meta Graph + Evolution) | `06_etapa4_integracoes.md` |
| 07 | Scheduler e automação de posts | `07_etapa5_scheduler.md` |
| 08 | Gerador de vídeos + Gemini | `08_etapa6_videos.md` |
| 09 | Financeiro e controle de acesso | `09_etapa7_financeiro.md` |
| 10 | Deploy e produção | `10_etapa8_deploy.md` |
