# Sistema de Postagem Automatica no Instagram/Facebook

## Documento Tecnico Completo para Implementacao

Este documento detalha como foi desenvolvido o sistema de criacao de conteudo com IA e publicacao automatica no Instagram e Facebook, incluindo toda a configuracao necessaria, formatos de imagem, integracao com a Graph API, e o fluxo completo de agendamento e publicacao.

---

## 1. Visao Geral da Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Frontend       │────>│   Backend API    │────>│  Facebook Graph API │
│   (React)        │     │   (NestJS)       │     │  (Instagram)        │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                              │       │
                              │       └──────────> Claude AI (Anthropic)
                              │
                              ├──────────> MongoDB (dados)
                              ├──────────> Redis (filas)
                              └──────────> Evolution API (WhatsApp alertas)
```

### Fluxo Principal

1. **Gerar conteudo** — Claude AI cria headline, texto, hashtags e esquema de cores
2. **Gerar imagem** — SVG montado programaticamente e convertido para PNG via WASM
3. **Aprovar card** — Usuario revisa e aprova o card gerado
4. **Agendar publicacao** — Escolhe data, hora, plataforma (Feed, Story, Facebook)
5. **Cron publica** — A cada 60 segundos, um cron verifica posts pendentes
6. **Instagram Graph API** — Cria media container, aguarda processamento, publica
7. **Alertas WhatsApp** — Notifica sucesso ou falha via WhatsApp automaticamente

---

## 2. Banco de Dados (MongoDB)

### Colecao: `marketing_cards`

Armazena os cards gerados pela IA.

```javascript
{
  _id: ObjectId,
  name: String,                    // Nome dado pelo usuario ao aprovar
  format: String,                  // 'feed_square' | 'story_reels' | 'feed_landscape'
  theme: String,                   // Tema do conteudo (ver enum abaixo)
  tone: String,                    // 'descontraido' | 'profissional' | 'motivacional' | 'educativo'
  palette: String,                 // 'juntix_verde' | 'escuro_premium' | 'vibrante_tropical' | 'minimalista_clean'
  headline: String,                // Titulo principal (obrigatorio)
  subheadline: String,             // Subtitulo
  bodyText: String,                // Texto do corpo (obrigatorio)
  ctaText: String,                 // Texto do botao CTA
  hashtags: [String],              // Array de hashtags
  colorScheme: {
    primary: String,               // Cor hex
    secondary: String,
    background: String,
    text: String,
    accent: String
  },
  includeLogo: Boolean,            // default: true
  includeCTA: Boolean,             // default: true
  status: String,                  // 'draft' | 'approved' | 'scheduled' | 'published' | 'failed'
  imageUrl: String,                // URL publica da imagem PNG gerada
  customPrompt: String,            // Prompt personalizado do usuario
  createdBy: ObjectId,             // Ref para usuario
  createdAt: Date,
  updatedAt: Date
}
```

### Colecao: `marketing_schedule`

Controla os agendamentos de publicacao.

```javascript
{
  _id: ObjectId,
  cardId: ObjectId,                // Ref para marketing_cards (obrigatorio)
  platform: String,                // 'instagram_feed' | 'instagram_story' | 'facebook_feed'
  scheduledAt: Date,               // Data/hora agendada (obrigatorio)
  caption: String,                 // Legenda da postagem
  hashtags: [String],              // Hashtags
  status: String,                  // 'scheduled' | 'published' | 'failed' | 'cancelled'
  publishedAt: Date,               // Quando foi publicado
  errorMessage: String,            // Mensagem de erro se falhou
  instagramMediaId: String,        // ID retornado pela Graph API
  createdAt: Date,
  updatedAt: Date
}
```

### Colecao: `marketing_integration`

Documento unico que armazena credenciais do Instagram/Facebook.

```javascript
{
  _id: ObjectId,
  instagramAccessToken: String,          // Page Access Token (nao expira)
  instagramBusinessAccountId: String,    // ID da conta Business do Instagram
  facebookPageId: String,                // ID da pagina do Facebook
  isConnected: Boolean,                  // default: false
  connectedPageName: String,             // "@username" da conta conectada
  autoPostEnabled: Boolean,              // default: false
  maxPostsPerDay: Number,                // default: 3
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Enums e Constantes

### Formatos de Imagem

| Formato | Dimensoes | Uso |
|---------|-----------|-----|
| `feed_square` | 1080 x 1080 px | Post quadrado no feed |
| `story_reels` | 1080 x 1920 px | Story ou Reels |
| `feed_landscape` | 1080 x 566 px | Post paisagem no feed |

### Temas de Conteudo

```
o_que_e_juntix         — Explica o produto
vantagens_participantes — Beneficios para participantes
beneficios_admins       — Beneficios para administradores
recrutar_admins         — Recrutamento de admins
depoimento              — Depoimento/testemunho
passo_a_passo           — Tutorial em passos
seguranca               — Seguranca e confianca
cta                     — Call to action direto
personalizado           — Prompt livre do usuario
```

### Paletas de Cores

```javascript
const PALETAS = {
  juntix_verde:       { bg1: '#22c55e', bg2: '#059669', text: '#ffffff', accent: '#facc15', accentText: '#14532d' },
  escuro_premium:     { bg1: '#1e293b', bg2: '#0f172a', text: '#f1f5f9', accent: '#22d3ee', accentText: '#0f172a' },
  vibrante_tropical:  { bg1: '#fb923c', bg2: '#06b6d4', text: '#ffffff', accent: '#fde047', accentText: '#9a3412' },
  minimalista_clean:  { bg1: '#f8fafc', bg2: '#e2e8f0', text: '#1e293b', accent: '#1e293b', accentText: '#ffffff' },
};
```

### Plataformas

```
instagram_feed   — Post no feed do Instagram
instagram_story  — Story do Instagram
facebook_feed    — Post na pagina do Facebook
```

---

## 4. Geracao de Imagem (SVG → PNG)

### Pipeline

O sistema gera imagens programaticamente, sem depender de templates estaticos ou ferramentas externas.

```
Dados do Card → Montar SVG → Converter para PNG (WASM) → Salvar no disco → URL publica
```

### Dependencia

```bash
npm install @resvg/resvg-js
```

O `@resvg/resvg-js` usa WebAssembly (WASM) para renderizar SVG em PNG. Nao requer dependencias nativas como `sharp`, `canvas`, ou `puppeteer`.

### Implementacao Completa

```typescript
import * as path from 'path';
import * as fs from 'fs';

// Paletas de cores
const PALETTE_COLORS = {
  juntix_verde:      { bg1: '#22c55e', bg2: '#059669', text: '#ffffff', accent: '#facc15', accentText: '#14532d' },
  escuro_premium:    { bg1: '#1e293b', bg2: '#0f172a', text: '#f1f5f9', accent: '#22d3ee', accentText: '#0f172a' },
  vibrante_tropical: { bg1: '#fb923c', bg2: '#06b6d4', text: '#ffffff', accent: '#fde047', accentText: '#9a3412' },
  minimalista_clean: { bg1: '#f8fafc', bg2: '#e2e8f0', text: '#1e293b', accent: '#1e293b', accentText: '#ffffff' },
};

interface CardData {
  headline: string;
  subheadline?: string;
  bodyText: string;
  ctaText?: string;
  palette: string;
  includeLogo?: boolean;
  includeCTA?: boolean;
  format?: string;   // 'feed_square' | 'story_reels' | 'feed_landscape'
}

// Escapa caracteres especiais para XML/SVG
function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Quebra texto em linhas respeitando largura maxima
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

export async function generateCardImage(card: CardData): Promise<string> {
  const pal = PALETTE_COLORS[card.palette] || PALETTE_COLORS.juntix_verde;

  // Dimensoes por formato
  let width = 1080, height = 1080;
  if (card.format === 'story_reels') { width = 1080; height = 1920; }
  else if (card.format === 'feed_landscape') { width = 1080; height = 566; }

  const isStory = card.format === 'story_reels';

  // Tamanhos de fonte adaptados ao formato
  const headlineFontSize = isStory ? 52 : 46;
  const subFontSize = isStory ? 28 : 24;
  const bodyFontSize = isStory ? 24 : 20;
  const ctaFontSize = 22;
  const padding = 80;
  const lineHeight = 1.35;

  // Quebrar textos em linhas
  const headlineLines = wrapText(escapeXml(card.headline), isStory ? 22 : 26);
  const subLines = card.subheadline ? wrapText(escapeXml(card.subheadline), isStory ? 30 : 36) : [];
  const bodyLines = wrapText(escapeXml(card.bodyText), isStory ? 32 : 40);

  // Calcular posicao Y inicial (centralizado verticalmente)
  const totalHeight = headlineLines.length * headlineFontSize * lineHeight
    + (subLines.length > 0 ? subLines.length * subFontSize * lineHeight + 20 : 0)
    + bodyLines.length * bodyFontSize * lineHeight;
  let y = Math.max(padding + 80, (height - totalHeight) / 2);
  let content = '';

  // Logo (opcional)
  if (card.includeLogo !== false) {
    content += `<rect x="${padding}" y="${padding}" width="48" height="48" rx="12" fill="rgba(255,255,255,0.2)"/>`;
    content += `<text x="${padding + 24}" y="${padding + 30}" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${pal.text}" text-anchor="middle">JX</text>`;
    content += `<text x="${padding + 60}" y="${padding + 32}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${pal.text}">Juntix</text>`;
  }

  // Headline
  for (const line of headlineLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${pal.text}">${line}</text>`;
    y += headlineFontSize * lineHeight;
  }
  y += 10;

  // Subheadline
  for (const line of subLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,sans-serif" font-size="${subFontSize}" fill="${pal.text}" opacity="0.85">${line}</text>`;
    y += subFontSize * lineHeight;
  }
  if (subLines.length) y += 10;

  // Body
  for (const line of bodyLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,sans-serif" font-size="${bodyFontSize}" fill="${pal.text}" opacity="0.75">${line}</text>`;
    y += bodyFontSize * lineHeight;
  }

  // Botao CTA
  if (card.includeCTA !== false && card.ctaText) {
    y += 30;
    const ct = escapeXml(card.ctaText);
    const ctaWidth = ct.length * ctaFontSize * 0.55 + 50;
    content += `<rect x="${padding}" y="${y - 8}" width="${ctaWidth}" height="48" rx="24" fill="${pal.accent}"/>`;
    content += `<text x="${padding + ctaWidth / 2}" y="${y + 22}" font-family="Arial,sans-serif" font-size="${ctaFontSize}" font-weight="bold" fill="${pal.accentText}" text-anchor="middle">${ct}</text>`;
  }

  // Montar SVG completo
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${pal.bg1}"/>
        <stop offset="100%" style="stop-color:${pal.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    ${content}
  </svg>`;

  // Garantir que diretorio existe
  const uploadsDir = path.join(process.cwd(), 'uploads', 'marketing');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Converter SVG → PNG usando resvg (WASM)
  const filename = `card-${Date.now()}.png`;
  const filepath = path.join(uploadsDir, filename);

  const { Resvg } = require('@resvg/resvg-js');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(filepath, pngBuffer);

  return filename;
}
```

