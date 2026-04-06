# Soma.ai — Etapa 3: Painel Admin

**Objetivo:** Isaias consegue gerenciar todas as empresas, cobranças, saúde do sistema e configurações globais.

**Estimativa:** 3–4 dias de trabalho

---

## 3.1 Layout Admin

Sidebar separada da company — rota `/admin/*`  
Acesso apenas com `role: 'superadmin'` no JWT

Navegação:
- Dashboard
- Saúde do Sistema
- Parceiros (listagem + cadastro + detalhe)
- Cobranças
- Logs de Postagem
- Planos
- Configurações Globais

---

## 3.2 Dashboard Admin

```
AdminDashboard
├── MetricCards (5)
│   ├── Parceiros ativos
│   ├── Receita mensal prevista
│   ├── Setup pendentes
│   ├── Inadimplentes
│   └── Posts publicados hoje / falhas
├── AlertsPanel             → itens que precisam de ação imediata
│   ├── Access blocked
│   ├── Token expirado
│   ├── Vencimento próximo
│   └── Setup aguardando config
└── StatusDistribution      → barra de progresso por status dos parceiros
```

**API:**
```
GET /api/admin/dashboard/summary
GET /api/admin/alerts
```

---

## 3.3 Gerenciamento de Parceiros

### Listagem — /admin/companies

Tabela com colunas:
- Empresa (ícone + nome + nicho/cidade)
- Plano
- Status
- Redes conectadas
- Setup
- Mensalidade
- Último post
- Ações

Ações por status:
| Status | Ações disponíveis |
|---|---|
| Ativo | Editar, Bloquear |
| Token expirado | Notificar, Editar |
| Bloqueado | Liberar, Cobrar |
| Vencimento próximo | Lembrar, Editar |
| Em configuração | Configurar, Ver |

### Detalhe / Edição — /admin/companies/[id]

3 colunas:
- Dados da empresa + contato
- Plano + status de acesso + billing
- Redes sociais + status do token

2 colunas abaixo:
- Configurações de postagem automática + horários semanais
- Últimos posts + chaves de API (BYOK)

**API:**
```
GET    /api/admin/companies
GET    /api/admin/companies/:id
PUT    /api/admin/companies/:id
POST   /api/admin/companies/:id/block
POST   /api/admin/companies/:id/unblock
POST   /api/admin/companies/:id/notify
```

### Novo Parceiro — /admin/companies/new

Formulário de cadastro:
- Dados da empresa
- Plano + valores
- Setup pago? → controla acesso_enabled
- Dia de vencimento
- Configurações iniciais de postagem
- Observações internas

Ao salvar: gera user + envia link de acesso por WhatsApp (via Evolution)

---

## 3.4 Financeiro — /admin/financial

Métricas:
- Receita prevista do mês
- Receita recebida
- Total de setups cobrados
- Valor em inadimplência

Tabela por parceiro:
- Plano + valor
- Status do setup
- Mensalidade + vencimento + dias em atraso
- Situação (badge)
- Ações: Cobrar / Lembrar / Confirmar pagamento / Recibo

**API:**
```
GET  /api/admin/financial/summary
GET  /api/admin/financial/billing
POST /api/admin/financial/billing/:id/confirm
POST /api/admin/financial/billing/:id/notify
```

---

## 3.5 Saúde do Sistema — /admin/health

4 cards:
- Status dos serviços de infra (Fastify, MongoDB, Redis, Evolution, R2)
- Integrações Meta por empresa (token ok/expirado/desconectado)
- Fila de agendamento — próximos jobs
- Log de falhas recentes

**API:**
```
GET /api/admin/health/services
GET /api/admin/health/integrations
GET /api/admin/health/queue
GET /api/admin/health/errors
POST /api/admin/health/check-all
```

---

## 3.6 Logs de Postagem — /admin/logs

Tabela filtrável:
- Data/hora, empresa, tipo, formato, redes, status, detalhe do erro

Filtros: status + empresa + plataforma + período

Exportar CSV

**API:**
```
GET /api/admin/posts?company_id=&status=&platform=&from=&to=&page=
GET /api/admin/posts/export.csv
```

---

## Checklist Etapa 3

