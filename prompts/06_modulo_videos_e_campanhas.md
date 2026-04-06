# Soma.ai — Modulo de Videos e Campanhas

> Prompt completo para implementacao do Gerador de Videos com IA e do Modulo de Campanhas simplificadas para Meta Ads e Google Ads.

---

## Parte 1: Gerador de Videos

### 1.1 Visao Geral

O gerador de videos permite que empresas parceiras criem videos curtos (Reels, TikTok, YouTube Shorts) a partir de cards ja criados na plataforma ou do zero. O video pode ser gerado por IA via Gemini API (ate 2 videos gratuitos por dia no plano Pro) ou montado com templates pre-definidos usando Remotion/FFmpeg.

**Restricao de plano:** Apenas plano Pro tem acesso (`features.video_generation: true`).

---

### 1.2 Fluxo do Usuario

```
1. Acessa "Videos" → clica em "Novo Video"
2. Escolhe a origem:
   ├── "Usar Card" → seleciona card existente (aprovado) como base
   └── "Criar do zero" → preenche dados manualmente
3. Configura o video:
   ├── Template (tipo de video)
   ├── Duracao aproximada
   ├── Conteudo dos slides (cards ou texto livre)
   ├── Narracao (texto → voz)
   ├── Voz (feminino / masculino / neutro)
   ├── Velocidade da fala (lenta / normal / rapida)
   ├── Trilha de fundo (opcional)
   ├── Paleta de cores
   ├── Link do site (aparece no video, nao e narrado)
   ├── Legenda automatica (sincronizada) ou texto livre
   └── Imagens adicionais (upload)
4. Clica em "Gerar Video"
5. Job entra na fila → tela mostra progress bar com status em tempo real
6. Video pronto → Preview no player embutido
7. Acoes: Assistir, Baixar, Agendar publicacao, Usar em campanha
```

---

### 1.3 Templates Pre-definidos

| Template | Descricao | Slides | Uso ideal |
|----------|-----------|--------|-----------|
| `dica_rapida` | 1 card + narracao curta + CTA | 1 | Dica rapida, novidade, promocao relampago |
| `passo_a_passo` | 3 cards sequenciais com transicao | 3 | Tutorial, como usar, receita |
| `beneficio_destaque` | Estatistica + texto + CTA | 1-2 | Destaque de beneficio, numero impactante |
| `depoimento` | Texto de depoimento + CTA | 1 | Prova social, avaliacao de cliente |
| `comparativo` | Antes/depois ou com/sem | 2 | Comparacao de preco, resultado |
| `lancamento` | Countdown + reveal + CTA | 3-4 | Produto novo, colecao nova |

Cada template define:
- Numero e ordem dos slides
- Duracoes por slide
- Tipo de animacao/transicao
- Posicionamento de texto e imagem
- Onde entra a narracao
- Onde aparece o CTA

---

### 1.4 Configuracoes do Video

#### Duracao aproximada
```
5s | 10s | 15s | 20s | 30s
```
A IA ajusta o roteiro e a velocidade da narracao para encaixar na duracao escolhida.

#### Voz (Text-to-Speech)
```
feminino | masculino | neutro
```
Usar Google Cloud TTS ou ElevenLabs (BYOK). Se nenhuma chave configurada, usar API gratuita do Google TTS.

#### Velocidade da fala
```
lenta (0.8x) | normal (1.0x) | rapida (1.2x)
```

#### Trilha de fundo
```
nenhuma | upbeat | calma | motivacional | corporativa
```
Musicas royalty-free pre-carregadas no R2. Volume automaticamente reduzido durante narracao.

#### Paleta de cores (reutiliza as paletas do sistema de cards)
```
juntix_verde   → { bg1: '#22c55e', bg2: '#059669', text: '#fff', accent: '#facc15' }
escuro_premium → { bg1: '#1e293b', bg2: '#0f172a', text: '#f1f5f9', accent: '#22d3ee' }
vibrante_tropical → { bg1: '#fb923c', bg2: '#06b6d4', text: '#fff', accent: '#fde047' }
minimalista_clean → { bg1: '#f8fafc', bg2: '#e2e8f0', text: '#1e293b', accent: '#1e293b' }
```
Empresa tambem pode definir paleta personalizada baseada nas cores da marca.

#### Link do site
Texto que aparece discretamente no rodape do video (ex: `farmaciacentral.com.br`). Nao e narrado.

---

### 1.5 Sistema de Legendas

#### Legenda automatica (padrao)
- IA gera o texto da legenda baseado na narracao
- Legenda sincronizada com o audio (word-by-word ou frase-por-frase)
- Estilo: texto branco com sombra, posicionado na parte inferior
- Suporta customizacao de fonte, cor e posicao

#### Legenda livre
- Usuario escreve o texto manualmente
- Sistema sincroniza automaticamente com a duracao do video
- Divide o texto em segmentos proporcionais ao tempo total

#### Sem legenda
- Opcao de desativar completamente

**Implementacao tecnica da sincronizacao:**
```typescript
interface SubtitleSegment {
  text: string          // Texto do segmento
  start_ms: number      // Inicio em milissegundos
  end_ms: number        // Fim em milissegundos
  words?: {             // Sincronizacao por palavra (opcional)
    word: string
    start_ms: number
    end_ms: number
  }[]
}
```

---

### 1.6 Geracao com Gemini API

#### Fluxo tecnico

```
1. Montar prompt com contexto do video:
   - Nicho da empresa
   - Template selecionado
   - Dados do card (se baseado em card)
   - Duracao alvo
   - Tom de voz
   
2. Gemini gera:
   - Roteiro de narracao (texto)
   - Sugestao de transicoes
   - Timing por slide
   - Texto das legendas com timestamps

3. Se empresa tem chave Gemini propria (BYOK):
   → Usar chave do cliente
   → Limite: features.videos_per_day (padrao 2)

4. Se nao tem chave propria:
   → Usar chave master da Soma.ai
   → Cobrar do credito da empresa ou limitar

5. Video pode ser gerado 100% pela Gemini (Veo):
   → POST para gerar video direto via Gemini API
   → Ate 2 videos/dia gratuitamente
   → Retorna URL do video gerado
```