### Servindo as Imagens

O NestJS serve os arquivos estaticos via `ServeStaticModule`:

```typescript
// app.module.ts
ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), 'uploads'),
  serveRoot: '/api/uploads',
})
```

**IMPORTANTE sobre proxy reverso (Nginx):** Se o Nginx ja adiciona `/api` no proxy_pass, a URL publica deve ser SEM `/api`:

```
// Se Nginx faz: api.example.com/* → localhost:3000/api/*
// Entao a URL publica deve ser:
https://api.example.com/uploads/marketing/card-123.png
// Que o Nginx converte para:
localhost:3000/api/uploads/marketing/card-123.png  ← ServeStaticModule responde
```

---

## 5. Integracao com Instagram Graph API

### Pre-requisitos

1. **Facebook App** criada em https://developers.facebook.com
2. **Pagina do Facebook** vinculada a uma conta Instagram Business/Creator
3. **Permissoes necessarias:**
   - `pages_show_list` — listar paginas
   - `pages_read_engagement` — ler dados da pagina
   - `business_management` — gerenciar conta business
   - `instagram_basic` — acesso basico ao IG
   - `instagram_content_publish` — publicar conteudo

### Fluxo OAuth Completo

```
Usuario clica "Conectar Facebook"
        │
        ▼
Redirect para Facebook Login:
  https://www.facebook.com/v25.0/dialog/oauth?
    client_id={APP_ID}
    &redirect_uri={REDIRECT_URI}
    &scope=pages_show_list,pages_read_engagement,business_management
    &response_type=code
        │
        ▼ (usuario autoriza)
Facebook redireciona de volta com ?code={CODE}
        │
        ▼
Backend troca code por token curto:
  POST https://graph.facebook.com/v25.0/oauth/access_token
  Body: { client_id, client_secret, redirect_uri, code }
  Response: { access_token: "SHORT_LIVED_TOKEN", expires_in: 3600 }
        │
        ▼
Backend troca token curto por token longo (~60 dias):
  POST https://graph.facebook.com/v25.0/oauth/access_token
  Body: { grant_type: 'fb_exchange_token', client_id, client_secret, fb_exchange_token: SHORT_TOKEN }
  Response: { access_token: "LONG_LIVED_TOKEN", expires_in: 5184000 }
        │
        ▼
Backend busca paginas do usuario:
  GET https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token={LONG_TOKEN}
  Response: { data: [{ id: "PAGE_ID", name: "Page Name", access_token: "PAGE_TOKEN" }] }
  NOTA: O PAGE_TOKEN nao expira! Ele e o token que sera usado para publicar.
        │
        ▼
Backend busca conta Instagram Business vinculada a pagina:
  GET https://graph.facebook.com/v25.0/{PAGE_ID}?fields=instagram_business_account&access_token={PAGE_TOKEN}
  Response: { instagram_business_account: { id: "IG_BUSINESS_ID" } }
        │
        ▼
Backend busca username do Instagram:
  GET https://graph.facebook.com/v25.0/{IG_BUSINESS_ID}?fields=username,name&access_token={PAGE_TOKEN}
  Response: { username: "juntix_caixa", name: "Juntix" }
        │
        ▼
Salva no banco (marketing_integration):
  {
    instagramAccessToken: PAGE_TOKEN,       ← Esse token NAO expira
    instagramBusinessAccountId: IG_BUSINESS_ID,
    facebookPageId: PAGE_ID,
    isConnected: true,
    connectedPageName: "@juntix_caixa"
  }
```