- [ ] Login admin separado (rota /admin/login)
- [ ] Dashboard com métricas e alertas reais
- [ ] Listagem de parceiros com filtros
- [ ] Detalhe/edição completo do parceiro
- [ ] Cadastro de novo parceiro
- [ ] Bloquear/liberar acesso funcional
- [ ] Painel financeiro com ações de cobrança
- [ ] Saúde do sistema em tempo real
- [ ] Logs de postagem com filtros e export

---
---

# Soma.ai — Etapa 4: Integrações

**Objetivo:** Meta Graph API multi-tenant e Evolution API funcionando para todas as empresas.

**Estimativa:** 3–4 dias de trabalho

---

## 4.1 Meta Graph API — multi-tenant

Cada empresa tem seu próprio token. O fluxo é:

1. Admin envia link de autorização por WhatsApp para o cliente
2. Cliente abre o link, faz login no Facebook e autoriza o app
3. Callback chega em `/api/webhooks/meta/callback?company_id=xxx`
4. Backend troca o code pelo token de curta duração
5. Troca por token de longa duração (60 dias)
6. Salva criptografado na collection `integrations`

### services/meta.service.ts — métodos principais

```typescript
// Publicar imagem no feed do Instagram
publishInstagramFeed(companyId: string, imageUrl: string, caption: string): Promise<string>

// Publicar story no Instagram
publishInstagramStory(companyId: string, mediaUrl: string): Promise<string>

// Publicar no Facebook
publishFacebookPost(companyId: string, imageUrl: string, message: string): Promise<string>

// Verificar se token ainda é válido
verifyToken(companyId: string): Promise<{ valid: boolean, expires_at: Date }>

// Renovar token (se possível)
refreshToken(companyId: string): Promise<void>

// Buscar métricas de um post
fetchPostAnalytics(companyId: string, postId: string): Promise<Analytics>
```

### Criptografia dos tokens

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Usar AES-256-GCM
// ENCRYPTION_KEY = 32 bytes aleatórios no .env
export function encrypt(text: string): string { ... }
export function decrypt(encrypted: string): string { ... }
```

---

## 4.2 Evolution API — WhatsApp

Cada empresa tem uma instância própria no Evolution.

### services/evolution.service.ts

```typescript
// Criar instância para nova empresa
createInstance(instanceName: string): Promise<void>

// Enviar mídia (card/vídeo) para número
sendMedia(instanceName: string, number: string, mediaUrl: string, caption: string): Promise<void>

// Enviar texto
sendText(instanceName: string, number: string, text: string): Promise<void>

// Verificar status da instância
getStatus(instanceName: string): Promise<'open' | 'close' | 'connecting'>
```

Padrão de nome de instância: `soma_[company_slug]`  
Ex: `soma_farmacia_central`

---

## 4.3 Webhooks

### /api/webhooks/meta/callback

Recebe o código OAuth após autorização do cliente e completa a conexão.

### /api/webhooks/evolution

Recebe eventos de status das instâncias WhatsApp (conexão, desconexão).

---

## Checklist Etapa 4

- [ ] Meta OAuth flow completo
- [ ] Token salvo criptografado no MongoDB
- [ ] Publicação no Instagram (feed + story) funcionando
- [ ] Publicação no Facebook funcionando
- [ ] Verificação de token com alerta automático
- [ ] Evolution: criar instância por empresa
- [ ] Evolution: envio de mídia funcionando
- [ ] Webhook Meta callback funcionando
- [ ] Webhook Evolution status funcionando

---
---

# Soma.ai — Etapa 5: Scheduler e Automação

**Objetivo:** Posts publicando automaticamente nos horários configurados, com retry em caso de falha.

**Estimativa:** 2–3 dias de trabalho

---

## 5.1 Filas BullMQ

### queues/post.queue.ts

```typescript
import { Queue } from 'bullmq'
import { redisConnection } from '../plugins/redis'

export const postQueue = new Queue('post-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 * 60 * 5 } // 5min entre retries
  }
})
```

### Tipos de jobs

| Queue | Trigger | Função |
|---|---|---|
| `post-queue` | horário agendado | publica post na Meta API |
| `video-queue` | aprovação de vídeo | gera vídeo com Gemini/FFmpeg |
| `analytics-queue` | 2h após publicação | coleta métricas do post |
| `billing-queue` | cron diário 06:00 | verifica inadimplência e bloqueia |
| `token-check-queue` | cron diário 08:00 | verifica tokens expirando em < 7 dias |

---

## 5.2 Post Worker

### workers/post.worker.ts

```typescript
import { Worker, Job } from 'bullmq'
import { MetaService } from '../services/meta.service'
import { PostQueue, Post } from '@soma-ai/db'