#### Gemini Video Generation (Veo)

```typescript
// services/gemini-video.service.ts

interface GeminiVideoParams {
  prompt: string           // Descricao do video a gerar
  duration: number         // Duracao em segundos (5-30)
  aspectRatio: '9:16' | '16:9' | '1:1'  // Formato
  companyNiche: string
  productName?: string
  narrationText?: string
}

async function generateVideoWithGemini(params: GeminiVideoParams, apiKey: string): Promise<{
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
}> {
  // 1. Chamar Gemini API para gerar video
  // 2. Polling ate video estar pronto
  // 3. Download e upload para R2
  // 4. Retornar URLs
}
```

#### Geracao com Remotion (fallback / templates)

Para videos baseados em templates (sem Gemini), usar Remotion para composicao programatica:

```typescript
// workers/video.worker.ts

async function generateVideoFromTemplate(params: {
  template: string
  slides: SlideData[]
  narrationAudioUrl: string
  backgroundMusicUrl?: string
  subtitles: SubtitleSegment[]
  palette: PaletteColors
  duration: number
  companyLogo?: string
  siteLink?: string
}): Promise<string> {
  // 1. Gerar audio TTS da narracao
  // 2. Renderizar video com Remotion
  //    - Montar slides com animacoes do template
  //    - Sobrepor legendas sincronizadas
  //    - Mixar audio (narracao + trilha)
  //    - Adicionar logo e link
  // 3. Exportar MP4 (1080x1920 para Reels)
  // 4. Upload para R2
  // 5. Gerar thumbnail (frame do meio)
  // 6. Retornar URL
}
```

---

### 1.7 Atualizacao do Schema — videos (MongoDB)

O schema atual ja tem boa base. Campos adicionais necessarios:

```javascript
// Adicionar ao VideoSchema existente:
{
  // ... campos existentes ...
  
  // Configuracao do video
  template: String,              // 'dica_rapida' | 'passo_a_passo' | etc.
  target_duration: Number,       // Duracao alvo em segundos (5, 10, 15, 20, 30)
  aspect_ratio: String,          // '9:16' | '16:9' | '1:1' — default '9:16'
  
  // Narracao
  narration_text: String,        // Texto da narracao
  voice_type: String,            // 'feminino' | 'masculino' | 'neutro'
  voice_speed: Number,           // 0.8 | 1.0 | 1.2
  narration_audio_url: String,   // URL do audio TTS gerado
  
  // Trilha
  background_music: String,      // 'nenhuma' | 'upbeat' | 'calma' | etc.
  
  // Visual
  palette: String,               // 'juntix_verde' | 'escuro_premium' | etc.
  site_link: String,             // Link que aparece no video
  company_logo_url: String,      // Logo da empresa no video
  
  // Legendas
  subtitle_mode: String,         // 'auto' | 'manual' | 'off'
  subtitle_text: String,         // Texto livre (se modo manual)
  subtitles: [{                  // Legendas sincronizadas
    text: String,
    start_ms: Number,
    end_ms: Number
  }],
  
  // Slides
  slides: [{
    order: Number,
    type: String,                // 'card' | 'text' | 'image'
    card_id: ObjectId,           // Ref para Card (se type = 'card')
    text: String,                // Texto do slide (se type = 'text')
    image_url: String,           // Imagem do slide
    duration_ms: Number          // Duracao do slide
  }],
  
  // Metadados de geracao
  generation_method: String,     // 'gemini_veo' | 'remotion' | 'ffmpeg'
  gemini_model_used: String,     // Modelo usado (se Gemini)
}
```

---

### 1.8 API — Endpoints de Video

```
GET    /api/videos                    → Listar videos (com paginacao e filtros)
GET    /api/videos/:id                → Buscar video por ID
POST   /api/videos/generate           → Criar e enfileirar geracao de video
POST   /api/videos/generate-narration → Gerar texto de narracao com IA
POST   /api/videos/generate-subtitles → Gerar legendas sincronizadas
PATCH  /api/videos/:id                → Atualizar dados do video
DELETE /api/videos/:id                → Deletar video
GET    /api/videos/:id/status         → Polling de status (SSE ou WebSocket)
POST   /api/videos/:id/download       → Gerar link de download temporario
```

#### POST /api/videos/generate — Body

```typescript
{
  title: string                     // Titulo do video
  template: string                  // Template selecionado
  target_duration: number           // Duracao alvo (5-30s)
  aspect_ratio?: string             // Default '9:16'
  source_card_id?: string           // Card base (opcional)
  
  // Conteudo
  slides?: {
    type: 'card' | 'text' | 'image'
    card_id?: string
    text?: string
    image_url?: string
  }[]
  
  // Narracao
  narration_text?: string           // Texto para narrar
  voice_type?: string               // 'feminino' | 'masculino' | 'neutro'
  voice_speed?: number              // 0.8 | 1.0 | 1.2
  
  // Visual
  palette?: string
  background_music?: string
  site_link?: string
  
  // Legendas
  subtitle_mode?: string            // 'auto' | 'manual' | 'off'
  subtitle_text?: string            // Se modo = 'manual'
  
  // Imagens adicionais
  product_images?: string[]
  
  // Geracao
  use_gemini_veo?: boolean          // Gerar 100% por IA
}
```

---

### 1.9 Tela — Gerador de Video (Frontend)

Layout dividido em 3 colunas:

```
┌─────────────────────┬──────────────────────┬─────────────────┐
│   Configuracao      │      Preview         │     Acoes       │
│                     │                      │                 │
│ Template            │  ┌──────────────┐    │  Ultimos Videos │
│ [Dica Rapida]       │  │              │    │                 │
│ [Passo a Passo]     │  │   Player     │    │  (lista)        │
│ [Beneficio]         │  │   Preview    │    │                 │
│ [Depoimento]        │  │   do Video   │    │                 │
│                     │  │              │    │                 │
│ Duracao aprox.      │  │   9:16       │    │                 │
│ [5s][10s][15s][20s] │  │              │    │                 │
│                     │  └──────────────┘    │                 │
│ Conteudo dos slides │  0.0s          15s   │                 │
│ [Usar Cards]        │  > Play  ↻ Resetar   │                 │
│ [Texto Livre]       │                      │                 │
│                     │                      │                 │
│ Cards (0/3)         │                      │                 │
│ □ Card 1            │                      │                 │
│ □ Card 2            │                      │                 │
│ □ Card 3            │                      │                 │
│                     │                      │                 │
│ Imagens             │                      │                 │
│ [Upload de imagens] │                      │                 │
│                     │                      │                 │
│ Narracao     0/150  │                      │                 │
│ [textarea]          │                      │                 │
│ ✨ Sugerir com IA   │                      │                 │
│ 🔊 Ouvir            │                      │                 │
│                     │                      │                 │
│ Link do site        │                      │                 │
│ [empresa.com.br]    │                      │                 │
│                     │                      │                 │
│ Voz        Velocid. │                      │                 │
│ [Fem][Masc][Neutro] │                      │                 │
│ [Lenta][Normal][Rap]│                      │                 │
│                     │                      │                 │
│ Trilha de Fundo     │                      │                 │
│ [v Nenhuma]         │                      │                 │
│                     │                      │                 │
│ Paleta de Cores     │                      │                 │
│ [●●○ Juntix Verde]  │                      │                 │
│ [●●● Escuro Prem.]  │                      │                 │
│ [●●○ Vibr. Tropical]│                      │                 │
│ [○●○ Minim. Clean]  │                      │                 │
│                     │                      │                 │
│ ☑ Legenda autom.    │                      │                 │
│   Exibir texto      │                      │                 │
│   sincronizado      │                      │                 │
│                     │                      │                 │
│ [🎬 Gerar Video]    │                      │                 │
└─────────────────────┴──────────────────────┴─────────────────┘
```

#### Componentes React necessarios

```
app/app/videos/
├── page.tsx                    → Listagem de videos (ja existe, evoluir)
├── generate/
│   └── page.tsx                → Pagina de geracao
├── [id]/
│   └── page.tsx                → Detalhe/preview do video
└── components/
    ├── VideoGenerator.tsx      → Container principal do gerador
    ├── TemplateSelector.tsx    → Grid de templates
    ├── DurationPicker.tsx      → Botoes de duracao
    ├── SlideManager.tsx        → Gerenciador de slides (cards ou texto)
    ├── CardSelector.tsx        → Modal para selecionar cards existentes
    ├── NarrationInput.tsx      → Textarea + sugerir com IA + ouvir
    ├── VoiceConfig.tsx         → Voz + velocidade
    ├── MusicSelector.tsx       → Dropdown de trilhas
    ├── PaletteSelector.tsx     → Grid de paletas (reutilizar do cards)
    ├── SubtitleConfig.tsx      → Config de legenda
    ├── VideoPreview.tsx        → Player de preview
    ├── VideoProgress.tsx       → Barra de progresso da geracao
    └── RecentVideos.tsx        → Lista lateral de videos recentes
```

---

### 1.10 Video Worker (BullMQ)

```typescript
// queues/video.queue.ts
export const videoQueue = new Queue('video-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 * 60 * 2 }
  }
})

// workers/video.worker.ts
new Worker('video-queue', async (job: Job) => {
  const { videoId, companyId } = job.data

  // 1. Buscar video e empresa
  const video = await Video.findById(videoId)
  const company = await Company.findById(companyId)
  
  // 2. Verificar acesso
  if (!company?.access_enabled) throw new Error('ACCESS_DISABLED')

  // 3. Atualizar status para 'generating'
  await Video.findByIdAndUpdate(videoId, { status: 'generating' })

  // 4. Verificar metodo de geracao
  if (video.use_gemini_veo) {
    // 4a. Gerar com Gemini Veo
    const apiKey = await getGeminiKey(companyId) // BYOK ou master
    const result = await generateVideoWithGemini({
      prompt: buildVideoPrompt(video, company),
      duration: video.target_duration,
      aspectRatio: video.aspect_ratio || '9:16',
      companyNiche: company.niche
    }, apiKey)
    
    await Video.findByIdAndUpdate(videoId, {
      video_url: result.videoUrl,
      thumbnail_url: result.thumbnailUrl,
      duration_seconds: result.durationSeconds,
      status: 'ready',
      generation_method: 'gemini_veo'
    })
  } else {
    // 4b. Gerar com Remotion/FFmpeg (template-based)
    
    // 4b.1 Gerar audio TTS da narracao
    let narrationAudioUrl = ''
    if (video.narration_text) {
      narrationAudioUrl = await generateTTS({
        text: video.narration_text,
        voice: video.voice_type || 'feminino',
        speed: video.voice_speed || 1.0
      })
    }

    // 4b.2 Gerar legendas sincronizadas
    let subtitles = video.subtitles || []
    if (video.subtitle_mode === 'auto' && video.narration_text) {
      subtitles = await generateSyncedSubtitles(
        video.narration_text,
        narrationAudioUrl,
        video.target_duration * 1000
      )
    }

    // 4b.3 Renderizar video
    const videoUrl = await renderVideoWithRemotion({
      template: video.template,
      slides: video.slides,
      narrationAudioUrl,
      backgroundMusicUrl: getMusicUrl(video.background_music),
      subtitles,
      palette: getPaletteColors(video.palette),
      duration: video.target_duration,
      companyLogo: company.logo_url,
      siteLink: video.site_link
    })

    // 4b.4 Gerar thumbnail
    const thumbnailUrl = await generateThumbnail(videoUrl)

    // 4b.5 Upload para R2
    const r2VideoUrl = await uploadToR2(videoUrl, `videos/${companyId}/${videoId}.mp4`)
    const r2ThumbUrl = await uploadToR2(thumbnailUrl, `videos/${companyId}/${videoId}-thumb.jpg`)

    await Video.findByIdAndUpdate(videoId, {
      video_url: r2VideoUrl,
      thumbnail_url: r2ThumbUrl,
      narration_audio_url: narrationAudioUrl,
      subtitles,
      duration_seconds: video.target_duration,
      status: 'ready',
      generation_method: 'remotion'
    })
  }

  // 5. Notificar usuario
  await Notification.create({
    target: 'company',
    company_id: companyId,
    type: 'video_ready',
    message: `Seu video "${video.title}" esta pronto!`
  })

}, { connection: redisConnection })
```