### Publicacao no Instagram (3 etapas)

A publicacao no Instagram via Graph API e assincrona e requer 3 etapas:

#### Etapa 1: Criar Media Container

```
POST https://graph.facebook.com/v21.0/{IG_BUSINESS_ID}/media
Content-Type: application/json

Body (Feed):
{
  "image_url": "https://example.com/uploads/marketing/card-123.png",
  "caption": "Texto da legenda\n\n#hashtag1 #hashtag2",
  "access_token": "PAGE_TOKEN"
}

Body (Story):
{
  "image_url": "https://example.com/uploads/marketing/card-123.png",
  "media_type": "STORIES",
  "access_token": "PAGE_TOKEN"
}
// NOTA: Stories NAO suportam caption

Response: { "id": "CONTAINER_ID" }
```

**Requisitos da imagem:**
- URL deve ser **publica** (Instagram faz download da URL)
- Formato: JPEG ou PNG
- Tamanho minimo: 150x150 px
- Tamanho maximo: 8MB
- Nao aceita: SVG, WebP, GIF, data: URLs, URLs localhost

#### Etapa 2: Aguardar Processamento (Polling)

O Instagram precisa de tempo para processar a imagem. E obrigatorio fazer polling antes de publicar.

```
GET https://graph.facebook.com/v21.0/{CONTAINER_ID}
  ?fields=status_code,status
  &access_token={PAGE_TOKEN}

Response:
  { "status_code": "IN_PROGRESS" }   ← Ainda processando
  { "status_code": "FINISHED" }       ← Pronto para publicar
  { "status_code": "ERROR", "status": "erro descritivo" }  ← Falhou
```