new Worker('post-queue', async (job: Job) => {
  const { queueId, companyId, cardId, platforms, caption, hashtags, postType } = job.data

  // 1. Verificar se empresa ainda tem acesso
  const company = await Company.findById(companyId)
  if (!company?.access_enabled) throw new Error('ACCESS_DISABLED')

  // 2. Verificar token
  const valid = await MetaService.verifyToken(companyId)
  if (!valid) throw new Error('TOKEN_INVALID')

  // 3. Buscar URL da imagem
  const card = await Card.findById(cardId)
  const imageUrl = card.generated_image_url

  const postIds: Record<string, string> = {}

  // 4. Publicar nas plataformas selecionadas
  if (platforms.includes('instagram')) {
    postIds.instagram = await MetaService.publishInstagramFeed(companyId, imageUrl, `${caption}\n\n${hashtags.join(' ')}`)
  }
  if (platforms.includes('facebook')) {
    postIds.facebook = await MetaService.publishFacebookPost(companyId, imageUrl, caption)
  }

  // 5. Registrar post bem-sucedido
  await Post.create({
    company_id: companyId,
    queue_id: queueId,
    card_id: cardId,
    platforms,
    caption,
    hashtags,
    status: 'published',
    published_at: new Date(),
    instagram_post_id: postIds.instagram,
    facebook_post_id: postIds.facebook
  })

  // 6. Atualizar status do card
  await Card.findByIdAndUpdate(cardId, { status: 'posted' })
  await PostQueue.findByIdAndUpdate(queueId, { status: 'done' })

  // 7. Enfileirar coleta de analytics para daqui 2h
  await analyticsQueue.add('fetch', { postId: ..., companyId }, { delay: 1000 * 60 * 120 })

}, { connection: redisConnection })