---

### 1.11 Limites e Regras

| Regra | Valor |
|-------|-------|
| Videos por dia (Gemini Veo gratis) | 2 |
| Videos por dia (template Remotion) | Ilimitado no Pro |
| Duracao maxima | 30 segundos |
| Formatos de saida | MP4 (H.264) |
| Resolucao | 1080x1920 (9:16), 1920x1080 (16:9), 1080x1080 (1:1) |
| Tamanho maximo do arquivo | 50MB |
| Narracao maxima | 150 caracteres |
| Imagens por video | Ate 5 |

---

### 1.12 Checklist do Modulo de Videos

- [ ] Atualizar schema Video no `packages/db` com novos campos
- [ ] Criar enum `VideoTemplate` no `packages/shared`
- [ ] Criar enum `VoiceType`, `VoiceSpeed`, `SubtitleMode` no shared
- [ ] Implementar `POST /api/videos/generate` com novos campos
- [ ] Implementar `POST /api/videos/generate-narration` (Gemini → texto de narracao)
- [ ] Implementar `POST /api/videos/generate-subtitles` (sincronizacao)
- [ ] Implementar `GET /api/videos/:id/status` (SSE para progress)
- [ ] Implementar service `gemini-video.service.ts` para geracao via Veo
- [ ] Implementar service `tts.service.ts` para Text-to-Speech
- [ ] Implementar service `subtitle.service.ts` para sincronizacao de legendas
- [ ] Configurar Remotion para renderizacao de templates
- [ ] Criar templates Remotion para cada tipo (dica_rapida, passo_a_passo, etc.)
- [ ] Implementar video.worker.ts com BullMQ
- [ ] Upload de videos para R2
- [ ] Frontend: pagina de geracao com todas as configuracoes
- [ ] Frontend: preview em tempo real (player embutido)
- [ ] Frontend: modal de selecao de cards
- [ ] Frontend: ouvir preview da narracao TTS
- [ ] Frontend: progress bar durante geracao
- [ ] Frontend: pagina de detalhe/download do video
- [ ] Atualizar listagem de videos existente com novos dados
- [ ] Controle de limite de videos por dia por empresa
- [ ] Musicas royalty-free pre-carregadas no R2

---
---

## Parte 2: Modulo de Campanhas

### 2.1 Visao Geral

O modulo de campanhas permite que empresas parceiras criem e gerenciem campanhas de marketing digital de forma simplificada. O diferencial e a integracao direta com Meta Ads (Facebook/Instagram Ads) e Google Ads, usando os cards e videos ja criados na plataforma como criativos da campanha.

O objetivo e abstrair a complexidade das plataformas de anuncios, oferecendo uma interface simplificada onde o usuario:
1. Seleciona o conteudo (card + video)
2. Define o publico e orcamento
3. Publica a campanha diretamente nas plataformas de ads

**Restricao de plano:** Apenas plano Pro tem acesso (`features.campaigns: true`).

---

### 2.2 O que e uma Campanha no contexto do Soma.ai

Uma campanha agrupa:
- **Cards** → usados como criativos estaticos (imagem do anuncio)
- **Videos** → usados como criativos em video (Reels Ads, Video Ads)
- **Roteiros** → texto das legendas/copy dos anuncios
- **Objetivo** → o que a empresa quer alcançar
- **Publico** → quem deve ver o anuncio
- **Orcamento** → quanto investir e por quanto tempo
- **Plataformas** → onde veicular (Meta Ads, Google Ads)

---

### 2.3 Tipos de Campanha

| Tipo | Objetivo | Plataformas | Criativos |
|------|----------|-------------|-----------|
| `awareness` | Reconhecimento de marca | Meta Ads, Google Ads | Card (imagem) ou Video |
| `traffic` | Levar pessoas ao site/WhatsApp | Meta Ads, Google Ads | Card + link |
| `engagement` | Curtidas, comentarios, compartilhamentos | Meta Ads | Card ou Video |
| `leads` | Capturar contatos (formulario) | Meta Ads, Google Ads | Card + formulario |
| `sales` | Vendas diretas / conversao | Meta Ads, Google Ads | Card ou Video + link |
| `messages` | Iniciar conversa no WhatsApp/Messenger | Meta Ads | Card + botao |
| `local_store` | Visitas a loja fisica | Meta Ads, Google Ads | Card + mapa |

---

### 2.4 Fluxo Simplificado de Criacao de Campanha

O fluxo e um wizard de 5 etapas:

```
Etapa 1: Objetivo e Conteudo
├── Selecionar objetivo da campanha
├── Nome da campanha
├── Selecionar cards existentes (1-5)
├── Selecionar videos existentes (0-3)
└── IA sugere copy/legenda baseada no conteudo

Etapa 2: Publico-Alvo
├── Localizacao (cidade, raio em km)
├── Faixa etaria (18-65+)
├── Genero (todos, masculino, feminino)
├── Interesses (sugeridos pela IA com base no nicho)
│   Ex: farmacia → "saude", "bem-estar", "remedios", "beleza"
│   Ex: pet → "animais de estimacao", "pet shop", "racao"
└── Publico personalizado (opcional — lista de clientes)

Etapa 3: Orcamento e Duracao
├── Orcamento diario (minimo R$ 6,00 para Meta Ads)
├── Duracao da campanha (3, 7, 14, 30 dias ou personalizado)
├── Data de inicio (agora ou agendar)
├── Estimativa de alcance (calculado via API)
└── Estimativa de custo total

Etapa 4: Plataformas e Posicionamentos
├── Meta Ads
│   ├── Feed do Instagram
│   ├── Stories do Instagram
│   ├── Reels do Instagram
│   ├── Feed do Facebook
│   ├── Stories do Facebook
│   └── Audience Network
├── Google Ads
│   ├── Pesquisa (texto)
│   ├── Display (banner/imagem)
│   ├── YouTube (video)
│   └── Discovery
└── Posicionamento automatico (recomendado)

Etapa 5: Revisao e Publicacao
├── Preview dos anuncios em cada posicionamento
├── Resumo de orcamento e publico
├── Termos e condicoes
└── [Publicar Campanha]
```