**Implementacao do polling:**
```typescript
// Polling a cada 2 segundos, maximo 30 tentativas (60 segundos)
let mediaReady = false;
for (let attempt = 0; attempt < 30; attempt++) {
  await new Promise(r => setTimeout(r, 2000));  // espera 2s

  const statusUrl = `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${token}`;
  const response = await fetch(statusUrl);
  const data = await response.json();

  if (data.status_code === 'FINISHED') {
    mediaReady = true;
    break;
  }
  if (data.status_code === 'ERROR') {
    throw new Error(`Container falhou: ${data.status}`);
  }
  // IN_PROGRESS → continua aguardando
}

if (!mediaReady) {
  throw new Error('Timeout: media container nao ficou pronto apos 60s');
}
```

**POR QUE O POLLING E NECESSARIO:**
Sem o polling, ao tentar publicar imediatamente, a API retorna o erro:
`"Media ID is not available"` — porque o container ainda esta em IN_PROGRESS.

#### Etapa 3: Publicar

```
POST https://graph.facebook.com/v21.0/{IG_BUSINESS_ID}/media_publish
Content-Type: application/json

Body:
{
  "creation_id": "CONTAINER_ID",
  "access_token": "PAGE_TOKEN"
}

Response: { "id": "PUBLISHED_MEDIA_ID" }
```