// Handler de falha
.on('failed', async (job, error) => {
  await Post.create({ ...job.data, status: 'failed', error_message: error.message })
  await Notification.create({
    target: 'admin',
    type: 'post_failed',
    company_id: job.data.companyId,
    message: `Post falhou: ${error.message}`
  })
})
```

---

## 5.3 Billing Worker (cron diário)

```typescript
// Roda todo dia às 06:00
schedule.every().day().at('06:00').do(async () => {
  const companies = await Company.find({ status: 'active' })

  for (const company of companies) {
    const overdueDays = differenceInDays(new Date(), company.billing.next_due_at)

    if (overdueDays >= 30 && company.access_enabled) {
      await Company.findByIdAndUpdate(company._id, {
        access_enabled: false,
        status: 'blocked',
        'billing.overdue_days': overdueDays,
        'billing.status': 'overdue'
      })
      // Cancelar jobs pendentes na fila
      await cancelPendingJobsForCompany(company._id)
      // Notificar
      await sendBlockNotification(company)
    }

    if (overdueDays >= 5 && overdueDays < 30) {
      await sendPaymentReminderNotification(company)
    }
  }
})
```

---

## Checklist Etapa 5

- [ ] BullMQ configurado com Redis
- [ ] post.worker publicando posts no Instagram e Facebook
- [ ] Retry automático em caso de falha (3 tentativas)
- [ ] billing.worker rodando diariamente
- [ ] Bloqueio automático após 30 dias de inadimplência
- [ ] Lembrete automático de vencimento
- [ ] analytics.worker coletando métricas após publicação
- [ ] token-check.worker alertando tokens próximos do vencimento

---
---

# Soma.ai — Etapa 6: Gerador de Vídeos

**Objetivo:** Empresas Pro geram vídeos animados de produto usando sua chave Gemini (BYOK).

**Estimativa:** 4–5 dias de trabalho

---

## 6.1 Fluxo do usuário

1. Usuário acessa "Vídeos" → clica em "Novo Vídeo"
2. Preenche: nome do produto, imagens, preço (original + promo), texto extra
3. Opcional: seleciona card existente como base
4. Clica em "Gerar com Gemini"
5. Job entra na fila — tela mostra progress bar
6. Vídeo pronto → usuário assiste, baixa ou agenda

---

## 6.2 Gemini Service

```typescript
// Gerar script/roteiro para o vídeo
async generateVideoScript(params: {
  companyName: string,
  niche: string,
  productName: string,
  priceOriginal: number,
  pricePromo: number,
  extraText: string,
  geminiApiKey: string  // chave do cliente
}): Promise<VideoScript>
```

---

## 6.3 Video Worker

```typescript
// 1. Chamar Gemini para gerar roteiro
// 2. Baixar imagens do produto
// 3. Usar Remotion ou FFmpeg para:
//    - montar slides animados com imagens
//    - sobrepor textos com animação
//    - adicionar logo da empresa
//    - gerar áudio TTS (opcional)
// 4. Exportar MP4
// 5. Upload para R2
// 6. Atualizar video.status = 'ready'
// 7. Notificar usuário
```

---

## Checklist Etapa 6

- [ ] Tela de geração de vídeos no painel Company
- [ ] Verificação de chave Gemini configurada
- [ ] Integração com Gemini API para roteiro
- [ ] Video worker com FFmpeg/Remotion
- [ ] Upload do vídeo para R2
- [ ] Download do vídeo pelo usuário
- [ ] Agendamento do vídeo no calendário
- [ ] Limite de 2 vídeos/dia por empresa (plano Pro)

---
---

# Soma.ai — Etapa 7: Financeiro e Controle de Acesso

**Objetivo:** Controle completo de setup, mensalidades e bloqueio automático.

**Estimativa:** 1–2 dias de trabalho

---

## 7.1 Regras de negócio

| Evento | Ação automática |
|---|---|
| Setup não pago | `access_enabled: false` desde o cadastro |
| Admin confirma setup | `access_enabled: true`, `setup_paid: true` |
| Mensalidade vence em 5 dias | Notificação + WhatsApp de lembrete |
| Mensalidade vence em 2 dias | Segunda notificação |
| 30 dias sem pagamento | Bloqueio automático + pausa dos jobs |
| Admin confirma pagamento | Desbloqueio manual + next_due_at recalculado |

## 7.2 API de billing

```
GET  /api/admin/billing                    → resumo financeiro
PUT  /api/admin/billing/:id/confirm        → confirmar pagamento
POST /api/admin/billing/:id/send-reminder  → enviar cobrança manual
GET  /api/admin/billing/:id/receipt        → gerar recibo PDF
```

---

## Checklist Etapa 7

- [ ] Bloqueio automático por inadimplência
- [ ] Confirmação manual de pagamento pelo admin
- [ ] Notificação de vencimento automática
- [ ] WhatsApp de cobrança via Evolution
- [ ] Histórico de pagamentos por empresa
- [ ] Geração de recibo simples (PDF ou texto)

---
---

# Soma.ai — Etapa 8: Deploy e Produção

**Objetivo:** Aplicação rodando em VPS com domínio, SSL e monitoramento básico.

**Estimativa:** 1–2 dias de trabalho

---

## 8.1 Infraestrutura recomendada

| Serviço | Opção | Custo estimado |
|---|---|---|
| VPS | Hetzner CX22 (4 vCPU, 8GB) | ~€5–10/mês |
| Banco | MongoDB Atlas M0 (free) ou self-hosted | Grátis / incluído na VPS |
| Storage | Cloudflare R2 | ~$0,015/GB/mês |
| Domínio .ai | Registrar + DNS Cloudflare | ~$50/ano |
| SSL | Caddy (automático) | Grátis |

---

## 8.2 docker-compose.prod.yml

```yaml
version: '3.8'
services:
  web:
    build: ./apps/web
    environment:
      - NODE_ENV=production
    restart: always

  api:
    build: ./apps/api
    environment:
      - NODE_ENV=production
    restart: always
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  caddy:
    image: caddy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: always

volumes:
  mongo_data:
  redis_data:
  caddy_data:
```

## 8.3 Caddyfile

```
soma.ai {
  reverse_proxy web:3000
}

api.soma.ai {
  reverse_proxy api:3001
}
```

---

## 8.4 Checklist Etapa 8

- [ ] VPS provisionada
- [ ] Docker Compose prod funcionando
- [ ] Domínio soma.ai apontando para VPS
- [ ] SSL automático via Caddy
- [ ] MongoDB com backup automático configurado
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Pipeline CI/CD básico (GitHub Actions)
- [ ] Monitoramento de uptime (UptimeRobot - grátis)
- [ ] Alertas de erro por WhatsApp/email para o admin