---

### 2.5 Integracao com Meta Ads (Marketing API)

#### Pre-requisitos
- Facebook App com acesso a Marketing API
- Permissoes: `ads_management`, `ads_read`, `business_management`
- Conta de anuncios (Ad Account) vinculada

#### Fluxo tecnico

```
1. Empresa conecta conta de anuncios:
   OAuth → obter token com scope ads_management
   → Listar ad accounts do usuario
   → Empresa seleciona qual ad account usar
   → Salvar ad_account_id na collection integrations

2. Criar campanha no Meta Ads:
   POST /act_{ad_account_id}/campaigns
   Body: {
     name: "Campanha Soma - {nome}",
     objective: "OUTCOME_TRAFFIC",  // mapeado do tipo
     status: "PAUSED",              // iniciar pausada
     special_ad_categories: []
   }

3. Criar ad set (conjunto de anuncios):
   POST /act_{ad_account_id}/adsets
   Body: {
     campaign_id: "{campaign_id}",
     name: "Conjunto - {nome}",
     billing_event: "IMPRESSIONS",
     optimization_goal: "LINK_CLICKS",
     daily_budget: 600,            // em centavos (R$ 6,00)
     start_time: "2026-04-10",
     end_time: "2026-04-17",
     targeting: {
       geo_locations: {
         cities: [{ key: "2513109", radius: 10, distance_unit: "kilometer" }]
       },
       age_min: 25,
       age_max: 55,
       genders: [0],               // 0 = todos
       interests: [{ id: "6003139266461", name: "Pets" }]
     },
     status: "PAUSED"
   }

4. Fazer upload do criativo (card/video):
   POST /act_{ad_account_id}/adimages     → para imagens
   POST /act_{ad_account_id}/advideos     → para videos

5. Criar ad creative:
   POST /act_{ad_account_id}/adcreatives
   Body: {
     name: "Criativo - {card.headline}",
     object_story_spec: {
       page_id: "{facebook_page_id}",
       link_data: {
         image_hash: "{hash_da_imagem}",
         link: "https://wa.me/5571999999999",
         message: "{caption}",
         call_to_action: {
           type: "LEARN_MORE",
           value: { link: "https://wa.me/..." }
         }
       }
     }
   }

6. Criar ad (anuncio):
   POST /act_{ad_account_id}/ads
   Body: {
     adset_id: "{adset_id}",
     creative: { creative_id: "{creative_id}" },
     name: "Anuncio - {titulo}",
     status: "PAUSED"
   }

7. Ativar campanha:
   POST /{campaign_id}
   Body: { status: "ACTIVE" }
   POST /{adset_id}
   Body: { status: "ACTIVE" }
   POST /{ad_id}
   Body: { status: "ACTIVE" }
```

#### Mapeamento de objetivos Soma → Meta Ads

| Soma.ai | Meta Ads Objective |
|---------|-------------------|
| `awareness` | `OUTCOME_AWARENESS` |
| `traffic` | `OUTCOME_TRAFFIC` |
| `engagement` | `OUTCOME_ENGAGEMENT` |
| `leads` | `OUTCOME_LEADS` |
| `sales` | `OUTCOME_SALES` |
| `messages` | `OUTCOME_ENGAGEMENT` (com destination = WHATSAPP) |
| `local_store` | `OUTCOME_AWARENESS` (com local awareness) |

---

### 2.6 Integracao com Google Ads

#### Pre-requisitos
- Google Ads Developer Token
- OAuth2 com scope `https://www.googleapis.com/auth/adwords`
- Google Ads Customer ID vinculado

#### Fluxo tecnico (simplificado)

```
1. Empresa conecta conta Google Ads:
   OAuth → obter refresh_token
   → Listar customer accounts
   → Salvar customer_id na collection integrations

2. Criar campanha:
   POST /customers/{customer_id}/campaigns:mutate
   → Tipo: SEARCH, DISPLAY, VIDEO, DISCOVERY

3. Criar grupo de anuncios:
   POST /customers/{customer_id}/adGroups:mutate

4. Upload de assets (imagens/videos):
   POST /customers/{customer_id}/assets:mutate

5. Criar anuncio:
   POST /customers/{customer_id}/ads:mutate
   → Responsive Display Ad (para imagens)
   → Video Ad (para YouTube)

6. Configurar targeting:
   POST /customers/{customer_id}/adGroupCriteria:mutate
   → Location, Age, Gender, Keywords, Topics
```

---

### 2.7 Acompanhamento de Campanha

Dashboard da campanha com metricas em tempo real:

```
┌──────────────────────────────────────────────────────────┐
│  Campanha: "Promocao de Inverno"        Status: Ativa    │
│  Meta Ads + Google Ads  |  07/04 - 14/04  |  R$ 10/dia  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │12.450│  │ 342  │  │ 2.7% │  │R$0.18│  │  15  │      │
│  │Alcance│ │Cliques│ │ CTR  │  │ CPC  │  │Conver│      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                          │
│  Grafico de desempenho por dia                           │
│  ┌─────────────────────────────────────────────┐        │
│  │  📊 Impressoes | Cliques | Conversoes       │        │
│  │  (line chart)                                │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Desempenho por plataforma:                              │
│  ┌─────────────────┬──────────────────┐                  │
│  │ Meta Ads        │ Google Ads       │                  │
│  │ 8.200 alcance   │ 4.250 impress.  │                  │
│  │ 210 cliques     │ 132 cliques     │                  │
│  │ CTR: 2.5%       │ CTR: 3.1%       │                  │
│  │ CPC: R$ 0.15    │ CPC: R$ 0.22    │                  │
│  └─────────────────┴──────────────────┘                  │
│                                                          │
│  Criativos usados:                                       │
│  [Card 1] [Card 2] [Video 1]                             │
│                                                          │
│  [⏸ Pausar] [📊 Relatorio] [🗑 Encerrar]                │
└──────────────────────────────────────────────────────────┘
```