### Publicacao no Facebook Page (1 etapa)

A publicacao no Facebook e mais simples — uma unica chamada:

```
POST https://graph.facebook.com/v21.0/{PAGE_ID}/photos
Content-Type: application/json

Body:
{
  "url": "https://example.com/uploads/marketing/card-123.png",
  "message": "Texto da legenda\n\n#hashtag1 #hashtag2",
  "access_token": "PAGE_TOKEN"
}

Response: { "id": "PHOTO_ID", "post_id": "POST_ID" }
```

---

## 6. Geracao de Conteudo com IA (Claude)

### Chamada a API da Anthropic

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  }),
});
```

### System Prompt (resumo)

O prompt posiciona a IA como social media manager para fintech brasileira:

- Escrever em portugues brasileiro coloquial
- Tom acessivel, sem jargoes financeiros
- Incluir emojis estrategicamente
- Respeitar limites de caracteres do Instagram
- Retornar JSON estruturado com: headline, subheadline, bodyText, ctaText, hashtags, colorScheme

### User Prompt (estrutura)

```
Gere um card de marketing para Instagram no formato {format}.
Tema: {theme}
Tom: {tone}
Paleta de cores: {palette}
{customPrompt se tema = personalizado}

Retorne um JSON com:
- headline (max 60 caracteres)
- subheadline (max 100 caracteres)
- bodyText (max 200 caracteres)
- ctaText (max 25 caracteres)
- hashtags (array de 5 hashtags relevantes)
- colorScheme (objeto com primary, secondary, background, text, accent)
```

### Geracao de Legenda

Endpoint separado para gerar legenda otimizada para Instagram:

```typescript
// POST /marketing/generate-caption
// Body: { cardId: string }
// Response: { caption: string, hashtags: string[] }
```

A legenda e gerada considerando:
- Headline e corpo do card
- Tom definido
- Melhores praticas do Instagram (emojis, CTA, quebras de linha)
- 5 hashtags relevantes

---

## 7. Cron Job de Publicacao Automatica

### Configuracao

```typescript
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MarketingPublisherCron {
  @Cron('* * * * *')  // Executa a cada 60 segundos
  async publishDuePosts() {
    const now = new Date();

    // Buscar posts agendados que ja passaram do horario
    const duePosts = await this.scheduleModel
      .find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      })
      .limit(5)  // Maximo 5 por execucao (evitar sobrecarga)
      .exec();

    for (const post of duePosts) {
      try {
        await this.marketingService.publishPost(post._id.toString());
        // Sucesso: status → 'published', publishedAt = now
      } catch (error) {
        // Falha: status → 'failed', errorMessage = error.message
        // Alerta WhatsApp enviado automaticamente
      }
    }
  }
}
```

### Dependencia

```bash
npm install @nestjs/schedule
```

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ...
  ],
})
```

### Throughput

- 5 posts por execucao × 60 execucoes/hora = 300 posts/hora maximo
- Instagram tem rate limit de ~25 posts/dia por conta

---

## 8. Sistema de Alertas WhatsApp

### Alerta de Falha na Publicacao

Quando uma publicacao falha, o sistema envia automaticamente um alerta via WhatsApp:

```
🚨 *ALERTA — Falha na Publicacao de Marketing*

📅 Data/Hora do alerta: 31/03/2026, 14:14:07
📱 Plataforma: instagram_story
🕐 Agendado para: 31/03/2026, 14:14:00
📝 Card: Junte seus amigos e comece a poupar...

❌ *Erro:* Publicar: Media ID is not available

Acesse o painel de Marketing em /painel-master/marketing para retentar a publicacao.
```

### Alerta de Sucesso

```
📣 *Comunicacao Marketing Juntix*

📅 31/03/2026, 14:20:00
📌 *Publicacao realizada com sucesso*

Post publicado no instagram_story. Media ID: 17934509...
```

### Implementacao

Usa a Evolution API (gateway WhatsApp) para enviar mensagens:

```typescript
class MarketingAlertService {
  private readonly ALERT_NUMBERS = ['5571996838735', '557135990522'];

  async alertPublishFailure(data) {
    const message = `🚨 *ALERTA — Falha...*\n\n📱 Plataforma: ${data.platform}\n❌ *Erro:* ${data.errorMessage}`;

    for (const phone of this.ALERT_NUMBERS) {
      await this.evolutionApi.sendTextMessage(phone, message);
    }
  }
}
```

---

## 9. Resolucao de Imagem para Publicacao

O sistema tem uma logica robusta de resolucao de imagem:

```
1. Verificar card.imageUrl
   ├── Se data: URL (base64) → descartar
   ├── Se localhost URL → descartar
   └── Se URL publica → validar acessibilidade (HEAD request)
                          ├── Acessivel e content-type: image/* → USAR
                          └── Inacessivel → descartar

2. Se nenhuma URL valida:
   └── Gerar imagem server-side via resvg (SVG → PNG)
       ├── Sucesso → usar URL publica gerada
       └── Falha → ir para fallback

3. Fallback final:
   └── Usar imagem padrao (ex: logo da empresa)

4. Validacao final obrigatoria:
   └── HEAD request na URL final
       ├── HTTP 200 + content-type: image/* → prosseguir
       └── Falha → abortar publicacao com erro claro
```

---

## 10. Variaveis de Ambiente

### Backend (.env)

```env
# Banco de dados
MONGODB_URI=mongodb+srv://user:password@host/database

# Servidor
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.example.com

# Claude AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Facebook/Instagram OAuth
FB_CLIENT_ID=1234567890
FB_CLIENT_SECRET=abc123def456
FB_REDIRECT_URI=https://example.com/callback

# WhatsApp (Evolution API)
EVOLUTION_BASE_URL=https://evo.example.com
EVOLUTION_INSTANCE_NAME=INSTANCE_NAME
EVOLUTION_API_KEY=your-api-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Frontend (.env)

```env
VITE_API_URL=https://api.example.com
VITE_FACEBOOK_APP_ID=1234567890
```

---

## 11. Endpoints da API (Resumo)

### Cards

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/marketing/generate-card` | Gerar card via IA |
| GET | `/marketing/cards` | Listar cards |
| GET | `/marketing/cards/:id` | Buscar card por ID |
| PATCH | `/marketing/cards/:id/status` | Atualizar status do card |
| DELETE | `/marketing/cards/:id` | Deletar card |