---

### 2.8 Atualizacao do Schema — campaigns (MongoDB)

O schema atual e basico. Evolucao necessaria:

```javascript
{
  _id: ObjectId,
  company_id: ObjectId,
  
  // Dados basicos
  name: String,
  description: String,
  type: String,                     // 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales' | 'messages' | 'local_store'
  status: String,                   // 'draft' | 'review' | 'active' | 'paused' | 'completed' | 'failed'
  
  // Conteudo
  card_ids: [ObjectId],             // Ref Card — criativos de imagem
  video_ids: [ObjectId],            // Ref Video — criativos de video
  script_ids: [ObjectId],           // Ref Script — textos/copy
  ad_copy: String,                  // Texto principal do anuncio
  cta_type: String,                 // 'LEARN_MORE' | 'SHOP_NOW' | 'SEND_MESSAGE' | 'CALL_NOW' | etc.
  destination_url: String,          // Link de destino (site, WhatsApp, etc.)
  
  // Publico-alvo
  targeting: {
    locations: [{
      city: String,
      state: String,
      country: String,
      radius_km: Number
    }],
    age_min: Number,                // 18-65
    age_max: Number,
    genders: [String],              // ['all'] | ['male'] | ['female'] | ['male', 'female']
    interests: [{
      id: String,                   // ID da plataforma
      name: String
    }],
    custom_audience_id: String      // Publico personalizado (opcional)
  },
  
  // Orcamento
  budget: {
    daily_amount: Number,           // Em reais (ex: 10.00)
    total_amount: Number,           // Calculado: daily * dias
    currency: String                // 'BRL'
  },
  
  // Periodo
  start_date: Date,
  end_date: Date,
  duration_days: Number,
  
  // Plataformas
  platforms: {
    meta_ads: {
      enabled: Boolean,
      placements: [String],         // ['instagram_feed', 'instagram_stories', 'instagram_reels', 'facebook_feed', 'facebook_stories', 'audience_network']
      campaign_id: String,          // ID da campanha no Meta Ads
      adset_id: String,
      ad_ids: [String],
      status: String                // Status na plataforma
    },
    google_ads: {
      enabled: Boolean,
      campaign_types: [String],     // ['search', 'display', 'youtube', 'discovery']
      campaign_id: String,
      ad_group_id: String,
      ad_ids: [String],
      keywords: [String],           // Palavras-chave (para Search)
      status: String
    }
  },
  
  // Metricas (atualizadas periodicamente)
  metrics: {
    impressions: Number,
    reach: Number,
    clicks: Number,
    ctr: Number,                    // Click-through rate (%)
    cpc: Number,                    // Cost per click (R$)
    cpm: Number,                    // Cost per 1000 impressions (R$)
    conversions: Number,
    cost_per_conversion: Number,
    total_spent: Number,
    last_synced_at: Date
  },
  
  // Estimativas (calculadas antes de publicar)
  estimates: {
    daily_reach_min: Number,
    daily_reach_max: Number,
    total_reach_min: Number,
    total_reach_max: Number
  },
  
  // Metadados
  created_by: ObjectId,
  published_at: Date,
  completed_at: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2.9 Novos Enums — Campanhas

```typescript
// packages/shared/src/enums/index.ts

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
```

---

### 2.10 API — Endpoints de Campanha

```
GET    /api/campaigns                        → Listar campanhas (paginado)
GET    /api/campaigns/:id                    → Detalhe da campanha (com metricas)
POST   /api/campaigns                        → Criar campanha (rascunho)
PUT    /api/campaigns/:id                    → Atualizar campanha
DELETE /api/campaigns/:id                    → Deletar campanha (se draft)

POST   /api/campaigns/:id/publish            → Publicar campanha nas plataformas
POST   /api/campaigns/:id/pause              → Pausar campanha
POST   /api/campaigns/:id/resume             → Retomar campanha
POST   /api/campaigns/:id/complete           → Encerrar campanha

GET    /api/campaigns/:id/metrics            → Metricas detalhadas
GET    /api/campaigns/:id/report             → Gerar relatorio

POST   /api/campaigns/estimate-reach         → Estimar alcance com base no publico/orcamento
POST   /api/campaigns/suggest-interests      → IA sugere interesses com base no nicho
POST   /api/campaigns/generate-copy          → IA gera copy do anuncio

GET    /api/campaigns/platforms/meta/accounts → Listar ad accounts do Meta
GET    /api/campaigns/platforms/google/accounts → Listar customer IDs do Google
```

#### POST /api/campaigns — Body completo

```typescript
{
  name: string
  description?: string
  type: CampaignType
  
  // Conteudo
  card_ids: string[]
  video_ids?: string[]
  ad_copy: string
  cta_type: CampaignCTA
  destination_url: string
  
  // Publico
  targeting: {
    locations: { city: string, state: string, radius_km: number }[]
    age_min: number
    age_max: number
    genders: string[]
    interests: { id: string, name: string }[]
  }
  
  // Orcamento
  budget: {
    daily_amount: number
  }
  
  // Periodo
  start_date: string          // ISO date
  end_date: string
  
  // Plataformas
  platforms: {
    meta_ads?: {
      enabled: boolean
      placements: string[]
    }
    google_ads?: {
      enabled: boolean
      campaign_types: string[]
      keywords?: string[]
    }
  }
}
```

---

### 2.11 Tela — Wizard de Campanha (Frontend)

```
app/app/campaigns/
├── page.tsx                      → Listagem de campanhas (ja existe, evoluir)
├── new/
│   └── page.tsx                  → Wizard de criacao (5 etapas)
├── [id]/
│   ├── page.tsx                  → Dashboard da campanha (metricas)
│   └── edit/
│       └── page.tsx              → Editar campanha (se draft)
└── components/
    ├── CampaignWizard.tsx        → Container do wizard
    ├── steps/
    │   ├── ObjectiveStep.tsx     → Etapa 1: Objetivo + conteudo
    │   ├── AudienceStep.tsx      → Etapa 2: Publico-alvo
    │   ├── BudgetStep.tsx        → Etapa 3: Orcamento + duracao
    │   ├── PlatformStep.tsx      → Etapa 4: Plataformas + posicionamentos
    │   └── ReviewStep.tsx        → Etapa 5: Revisao + publicar
    ├── CampaignDashboard.tsx     → Metricas e graficos
    ├── AdPreview.tsx             → Preview do anuncio em cada posicionamento
    ├── InterestSelector.tsx      → Autocomplete de interesses (busca na Meta API)
    ├── LocationPicker.tsx        → Busca de cidade + raio
    ├── BudgetEstimator.tsx       → Calculo de orcamento + estimativa de alcance
    ├── ContentSelector.tsx       → Selecao de cards/videos
    └── MetricsChart.tsx          → Graficos de desempenho