### Agendamento

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/marketing/schedule` | Agendar publicacao |
| GET | `/marketing/schedule` | Listar agendamentos |
| PATCH | `/marketing/schedule/:id/cancel` | Cancelar agendamento |
| POST | `/marketing/schedule/:id/retry` | Retentar publicacao |
| POST | `/marketing/schedule/:id/publish` | Publicar manualmente |

### Integracao

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/marketing/integration` | Buscar config de integracao |
| PUT | `/marketing/integration` | Salvar credenciais |
| POST | `/marketing/integration/test` | Testar conexao |
| POST | `/marketing/integration/facebook-callback` | Trocar code OAuth por tokens |

### Outros

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/marketing/generate-caption` | Gerar legenda com IA |
| POST | `/marketing/upload-image` | Upload de imagem (multipart) |

---

## 12. Erros Comuns e Solucoes

### "Only photo or video can be accepted as media type"

**Causa:** Instagram nao conseguiu acessar ou reconhecer a imagem na URL.
**Solucao:**
- Verificar se a URL e publica (nao localhost, nao data:)
- Verificar se retorna content-type: image/png ou image/jpeg
- Verificar se nao ha proxy/CDN bloqueando
- Verificar se nao ha duplicacao de path (/api/api/)

### "Media ID is not available"

**Causa:** Tentou publicar antes do Instagram processar a imagem.
**Solucao:** Implementar polling do status_code do container (Etapa 2 acima).

### "Invalid OAuth access token"

**Causa:** Token expirado ou invalido.
**Solucao:**
- Page tokens nao expiram — verificar se o token esta correto
- User tokens expiram em ~60 dias — reconectar via OAuth

### "The image could not be downloaded"

**Causa:** Instagram nao conseguiu baixar a imagem na URL.
**Solucao:**
- Garantir que a URL e HTTPS
- Verificar se o servidor responde rapido (<5s)
- Verificar se a imagem tem menos de 8MB

---

## 13. Checklist de Implementacao

### Setup Inicial
- [ ] Criar Facebook App em developers.facebook.com
- [ ] Configurar permissoes: pages_show_list, pages_read_engagement, business_management, instagram_content_publish
- [ ] Vincular Pagina Facebook a conta Instagram Business
- [ ] Obter FB_CLIENT_ID e FB_CLIENT_SECRET
- [ ] Configurar ANTHROPIC_API_KEY

### Backend
- [ ] Instalar dependencias: @resvg/resvg-js, @nestjs/schedule
- [ ] Criar schemas MongoDB (cards, schedule, integration)
- [ ] Implementar geracao de imagem SVG → PNG
- [ ] Implementar OAuth flow (troca de tokens)
- [ ] Implementar publicacao com polling (3 etapas)
- [ ] Implementar cron job (a cada minuto)
- [ ] Configurar ServeStaticModule para servir imagens
- [ ] Implementar sistema de alertas

### Frontend
- [ ] Tela de geracao de cards (formulario + preview)
- [ ] Tela de calendario (agendamento)
- [ ] Tela de postagens (listagem + retry)
- [ ] Tela de integracoes (OAuth + config manual)
- [ ] Upload de imagem com html2canvas

### Infra
- [ ] Servidor com HTTPS (obrigatorio para OAuth e Graph API)
- [ ] Nginx como proxy reverso
- [ ] MongoDB (local ou Atlas)
- [ ] PM2 para gerenciamento de processos
- [ ] Diretorio uploads/ com permissao de escrita

---

**Documento gerado em:** 31/03/2026
**Baseado na implementacao do Juntix** (https://juntix.com.br)