```

---

### 2.12 Services de Campanha

```typescript
// services/meta-ads.service.ts
class MetaAdsService {
  // Listar ad accounts da empresa
  async listAdAccounts(companyId: string): Promise<AdAccount[]>
  
  // Criar campanha completa (campaign + adset + ads)
  async createCampaign(params: CreateCampaignParams): Promise<MetaCampaignResult>
  
  // Upload de criativo (imagem ou video)
  async uploadCreative(adAccountId: string, mediaUrl: string, type: 'image' | 'video'): Promise<string>
  
  // Pausar/retomar campanha
  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<void>
  
  // Buscar metricas
  async fetchMetrics(campaignId: string, dateRange: DateRange): Promise<CampaignMetrics>
  
  // Estimar alcance
  async estimateReach(adAccountId: string, targeting: Targeting, dailyBudget: number): Promise<ReachEstimate>
  
  // Buscar interesses por keyword
  async searchInterests(query: string): Promise<Interest[]>
}

// services/google-ads.service.ts
class GoogleAdsService {
  // Listar customer accounts
  async listCustomerAccounts(companyId: string): Promise<CustomerAccount[]>
  
  // Criar campanha
  async createCampaign(params: CreateGoogleCampaignParams): Promise<GoogleCampaignResult>
  
  // Upload de asset
  async uploadAsset(customerId: string, mediaUrl: string): Promise<string>
  
  // Atualizar status
  async updateStatus(campaignId: string, status: 'ENABLED' | 'PAUSED'): Promise<void>
  
  // Buscar metricas
  async fetchMetrics(campaignId: string, dateRange: DateRange): Promise<GoogleMetrics>
  
  // Sugerir keywords
  async suggestKeywords(niche: string, productName: string): Promise<Keyword[]>
}
```

---

### 2.13 Worker de Metricas (BullMQ)

```typescript
// Roda a cada 4 horas para campanhas ativas
// Busca metricas atualizadas no Meta Ads e Google Ads

new Worker('campaign-metrics-queue', async (job: Job) => {
  const activeCampaigns = await Campaign.find({ status: 'active' })
  
  for (const campaign of activeCampaigns) {
    const company = await Company.findById(campaign.company_id)
    
    let totalImpressions = 0, totalClicks = 0, totalSpent = 0
    
    // Meta Ads
    if (campaign.platforms.meta_ads?.enabled && campaign.platforms.meta_ads?.campaign_id) {
      const metaMetrics = await MetaAdsService.fetchMetrics(
        campaign.platforms.meta_ads.campaign_id,
        { start: campaign.start_date, end: new Date() }
      )
      totalImpressions += metaMetrics.impressions
      totalClicks += metaMetrics.clicks
      totalSpent += metaMetrics.spend
    }
    
    // Google Ads
    if (campaign.platforms.google_ads?.enabled && campaign.platforms.google_ads?.campaign_id) {
      const googleMetrics = await GoogleAdsService.fetchMetrics(
        campaign.platforms.google_ads.campaign_id,
        { start: campaign.start_date, end: new Date() }
      )
      totalImpressions += googleMetrics.impressions
      totalClicks += googleMetrics.clicks
      totalSpent += googleMetrics.cost
    }
    
    // Atualizar metricas
    await Campaign.findByIdAndUpdate(campaign._id, {
      'metrics.impressions': totalImpressions,
      'metrics.clicks': totalClicks,
      'metrics.ctr': totalClicks / totalImpressions * 100,
      'metrics.cpc': totalSpent / totalClicks,
      'metrics.total_spent': totalSpent,
      'metrics.last_synced_at': new Date()
    })
  }
  
  // Verificar campanhas que terminaram
  const expired = await Campaign.find({
    status: 'active',
    end_date: { $lte: new Date() }
  })
  
  for (const campaign of expired) {
    await Campaign.findByIdAndUpdate(campaign._id, { 
      status: 'completed',
      completed_at: new Date()
    })
    // Desativar nas plataformas
    if (campaign.platforms.meta_ads?.campaign_id) {
      await MetaAdsService.updateCampaignStatus(campaign.platforms.meta_ads.campaign_id, 'PAUSED')
    }
    if (campaign.platforms.google_ads?.campaign_id) {
      await GoogleAdsService.updateStatus(campaign.platforms.google_ads.campaign_id, 'PAUSED')
    }
  }
})
```

---

### 2.14 IA no Modulo de Campanhas

```typescript
// POST /api/campaigns/suggest-interests
// Gemini sugere interesses com base no nicho e tipo de campanha
async function suggestInterests(niche: string, campaignType: string): Promise<Interest[]> {
  const prompt = `
    Voce e um especialista em marketing digital.
    Sugira 10-15 interesses/segmentacoes para anuncios no Facebook/Instagram
    para uma empresa do nicho "${niche}" com objetivo de "${campaignType}".
    
    Retorne JSON: [{ "name": "nome do interesse", "category": "categoria" }]
    
    Exemplos:
    - farmacia → saude e bem-estar, beleza, cosmeticos, fitness, nutricao
    - pet → animais de estimacao, pet shop, racao, veterinario, adocao
  `
  // Chamar Gemini e retornar lista
}

// POST /api/campaigns/generate-copy
// Gemini gera texto do anuncio com base no card e objetivo
async function generateAdCopy(params: {
  cardHeadline: string
  cardSubtext: string
  companyName: string
  niche: string
  campaignType: string
  destinationUrl: string
}): Promise<{ primary_text: string, headline: string, description: string }> {
  const prompt = `
    Gere copy para anuncio de ${params.campaignType} no Facebook/Instagram.
    Empresa: ${params.companyName} (${params.niche})
    Card base: "${params.cardHeadline}" - "${params.cardSubtext}"
    Link: ${params.destinationUrl}
    
    Retorne JSON:
    {
      "primary_text": "Texto principal do anuncio (max 125 chars)",
      "headline": "Titulo do anuncio (max 40 chars)",
      "description": "Descricao (max 30 chars)"
    }
    
    Regras: portugues brasileiro, tom acessivel, incluir CTA, emojis estrategicos.
  `
}
```

---

### 2.15 Atualizacao da Collection — integrations

Adicionar campos para ads:

```javascript
// Adicionar ao schema integrations existente:
{
  // ... campos existentes (meta, evolution, gemini) ...
  
  // Meta Ads
  meta_ads: {
    ad_account_id: String,            // ID da conta de anuncios
    ad_account_name: String,
    access_token: String,             // Token com scope ads_management (criptografado)
    connected: Boolean,
    connected_at: Date
  },
  
  // Google Ads
  google_ads: {
    customer_id: String,              // ID do cliente Google Ads
    customer_name: String,
    refresh_token: String,            // OAuth refresh token (criptografado)
    developer_token: String,          // Developer token da app
    connected: Boolean,
    connected_at: Date
  }
}
```

---

### 2.16 Checklist do Modulo de Campanhas

- [ ] Atualizar schema Campaign no `packages/db` com novos campos
- [ ] Criar enums `CampaignStatus`, `CampaignType`, `CampaignCTA`, `AdPlacement` no shared
- [ ] Atualizar schema Integration com campos meta_ads e google_ads
- [ ] Implementar `MetaAdsService` (criar campanha, upload criativo, metricas)
- [ ] Implementar `GoogleAdsService` (criar campanha, upload asset, metricas)
- [ ] Implementar endpoints de campanha (CRUD + publish/pause/resume)
- [ ] Implementar `POST /api/campaigns/estimate-reach`
- [ ] Implementar `POST /api/campaigns/suggest-interests`
- [ ] Implementar `POST /api/campaigns/generate-copy`
- [ ] Implementar worker de sincronizacao de metricas (BullMQ, a cada 4h)
- [ ] Implementar worker de verificacao de campanhas expiradas
- [ ] Frontend: wizard de criacao em 5 etapas
- [ ] Frontend: dashboard de campanha com metricas
- [ ] Frontend: preview de anuncio por posicionamento
- [ ] Frontend: selecao de interesses com autocomplete (Meta API)
- [ ] Frontend: estimativa de alcance em tempo real
- [ ] Frontend: graficos de desempenho (usar Recharts ou Chart.js)
- [ ] Atualizar listagem de campanhas existente
- [ ] Tela de configuracao de conexao Meta Ads e Google Ads (em Settings)
- [ ] OAuth flow para Meta Ads (scope ads_management)
- [ ] OAuth flow para Google Ads

---
---

## Parte 3: Integracao entre Modulos

### 3.1 Fluxo Completo: Card → Video → Campanha

```
1. Empresa gera cards com IA
   ↓
2. Aprova os melhores cards
   ↓
3. Usa cards como base para gerar videos curtos
   ↓
4. Video gerado automaticamente (Gemini Veo ou Remotion)
   ↓
5. Cria campanha selecionando cards + videos
   ↓
6. IA sugere publico, copy e interesses
   ↓
7. Publica campanha no Meta Ads e/ou Google Ads
   ↓
8. Metricas coletadas automaticamente
   ↓
9. Dashboard com resultados em tempo real
```

### 3.2 Pontos de Integracao

| Modulo | Integra com | Como |
|--------|-------------|------|
| Cards | Videos | Card pode ser slide de video (`source_card_id`) |
| Cards | Campanhas | Card e criativo de imagem do anuncio (`card_ids`) |
| Videos | Campanhas | Video e criativo de video do anuncio (`video_ids`) |
| Scripts | Campanhas | Script gera copy do anuncio (`script_ids`) |
| Campanhas | Meta Ads API | Publica anuncios no Instagram/Facebook |
| Campanhas | Google Ads API | Publica anuncios no Google/YouTube |
| Campanhas | Analytics | Metricas de desempenho sincronizadas |
| Videos | Post Queue | Video pode ser agendado para publicacao organica |

---

## Ordem de Implementacao Sugerida

| Fase | Tarefa | Estimativa |
|------|--------|------------|
| 1 | Schemas + enums (Video e Campaign atualizados) | 1 dia |
| 2 | Backend: API de videos com novos campos | 2 dias |
| 3 | Service de TTS e geracao de legendas | 1 dia |
| 4 | Integracao Gemini Veo para geracao de video | 2 dias |
| 5 | Templates Remotion (fallback) | 3 dias |
| 6 | Video worker completo (BullMQ) | 1 dia |
| 7 | Frontend: tela de geracao de video | 3 dias |
| 8 | Backend: API de campanhas com novos campos | 2 dias |
| 9 | Service Meta Ads (Marketing API) | 3 dias |
| 10 | Service Google Ads | 3 dias |
| 11 | Frontend: wizard de campanha (5 etapas) | 3 dias |
| 12 | Frontend: dashboard de campanha (metricas) | 2 dias |
| 13 | Worker de metricas + campanhas expiradas | 1 dia |
| 14 | OAuth flows (Meta Ads + Google Ads) | 2 dias |
| 15 | Testes e ajustes finais | 2 dias |

**Total estimado: ~30 dias de trabalho**

---

**Documento gerado em:** 03/04/2026  
**Projeto:** Soma.ai — Sistema Operacional de Marketing Automatizado com IA
