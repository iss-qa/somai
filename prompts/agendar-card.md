# Prompt: Agendamento de Cards — Baseado na Implementação Funcional do Juntix

> **Objetivo deste documento:** Servir como prompt técnico detalhado para reproduzir ou expandir o sistema de agendamento de cards de marketing do Juntix em outro projeto. Toda a arquitetura, código, fluxos e decisões aqui descritos estão **implementados e funcionando em produção** em https://juntix.com.br.

---

## CONTEXTO DO PROJETO

**Stack:** React 19 + TypeScript (frontend) / NestJS 11 + MongoDB + Redis (backend)
**Deploy:** PM2 em VPS Ubuntu — backend em `https://api.juntix.com.br`, frontend em `https://juntix.com.br`
**Módulo:** Gestão de Marketing → Aba "Calendário de Postagens"
**Rota frontend:** `/painel-master/marketing` (aba `TabCalendario`)
**Rota backend:** `/api/marketing/*`

---

## VISÃO GERAL DO FLUXO

```
[1] Usuário gera card com IA (TabGeradorCards)
        ↓
[2] Usuário aprova o card → status: 'approved'
        ↓
[3] Usuário acessa o Calendário → clica em um dia ou "+ Agendar Card"
        ↓
[4] Modal de agendamento: seleciona card + data/hora + plataforma + legenda
        ↓
[5] POST /api/marketing/schedule → cria MarketingSchedule (status: 'scheduled')
        ↓
[6] Cron job (@Cron('* * * * *')) verifica a cada 60s posts com scheduledAt <= now
        ↓
[7] marketingService.publishPost(scheduleId) é chamado
        ↓
[8] Resolve imagem → cria media container (Instagram Graph API) → polling → publica
        ↓
[9] status → 'published' + alerta WhatsApp de sucesso
        (ou status → 'failed' + errorMessage + alerta WhatsApp de falha)
```

---

## PARTE 1 — BANCO DE DADOS (MongoDB)

### Coleção `marketing_cards`

```typescript
// Arquivo: backend/src/modules/marketing/schemas/marketing-card.schema.ts

export enum CardFormat {
  FEED_SQUARE   = 'feed_square',    // 1080 x 1080 px
  FEED_PORTRAIT = 'feed_portrait',  // 1080 x 1350 px
  FEED_LANDSCAPE = 'feed_landscape', // 1080 x 608 px
  STORY_REELS   = 'story_reels',    // 1080 x 1920 px
  CAROUSEL      = 'carousel',       // 1080 x 1080 px (multi-slides)
}

export enum CardStatus {
  DRAFT     = 'draft',
  APPROVED  = 'approved',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED    = 'failed',
}

@Schema({ timestamps: true, collection: 'marketing_cards' })
export class MarketingCard extends Document {
  @Prop() name?: string;                    // Nome dado pelo usuário ao aprovar
  @Prop({ required: true, enum: CardFormat }) format: CardFormat;
  @Prop({ required: true }) theme: string;
  @Prop({ required: true }) tone: string;
  @Prop({ required: true }) palette: string;
  @Prop({ required: true }) headline: string;
  @Prop() subheadline?: string;
  @Prop({ required: true }) bodyText: string;
  @Prop() ctaText?: string;
  @Prop({ type: [String], default: [] }) hashtags: string[];
  @Prop({ type: Object }) colorScheme: {
    primary: string; secondary: string;
    background: string; text: string; accent: string;
  };
  @Prop({ default: true }) includeLogo: boolean;
  @Prop({ default: true }) includeCTA: boolean;
  @Prop({ enum: CardStatus, default: CardStatus.DRAFT }) status: CardStatus;
  @Prop() imageUrl?: string;               // URL pública da imagem PNG gerada
  @Prop({ type: [String] }) carouselImageUrls?: string[];
  @Prop({ type: [Object] }) carouselSlides?: Array<{
    headline: string; subheadline?: string;
    bodyText: string; ctaText?: string; imageUrl?: string;
  }>;
  @Prop() customPrompt?: string;
  @Prop({ type: Types.ObjectId, ref: 'Usuario' }) createdBy?: Types.ObjectId;
}
```

### Coleção `marketing_schedule`

```typescript
// Arquivo: backend/src/modules/marketing/schemas/marketing-schedule.schema.ts

export enum Platform {
  INSTAGRAM_FEED  = 'instagram_feed',
  INSTAGRAM_STORY = 'instagram_story',
  FACEBOOK_FEED   = 'facebook_feed',
}

export enum ScheduleStatus {
  SCHEDULED  = 'scheduled',
  PUBLISHED  = 'published',
  FAILED     = 'failed',
  CANCELLED  = 'cancelled',
}

@Schema({ timestamps: true, collection: 'marketing_schedule' })
export class MarketingSchedule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'MarketingCard', required: true })
  cardId: Types.ObjectId;

  @Prop({ required: true, enum: Platform })
  platform: Platform;

  @Prop({ required: true })
  scheduledAt: Date;            // Data/hora de publicação programada

  @Prop() caption: string;      // Legenda do post (vazio para Stories)
  @Prop({ type: [String], default: [] }) hashtags: string[];

  @Prop({ enum: ScheduleStatus, default: ScheduleStatus.SCHEDULED })
  status: ScheduleStatus;

  @Prop() publishedAt?: Date;           // Preenchido após publicação
  @Prop() errorMessage?: string;        // Detalhes do erro se falhou
  @Prop() instagramMediaId?: string;    // ID retornado pela Graph API
}
```

### Coleção `marketing_integration`

```typescript
// Documento único por tenant — armazena credenciais Instagram/Facebook

{
  instagramAccessToken: string,        // Page Access Token (não expira)
  instagramBusinessAccountId: string,  // ID da conta Business IG
  facebookPageId: string,              // ID da página do Facebook
  isConnected: boolean,
  connectedPageName: string,           // Ex: "@juntix_caixa"
  autoPostEnabled: boolean,
  maxPostsPerDay: number,              // default: 3
  defaultSchedule: {
    [dayOfWeek: string]: string[]      // Ex: { "1": ["09:00", "19:00"] }
  },
}
```

---

## PARTE 2 — DTO DE AGENDAMENTO

```typescript
// Arquivo: backend/src/modules/marketing/dto/schedule-post.dto.ts

export class SchedulePostDto {
  @IsString() cardId: string;
  @IsString() scheduledAt: string;          // ISO 8601: "2026-04-10T09:00:00.000Z"
  @IsEnum(Platform) platform: Platform;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsArray() hashtags?: string[];
}
```

---

## PARTE 3 — BACKEND: MarketingService (métodos de agendamento)

### 3.1 schedulePost()

```typescript
// Arquivo: backend/src/modules/marketing/marketing.service.ts

async schedulePost(dto: SchedulePostDto): Promise<MarketingScheduleDocument> {
  let cardObjectId: Types.ObjectId;

  // Valida se é um ObjectId MongoDB válido
  if (Types.ObjectId.isValid(dto.cardId) && dto.cardId.match(/^[0-9a-fA-F]{24}$/)) {
    const card = await this.cardModel.findById(dto.cardId).exec();
    if (!card) throw new NotFoundException(`Card não encontrado (ID: ${dto.cardId})`);

    cardObjectId = new Types.ObjectId(dto.cardId);

    // Transiciona status se ainda estava 'approved'
    if (card.status === CardStatus.APPROVED) {
      card.status = CardStatus.SCHEDULED;
      await card.save();
    }
  } else {
    // Card local/demo sem ID MongoDB → cria registro temporário
    const localCard = new this.cardModel({
      headline: dto.caption?.slice(0, 60) || 'Card agendado',
      bodyText: dto.caption || '',
      format: 'feed_square',
      theme: 'personalizado',
      tone: 'descontraido',
      palette: 'juntix_verde',
      hashtags: dto.hashtags || [],
      colorScheme: { primary: '#16a34a', secondary: '#22c55e', background: '#f0fdf4', text: '#ffffff', accent: '#facc15' },
      includeLogo: true, includeCTA: true,
      status: CardStatus.SCHEDULED,
    });
    const saved = await localCard.save();
    cardObjectId = saved._id as Types.ObjectId;
  }

  const schedule = new this.scheduleModel({
    cardId: cardObjectId,
    platform: dto.platform,
    scheduledAt: new Date(dto.scheduledAt),
    caption: dto.caption,
    hashtags: dto.hashtags || [],
    status: ScheduleStatus.SCHEDULED,
  });

  return schedule.save();
}
```

### 3.2 findAllSchedules() — com populate do card

```typescript
async findAllSchedules(filters?: { status?: string; platform?: string }) {
  const query: any = {};
  if (filters?.status) query.status = filters.status;
  if (filters?.platform) query.platform = filters.platform;

  return this.scheduleModel
    .find(query)
    .populate('cardId')           // Traz os dados do card junto
    .sort({ scheduledAt: -1 })
    .exec();
}
```

### 3.3 cancelSchedule()

```typescript
async cancelSchedule(id: string): Promise<void> {
  const schedule = await this.scheduleModel.findByIdAndUpdate(
    id,
    { status: ScheduleStatus.CANCELLED },
    { new: true }
  ).exec();
  if (!schedule) throw new NotFoundException('Agendamento não encontrado');
}
```

### 3.4 retryPublish() — retentar publicação falha

```typescript
async retryPublish(id: string, scheduledAt?: string): Promise<void> {
  const update: any = { status: ScheduleStatus.SCHEDULED, errorMessage: null };
  if (scheduledAt) update.scheduledAt = new Date(scheduledAt);

  const schedule = await this.scheduleModel
    .findByIdAndUpdate(id, update, { new: true })
    .populate('cardId')
    .exec();
  if (!schedule) throw new NotFoundException('Agendamento não encontrado');

  // IMPORTANTE: limpa imageUrl para forçar regeneração na próxima tentativa
  const card = schedule.cardId as any;
  if (card?.imageUrl) {
    card.imageUrl = '';
    await card.save();
  }
}
```

---

## PARTE 4 — CRON JOB DE PUBLICAÇÃO AUTOMÁTICA

```typescript
// Arquivo: backend/src/modules/marketing/cron/marketing-publisher.cron.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MarketingSchedule, MarketingScheduleDocument, ScheduleStatus } from '../schemas/marketing-schedule.schema';
import { MarketingService } from '../marketing.service';

@Injectable()
export class MarketingPublisherCron {
  private readonly logger = new Logger(MarketingPublisherCron.name);

  constructor(
    @InjectModel(MarketingSchedule.name)
    private readonly scheduleModel: Model<MarketingScheduleDocument>,
    private readonly marketingService: MarketingService,
  ) {}

  // Executa TODA MINUTO — verifica posts agendados com scheduledAt <= agora
  @Cron('* * * * *')
  async publishDuePosts() {
    const now = new Date();

    const duePosts = await this.scheduleModel
      .find({
        status: ScheduleStatus.SCHEDULED,
        scheduledAt: { $lte: now },
      })
      .limit(5)   // Máximo 5 por execução — evita sobrecarga e rate limits
      .exec();

    if (duePosts.length === 0) return;

    this.logger.log(`[CRON] ${duePosts.length} post(s) para publicar`);

    for (const post of duePosts) {
      try {
        this.logger.log(`[CRON] Publicando ${post._id} em ${post.platform}...`);
        await this.marketingService.publishPost(post._id.toString());
        this.logger.log(`[CRON] Post ${post._id} publicado com sucesso!`);
      } catch (error: any) {
        this.logger.error(`[CRON] Falha no post ${post._id}: ${error.message}`);
        // Marca como failed se o publishPost não atualizou ainda
        try {
          await this.scheduleModel.findByIdAndUpdate(post._id, {
            status: ScheduleStatus.FAILED,
            errorMessage: error.message || 'Erro desconhecido no cron',
          });
        } catch { /* ignora erros de atualização */ }
      }
    }
  }
}
```

**Configuração obrigatória no módulo:**

```typescript
// app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),   // OBRIGATÓRIO para @Cron funcionar
    // ...
  ],
})

// marketing.module.ts — registrar o cron como provider
providers: [
  MarketingService,
  MarketingPublisherCron,   // Adicionar aqui
  MarketingAlertService,
],
```

---

## PARTE 5 — PUBLICAÇÃO NO INSTAGRAM (publishPost)

Este é o método mais crítico. Implementado em `marketing.service.ts` (linha 361+).

### 5.1 Resolução da imagem

Antes de publicar, o sistema resolve qual imagem usar:

```typescript
async publishPost(scheduleId: string): Promise<void> {
  const schedule = await this.scheduleModel.findById(scheduleId).populate('cardId').exec();
  const card = schedule.cardId as MarketingCardDocument;
  const config = await this.integrationModel.findOne().exec();

  // Verificar credenciais
  if (!config?.instagramAccessToken || !config?.instagramBusinessAccountId) {
    schedule.status = ScheduleStatus.FAILED;
    schedule.errorMessage = 'Credenciais Instagram não configuradas';
    await schedule.save();
    await this.alertService.alertPublishFailure({ ... });
    return;
  }

  let imageUrl = card?.imageUrl || '';

  // Descartar URLs inacessíveis pelo Instagram
  if (imageUrl.startsWith('data:'))                                          imageUrl = '';
  if (imageUrl && (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')))  imageUrl = '';

  // Gerar imagem server-side se necessário
  const generateServerImage = async (): Promise<string> => {
    const filename = await generateCardImage({
      headline:     card?.headline || schedule.caption || 'Juntix',
      subheadline:  card?.subheadline,
      bodyText:     card?.bodyText || '',
      ctaText:      card?.ctaText,
      palette:      card?.palette || 'juntix_verde',
      includeLogo:  card?.includeLogo,
      includeCTA:   card?.includeCTA,
      format:       card?.format || 'feed_square',
    });

    const baseUrl = this.configService.get<string>('API_BASE_URL') || 'https://api.juntix.com.br';
    // NUNCA usar localhost — Instagram não consegue acessar
    const publicBase = (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))
      ? 'https://api.juntix.com.br'
      : baseUrl;

    const url = `${publicBase}/uploads/marketing/${filename}`;
    if (card?._id) { card.imageUrl = url; await card.save(); }
    return url;
  };

  // Validar acessibilidade da URL (HEAD request)
  const validateImageUrl = async (url: string): Promise<boolean> => {
    try {
      const resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      const ct = resp.headers.get('content-type') || '';
      return resp.ok && ct.startsWith('image/');
    } catch { return false; }
  };

  // Resolver imagem final
  if (imageUrl) {
    const valid = await validateImageUrl(imageUrl);
    if (!valid) {
      imageUrl = await generateServerImage().catch(() => '');
    }
  } else {
    imageUrl = await generateServerImage().catch(() => '');
  }

  // Fallback final: logo padrão Juntix
  if (!imageUrl) {
    imageUrl = 'https://api.juntix.com.br/uploads/marketing/juntix-logo-fallback.png';
  }

  // Validação final obrigatória
  const finalValid = await validateImageUrl(imageUrl);
  if (!finalValid) {
    throw new Error(`Imagem não acessível ou inválida para publicação: ${imageUrl}`);
  }
```

### 5.2 Publicação Instagram Feed (3 etapas obrigatórias)

```typescript
  const token = config.instagramAccessToken;
  const igId  = config.instagramBusinessAccountId;
  const pageId = config.facebookPageId;
  const fullCaption = `${schedule.caption || ''}\n\n${(schedule.hashtags || []).join(' ')}`.trim();
  const isStory = schedule.platform === 'instagram_story';
  const isFacebookFeed = schedule.platform === 'facebook_feed';
  const isCarousel = card?.format === 'carousel' && (card?.carouselSlides?.length || 0) > 1;

  // ============================================================
  // INSTAGRAM FEED — Feed quadrado, retrato, paisagem
  // ============================================================
  if (!isCarousel && !isFacebookFeed) {
    // ETAPA 1: Criar media container
    const containerBody: any = {
      image_url: imageUrl,
      access_token: token,
    };
    if (isStory) {
      containerBody.media_type = 'STORIES';
      // NOTA: Stories NÃO suportam caption — não incluir
    } else {
      containerBody.caption = fullCaption;
    }

    const containerResp = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(containerBody) }
    );
    const containerData = await containerResp.json();
    if (!containerData.id) throw new Error(`Criar container: ${JSON.stringify(containerData)}`);

    const containerId = containerData.id;

    // ETAPA 2: Polling — aguardar processamento (OBRIGATÓRIO)
    // Sem isso: erro "Media ID is not available"
    let mediaReady = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 2000));  // Aguarda 2s entre tentativas

      const statusResp = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${token}`
      );
      const statusData = await statusResp.json();

      if (statusData.status_code === 'FINISHED') { mediaReady = true; break; }
      if (statusData.status_code === 'ERROR') {
        throw new Error(`Container falhou: ${statusData.status || 'ERROR'}`);
      }
      // IN_PROGRESS → continua aguardando
    }
    if (!mediaReady) throw new Error('Timeout: media container não ficou pronto após 60s');

    // ETAPA 3: Publicar
    const publishResp = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerId, access_token: token }),
      }
    );
    const publishData = await publishResp.json();
    if (!publishData.id) throw new Error(`Publicar: ${JSON.stringify(publishData)}`);

    mediaId = publishData.id;
  }

  // ============================================================
  // FACEBOOK FEED — publicação direta em uma etapa
  // ============================================================
  else if (isFacebookFeed) {
    const fbResp = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, message: fullCaption, access_token: token }),
      }
    );
    const fbData = await fbResp.json();
    if (!fbData.id) throw new Error(`Facebook: ${JSON.stringify(fbData)}`);
    mediaId = fbData.id;
  }
```

### 5.3 Carrossel (multi-slide)

```typescript
  // ============================================================
  // CARROSSEL — múltiplas imagens
  // ============================================================
  else if (isCarousel) {
    const slideUrls = card.carouselImageUrls?.filter(Boolean) || [];

    // Etapa 1: Criar um container filho por slide
    const childIds: string[] = [];
    for (const slideUrl of slideUrls) {
      const childResp = await fetch(
        `https://graph.facebook.com/v21.0/${igId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: slideUrl, is_carousel_item: true, access_token: token }),
        }
      );
      const childData = await childResp.json();
      if (!childData.id) throw new Error(`Child container falhou: ${JSON.stringify(childData)}`);
      childIds.push(childData.id);
    }

    // Etapa 2: Criar container principal do carrossel
    const carouselResp = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: childIds,
          caption: fullCaption,
          access_token: token,
        }),
      }
    );
    const carouselData = await carouselResp.json();
    const carouselContainerId = carouselData.id;

    // Etapa 3: Polling (mesmo fluxo do feed)
    // ... (igual ao Instagram Feed acima)

    // Etapa 4: Publicar carrossel
    // ... (igual ao Instagram Feed acima)
  }
```

### 5.4 Atualização de status pós-publicação

```typescript
  // Sucesso: atualizar schedule e card
  schedule.status     = ScheduleStatus.PUBLISHED;
  schedule.publishedAt = new Date();
  schedule.instagramMediaId = mediaId;
  await schedule.save();

  if (card) { card.status = CardStatus.PUBLISHED; await card.save(); }

  // Alerta WhatsApp de sucesso
  await this.alertService.alertPublishSuccess({
    platform:   schedule.platform,
    mediaId,
    cardHeadline: card?.headline,
  });

} catch (error: any) {
  // Falha: registrar e alertar
  schedule.status       = ScheduleStatus.FAILED;
  schedule.errorMessage = error.message || 'Erro desconhecido';
  await schedule.save();

  await this.alertService.alertPublishFailure({
    platform:      schedule.platform,
    scheduledAt:   schedule.scheduledAt.toISOString(),
    errorMessage:  error.message,
    cardHeadline:  card?.headline,
  });
  throw error;
}
```

---

## PARTE 6 — CONTROLLER (endpoints REST)

```typescript
// Arquivo: backend/src/modules/marketing/marketing.controller.ts

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {

  // Agendar publicação
  @Post('schedule')
  async schedulePost(@Body() dto: SchedulePostDto, @CurrentUser('id') userId: string) {
    return this.marketingService.schedulePost(dto);
  }

  // Listar agendamentos (com populate do card)
  @Get('schedule')
  async getSchedule(@Query('status') status?: string, @Query('platform') platform?: string) {
    return this.marketingService.findAllSchedules({ status, platform });
  }

  // Cancelar agendamento
  @Patch('schedule/:id/cancel')
  async cancelSchedule(@Param('id') id: string) {
    return this.marketingService.cancelSchedule(id);
  }

  // Retentar publicação (reseta status para 'scheduled')
  @Post('schedule/:id/retry')
  async retryPublish(@Param('id') id: string, @Body('scheduledAt') scheduledAt?: string) {
    return this.marketingService.retryPublish(id, scheduledAt);
  }

  // Publicar manualmente (trigger imediato)
  @Post('schedule/:id/publish')
  async publishNow(@Param('id') id: string) {
    return this.marketingService.publishPost(id);
  }
}
```

---

## PARTE 7 — FRONTEND: TabCalendario.tsx

### 7.1 Estrutura do componente

```typescript
// Arquivo: frontend/src/pages/GestaoMarketing/TabCalendario.tsx

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
// Ícones: ChevronLeft, ChevronRight, Plus, X, CalendarDays, Clock,
//         Wand2, Play, Trash2, AlertCircle, CheckCircle2, Loader2, Repeat, Info

// Mapeamento: formato do card → plataformas compatíveis
const FORMAT_PLATFORM_MAP: Record<string, Platform[]> = {
  feed_square:    ['instagram_feed', 'facebook_feed'],
  feed_landscape: ['instagram_feed', 'facebook_feed'],
  feed_portrait:  ['instagram_feed', 'facebook_feed'],
  story_reels:    ['instagram_story'],           // Story APENAS para story_reels
  carousel:       ['instagram_feed', 'facebook_feed'],
};

// Horários sugeridos por dia da semana (0=Dom, 1=Seg, ...)
const SUGGESTED_TIMES: Record<number, string[]> = {
  1: ['09:00', '19:00'],  // Segunda
  3: ['12:00'],           // Quarta
  5: ['18:00'],           // Sexta
  6: ['10:00'],           // Sábado
};
```

### 7.2 Carregamento de dados

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    const [schedulesData, cardsData, allCardsData] = await Promise.all([
      marketingService.getSchedule().catch(() => []),
      marketingService.getCards({ status: 'approved' }).catch(() => []),
      marketingService.getCards().catch(() => []),
    ]);

    setSchedules(Array.isArray(schedulesData) ? schedulesData : []);

    let approved = Array.isArray(cardsData) ? cardsData : [];
    const allCards = Array.isArray(allCardsData) ? allCardsData : [];

    // Fallback 1: filtrar do array completo
    if (approved.length === 0)
      approved = allCards.filter((c) => c.status === 'approved');

    // Fallback 2: ler do localStorage (compartilhado com TabGeradorCards)
    if (approved.length === 0) {
      try {
        const saved = localStorage.getItem('juntix_marketing_cards');
        if (saved) {
          const localCards: MarketingCard[] = JSON.parse(saved);
          approved = localCards.filter((c) => c.status === 'approved');
        }
      } catch { /* ignora */ }
    }

    // Usar allCards para lookups de nome (inclui scheduled/published também)
    setApprovedCards(allCards.length > approved.length ? allCards : approved);
  } catch {
    setSchedules([]);
    setApprovedCards([]);
  } finally {
    setLoading(false);
  }
};
```

### 7.3 Resolução de nome do agendamento

```typescript
// Resolve display name: card.name > card.headline > caption > fallback
const getScheduleLabel = (s: MarketingSchedule): string => {
  if (s.card?.name)     return s.card.name;
  if (s.card?.headline) return s.card.headline;
  const card = approvedCards.find((c) => c._id === s.cardId);
  if (card?.name)     return card.name;
  if (card?.headline) return card.headline;
  return s.caption || 'Card sem nome';
};
```

### 7.4 handleSchedule — com suporte a recorrência

```typescript
const handleSchedule = async () => {
  if (!selectedCardId || !selectedDate || !selectedTime) return;
  try {
    setScheduleError('');
    setScheduling(true);

    // Hashtags: array vazio para Stories
    const hashtagsArr = isStoryPlatform ? [] : hashtags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((h) => h.startsWith('#') ? h : `#${h}`);

    // Datas: base + 4 semanas se recorrência ativa
    const dates: string[] = [];
    const baseDate = new Date(`${selectedDate}T${selectedTime}:00`);
    dates.push(baseDate.toISOString());

    if (recurrence) {
      for (let week = 1; week <= 4; week++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + week * 7);
        dates.push(d.toISOString());
      }
    }

    // Uma chamada por data (sequencial para evitar duplicatas)
    for (const scheduledAt of dates) {
      await marketingService.schedulePost({
        cardId: selectedCardId,
        scheduledAt,
        platform: selectedPlatform,
        caption: isStoryPlatform ? '' : caption,
        hashtags: hashtagsArr,
      });
    }

    setShowModal(false);
    resetForm();
    loadData();
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || 'Erro desconhecido ao agendar';
    const status = error?.response?.status;
    setScheduleError(`${status ? `[${status}] ` : ''}${msg}`);
  } finally {
    setScheduling(false);
  }
};
```

### 7.5 Grade do calendário mensal

```typescript
// Calcular dias do mês com offset para o dia da semana
const daysInMonth = useMemo(() => {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const startDay  = first.getDay();   // 0-6: domingo = 0
  const totalDays = last.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);     // células vazias antes do dia 1
  for (let i = 1; i <= totalDays; i++) days.push(i);
  return days;
}, [year, month]);

// Filtrar agendamentos por dia (excluindo cancelados)
const getSchedulesForDay = (day: number) => {
  return schedules.filter((s) => {
    if (s.status === 'cancelled') return false;
    const d = new Date(s.scheduledAt);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  });
};
```

### 7.6 Grid do calendário — renderização

```tsx
<div className="grid grid-cols-7 gap-1">
  {daysInMonth.map((day, idx) => {
    if (day === null) return <div key={`empty-${idx}`} className="min-h-[80px]" />;

    const daySchedules = getSchedulesForDay(day);
    return (
      <div
        key={day}
        className={cn(
          'min-h-[80px] rounded-lg p-1.5 border transition-colors cursor-pointer hover:border-teal-300',
          isToday(day) ? 'bg-teal-50 border-teal-200' : 'border-gray-100 hover:bg-gray-50'
        )}
        onClick={() => openScheduleModal(day)}   // Clica no dia → abre modal pré-preenchido
      >
        <span className={cn('text-xs font-medium', isToday(day) ? 'text-teal-700 font-bold' : 'text-gray-600')}>
          {day}
        </span>

        {/* Ponto de sugestão de horário (quando dia não tem posts) */}
        {SUGGESTED_TIMES[new Date(year, month, day).getDay()] && daySchedules.length === 0 && (
          <div className="mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-300 opacity-50" />
          </div>
        )}

        {/* Posts agendados no dia */}
        <div className="mt-1 space-y-0.5">
          {daySchedules.slice(0, 2).map((s) => (
            <div
              key={s._id}
              className={cn(
                'text-[9px] px-1 py-0.5 rounded truncate font-medium',
                s.status === 'published' ? 'bg-green-100 text-green-700' :
                s.status === 'failed'    ? 'bg-red-100 text-red-700'    :
                                           'bg-amber-100 text-amber-700'
              )}
            >
              {new Date(s.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {' '}{getScheduleLabel(s).slice(0, 15)}
            </div>
          ))}
          {daySchedules.length > 2 && (
            <span className="text-[9px] text-gray-400">+{daySchedules.length - 2}</span>
          )}
        </div>
      </div>
    );
  })}
</div>
```

### 7.7 Modal de agendamento — partes críticas

```tsx
{/* Modal */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="fixed inset-x-4 top-[5%] mx-auto max-w-lg bg-white rounded-2xl shadow-xl z-50 max-h-[90vh] overflow-y-auto"
>
  <div className="p-6 space-y-4">

    {/* Seletor de card — mostra nome/headline + formato */}
    <select value={selectedCardId} onChange={(e) => handleCardSelect(e.target.value)} className="input w-full">
      <option value="">Selecione um card...</option>
      {approvedCards.map((c) => {
        const fmt = FORMAT_OPTIONS.find((f) => f.value === c.format);
        return (
          <option key={c._id} value={c._id}>
            {c.name || c.headline?.slice(0, 40) || 'Card sem nome'} — {fmt?.label || c.format}
          </option>
        );
      })}
    </select>

    {/* Info do formato selecionado */}
    {selectedCard && (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
        <Info className="w-3.5 h-3.5" />
        Formato: <strong>{FORMAT_OPTIONS.find(f => f.value === selectedCard.format)?.label}</strong>
        {' · '}Plataformas: {allowedPlatforms.map((p) => PLATFORM_LABELS[p]).join(', ')}
      </div>
    )}

    {/* Data e hora */}
    <div className="grid grid-cols-2 gap-3">
      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input w-full" />
      <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="input w-full" />
    </div>

    {/* Toggle de recorrência semanal */}
    {selectedDate && (
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700">Repetir semanalmente</p>
            <p className="text-xs text-gray-400">
              {recurrence
                ? `Toda ${DAYS_PT[new Date(`${selectedDate}T12:00:00`).getDay()]}, por 4 semanas`
                : 'Publicação única'}
            </p>
          </div>
        </div>
        {/* Toggle switch custom */}
        <button
          onClick={() => setRecurrence(!recurrence)}
          className={cn('relative w-11 h-6 rounded-full transition-colors', recurrence ? 'bg-teal-500' : 'bg-gray-300')}
        >
          <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', recurrence ? 'translate-x-5' : 'translate-x-0')} />
        </button>
      </div>
    )}

    {/* Plataforma — desabilita opções incompatíveis com o formato */}
    <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform)} className="input w-full">
      {(Object.entries(PLATFORM_LABELS) as [Platform, string][]).map(([val, lbl]) => {
        const isAllowed = allowedPlatforms.includes(val);
        return (
          <option key={val} value={val} disabled={!isAllowed}>
            {lbl}{!isAllowed ? ' (incompatível com formato)' : ''}
          </option>
        );
      })}
    </select>

    {/* Legenda e hashtags — OCULTOS para Stories */}
    {!isStoryPlatform && (
      <>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label">Legenda</label>
            <button onClick={handleGenerateCaption} disabled={!selectedCardId || generatingCaption}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              <Wand2 className={cn('w-3 h-3', generatingCaption && 'animate-spin')} />
              {generatingCaption ? 'Gerando...' : 'Gerar com IA'}
            </button>
          </div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
            placeholder="Legenda da postagem..." className="input w-full min-h-[80px] resize-y" />
        </div>
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)}
          placeholder="#juntix #caixinha #fintech" className="input w-full" />
      </>
    )}

    {/* Aviso informativo para Stories */}
    {isStoryPlatform && (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-600">
        <Info className="w-3.5 h-3.5" />
        Stories não suportam legenda nem hashtags. Apenas a imagem será publicada.
      </div>
    )}

    {/* Exibir erro de agendamento */}
    {scheduleError && (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <p className="text-sm text-red-600">{scheduleError}</p>
        </div>
      </div>
    )}

    {/* Botão de confirmar */}
    <Button
      onClick={handleSchedule}
      disabled={!selectedCardId || !selectedDate || !selectedTime || scheduling ||
        (!!selectedCard && !allowedPlatforms.includes(selectedPlatform))}
      className="w-full bg-teal-500 hover:bg-teal-600 text-white"
    >
      {scheduling ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Agendando{recurrence ? ' (5 postagens)' : ''}...</>
      ) : (
        recurrence ? 'Agendar 5 postagens recorrentes' : 'Confirmar Agendamento'
      )}
    </Button>

  </div>
</motion.div>
```

---

## PARTE 8 — FRONTEND: marketing.service.ts

```typescript
// Arquivo: frontend/src/lib/api/marketing.service.ts

export type Platform = 'instagram_feed' | 'instagram_story' | 'facebook_feed';

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram_feed:  'Instagram Feed',
  instagram_story: 'Instagram Story',
  facebook_feed:   'Facebook Feed',
};

export const FORMAT_OPTIONS = [
  { value: 'feed_square',    label: 'Feed Quadrado',   dimensions: '1080×1080' },
  { value: 'feed_portrait',  label: 'Feed Retrato',    dimensions: '1080×1350' },
  { value: 'feed_landscape', label: 'Feed Paisagem',   dimensions: '1080×608'  },
  { value: 'story_reels',    label: 'Story / Reels',   dimensions: '1080×1920' },
  { value: 'carousel',       label: 'Carrossel',       dimensions: '1080×1080' },
];

export interface MarketingCard {
  _id: string;
  name?: string;
  format: string;
  theme: string;
  tone: string;
  palette: string;
  headline: string;
  subheadline?: string;
  bodyText: string;
  ctaText?: string;
  hashtags: string[];
  colorScheme: { primary: string; secondary: string; background: string; text: string; accent: string };
  includeLogo: boolean;
  includeCTA: boolean;
  status: 'draft' | 'approved' | 'scheduled' | 'published' | 'failed';
  imageUrl?: string;
  carouselImageUrls?: string[];
  carouselSlides?: any[];
  customPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingSchedule {
  _id: string;
  cardId: string;
  card?: MarketingCard;       // Populado pelo backend via .populate('cardId')
  platform: Platform;
  scheduledAt: string;        // ISO string
  caption: string;
  hashtags: string[];
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  publishedAt?: string;
  errorMessage?: string;
  instagramMediaId?: string;
  createdAt: string;
}

class MarketingService {
  private baseUrl = `${import.meta.env.VITE_API_URL}/marketing`;

  private getHeaders() {
    const token = localStorage.getItem('juntix_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  async getCards(filters?: { status?: string; format?: string }): Promise<MarketingCard[]> {
    const params = new URLSearchParams(filters as any).toString();
    const resp = await fetch(`${this.baseUrl}/cards${params ? `?${params}` : ''}`, { headers: this.getHeaders() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  async getSchedule(filters?: { status?: string; platform?: string }): Promise<MarketingSchedule[]> {
    const params = new URLSearchParams(filters as any).toString();
    const resp = await fetch(`${this.baseUrl}/schedule${params ? `?${params}` : ''}`, { headers: this.getHeaders() });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  async schedulePost(data: {
    cardId: string; scheduledAt: string; platform: Platform;
    caption?: string; hashtags?: string[];
  }): Promise<MarketingSchedule> {
    const resp = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw Object.assign(new Error(err.message || `HTTP ${resp.status}`), { response: { status: resp.status, data: err } });
    }
    return resp.json();
  }

  async cancelSchedule(id: string): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/schedule/${id}/cancel`, {
      method: 'PATCH', headers: this.getHeaders()
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  }

  async retryPublish(id: string, scheduledAt?: string): Promise<void> {
    const resp = await fetch(`${this.baseUrl}/schedule/${id}/retry`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scheduledAt }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  }

  async generateCaption(cardId: string): Promise<{ caption: string; hashtags: string[] }> {
    const resp = await fetch(`${this.baseUrl}/generate-caption`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cardId }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }
}

export const marketingService = new MarketingService();
```

---

## PARTE 9 — GERAÇÃO DE IMAGEM (SVG → PNG via WASM)

```typescript
// Arquivo: backend/src/modules/marketing/card-image-generator.ts
// Dependência: npm install @resvg/resvg-js
// (Usa WebAssembly — sem dependências nativas como sharp ou canvas)

import * as path from 'path';
import * as fs   from 'fs';

const PALETTE_COLORS = {
  juntix_verde:       { bg1: '#22c55e', bg2: '#059669', text: '#ffffff', accent: '#facc15', accentText: '#14532d' },
  escuro_premium:     { bg1: '#1e293b', bg2: '#0f172a', text: '#f1f5f9', accent: '#22d3ee', accentText: '#0f172a' },
  vibrante_tropical:  { bg1: '#fb923c', bg2: '#06b6d4', text: '#ffffff', accent: '#fde047', accentText: '#9a3412' },
  minimalista_clean:  { bg1: '#f8fafc', bg2: '#e2e8f0', text: '#1e293b', accent: '#1e293b', accentText: '#ffffff' },
};

function escapeXml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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

export async function generateCardImage(card: {
  headline: string; subheadline?: string; bodyText: string; ctaText?: string;
  palette: string; includeLogo?: boolean; includeCTA?: boolean; format?: string;
}): Promise<string> {
  const pal = PALETTE_COLORS[card.palette] || PALETTE_COLORS.juntix_verde;

  // Dimensões por formato
  let width = 1080, height = 1080;
  if (card.format === 'story_reels')    { width = 1080; height = 1920; }
  else if (card.format === 'feed_portrait')  { width = 1080; height = 1350; }
  else if (card.format === 'feed_landscape') { width = 1080; height = 608;  }

  const isStory  = card.format === 'story_reels';
  const headlineFontSize = isStory ? 52 : 46;
  const subFontSize      = isStory ? 28 : 24;
  const bodyFontSize     = isStory ? 24 : 20;
  const padding          = 80;
  const lineHeight       = 1.35;

  const headlineLines = wrapText(escapeXml(card.headline),  isStory ? 22 : 26);
  const subLines      = card.subheadline ? wrapText(escapeXml(card.subheadline), isStory ? 30 : 36) : [];
  const bodyLines     = wrapText(escapeXml(card.bodyText),  isStory ? 32 : 40);

  const totalHeight = headlineLines.length * headlineFontSize * lineHeight
    + (subLines.length > 0 ? subLines.length * subFontSize * lineHeight + 20 : 0)
    + bodyLines.length * bodyFontSize * lineHeight;
  let y = Math.max(padding + 80, (height - totalHeight) / 2);
  let content = '';

  if (card.includeLogo !== false) {
    content += `<rect x="${padding}" y="${padding}" width="48" height="48" rx="12" fill="rgba(255,255,255,0.2)"/>`;
    content += `<text x="${padding+24}" y="${padding+30}" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${pal.text}" text-anchor="middle">JX</text>`;
    content += `<text x="${padding+60}" y="${padding+32}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${pal.text}">Juntix</text>`;
  }

  for (const line of headlineLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${pal.text}">${line}</text>`;
    y += headlineFontSize * lineHeight;
  }
  y += 10;
  for (const line of subLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,sans-serif" font-size="${subFontSize}" fill="${pal.text}" opacity="0.85">${line}</text>`;
    y += subFontSize * lineHeight;
  }
  if (subLines.length) y += 10;
  for (const line of bodyLines) {
    content += `<text x="${padding}" y="${y}" font-family="Arial,sans-serif" font-size="${bodyFontSize}" fill="${pal.text}" opacity="0.75">${line}</text>`;
    y += bodyFontSize * lineHeight;
  }
  if (card.includeCTA !== false && card.ctaText) {
    y += 30;
    const ct = escapeXml(card.ctaText);
    const ctaWidth = ct.length * 22 * 0.55 + 50;
    content += `<rect x="${padding}" y="${y-8}" width="${ctaWidth}" height="48" rx="24" fill="${pal.accent}"/>`;
    content += `<text x="${padding+ctaWidth/2}" y="${y+22}" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="${pal.accentText}" text-anchor="middle">${ct}</text>`;
  }

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

  const uploadsDir = path.join(process.cwd(), 'uploads', 'marketing');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `card-${Date.now()}.png`;
  const filepath = path.join(uploadsDir, filename);

  const { Resvg } = require('@resvg/resvg-js');
  const resvg     = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const pngData   = resvg.render();
  fs.writeFileSync(filepath, pngData.asPng());

  return filename;
}
```

**Configuração do ServeStaticModule (app.module.ts):**

```typescript
ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), 'uploads'),
  serveRoot: '/api/uploads',
})
```

**Atenção com Nginx:** Se o Nginx já adiciona `/api` no proxy, a URL pública deve ser SEM `/api`:
```
https://api.juntix.com.br/uploads/marketing/card-123.png
```
(Nginx converte isso para `localhost:3000/api/uploads/marketing/card-123.png`)

---

## PARTE 10 — SISTEMA DE ALERTAS WHATSAPP

```typescript
// Arquivo: backend/src/modules/marketing/marketing-alert.service.ts

@Injectable()
export class MarketingAlertService {
  private readonly ALERT_NUMBERS = [
    '5571996838735',   // Número pessoal
    '557135990522',    // Número Juntix
  ];

  constructor(private readonly evolutionService: EvolutionApiService) {}

  async alertPublishFailure(data: {
    platform: string; scheduledAt: string;
    errorMessage: string; cardHeadline?: string;
  }) {
    const now = new Date().toLocaleString('pt-BR');
    const message = `🚨 *ALERTA — Falha na Publicação de Marketing*\n\n` +
      `📅 Data/Hora do alerta: ${now}\n` +
      `📱 Plataforma: ${data.platform}\n` +
      `🕐 Agendado para: ${new Date(data.scheduledAt).toLocaleString('pt-BR')}\n` +
      (data.cardHeadline ? `📝 Card: ${data.cardHeadline}\n\n` : '\n') +
      `❌ *Erro:* ${data.errorMessage}\n\n` +
      `Acesse o painel de Marketing para retentar a publicação.`;

    for (const phone of this.ALERT_NUMBERS) {
      try {
        await this.evolutionService.sendTextMessage(phone, message);
      } catch { /* ignora falhas no alerta */ }
    }
  }

  async alertPublishSuccess(data: {
    platform: string; mediaId: string; cardHeadline?: string;
  }) {
    const now = new Date().toLocaleString('pt-BR');
    const message = `📣 *Comunicação Marketing Juntix*\n\n` +
      `📅 ${now}\n📌 *Publicação realizada com sucesso*\n\n` +
      `Post publicado no ${data.platform}. Media ID: ${data.mediaId}`;

    for (const phone of this.ALERT_NUMBERS) {
      try {
        await this.evolutionService.sendTextMessage(phone, message);
      } catch { /* ignora */ }
    }
  }
}
```

---

## PARTE 11 — VARIÁVEIS DE AMBIENTE

### Backend (.env / .env.production)

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
API_BASE_URL=https://api.juntix.com.br     # NUNCA localhost em produção

ANTHROPIC_API_KEY=sk-ant-api03-...

FB_CLIENT_ID=1234567890
FB_CLIENT_SECRET=abc123def456
FB_REDIRECT_URI=https://juntix.com.br/callback

EVOLUTION_BASE_URL=https://evo.exemplo.com
EVOLUTION_INSTANCE_NAME=NOME_INSTANCIA
EVOLUTION_API_KEY=sua-api-key

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-redis
```

### Frontend (.env)

```env
VITE_API_URL=https://api.juntix.com.br
VITE_FACEBOOK_APP_ID=1234567890
```

---

## PARTE 12 — ERROS COMUNS E SOLUÇÕES

| Erro | Causa | Solução |
|------|-------|---------|
| `"Media ID is not available"` | Publicou sem aguardar processamento | Implementar polling de status (Etapa 2) |
| `"Only photo or video can be accepted"` | URL da imagem inacessível pelo Instagram | Validar com HEAD request; nunca usar localhost |
| `"Invalid OAuth access token"` | Token expirado ou inválido | Page tokens não expiram; reconectar via OAuth se necessário |
| `"The image could not be downloaded"` | Instagram não conseguiu baixar a imagem | Garantir HTTPS, resposta < 5s, tamanho < 8MB |
| `imageUrl com /api/api/` duplicado | ServeStaticModule + Nginx com prefix duplo | URL pública deve ser sem `/api` quando Nginx adiciona o prefixo |
| Card sem imagem no retry | imageUrl era localhost ou data: URL | `retryPublish()` limpa imageUrl para forçar regeneração |
| Cron não dispara | ScheduleModule.forRoot() ausente | Importar `ScheduleModule.forRoot()` em app.module.ts |

---

## PARTE 13 — CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Criar schema `marketing_cards` com todos os enums e campos descritos
- [ ] Criar schema `marketing_schedule` com populate reference para cards
- [ ] Criar schema `marketing_integration` (documento único)
- [ ] Registrar os 3 models no MarketingModule (`MongooseModule.forFeature`)

### Backend
- [ ] Instalar: `npm install @resvg/resvg-js @nestjs/schedule`
- [ ] Implementar `generateCardImage()` (SVG → PNG via WASM)
- [ ] Configurar `ServeStaticModule` para servir `/uploads`
- [ ] Implementar `schedulePost()` com validação de ObjectId
- [ ] Implementar `publishPost()` com resolução robusta de imagem
- [ ] Implementar polling do container Instagram (30 tentativas × 2s)
- [ ] Implementar fluxo para Feed, Story, Carrossel e Facebook
- [ ] Criar `MarketingPublisherCron` com `@Cron('* * * * *')` e limite de 5/execução
- [ ] Importar `ScheduleModule.forRoot()` no AppModule
- [ ] Registrar `MarketingPublisherCron` como provider no MarketingModule
- [ ] Implementar `MarketingAlertService` com alertas WhatsApp
- [ ] Criar endpoints REST completos no controller
- [ ] Garantir que `API_BASE_URL` nunca aponte para localhost em produção

### Frontend
- [ ] Implementar `TabCalendario` com grade mensal 7 colunas
- [ ] Implementar modal de agendamento com todos os campos
- [ ] Validar compatibilidade formato do card × plataforma (`FORMAT_PLATFORM_MAP`)
- [ ] Ocultar legenda e hashtags para Stories (`isStoryPlatform`)
- [ ] Implementar toggle de recorrência semanal (5 postagens no total)
- [ ] Implementar fallback para localStorage se API retornar vazio
- [ ] Implementar `getScheduleLabel()` com cascade de resolução de nome
- [ ] Implementar ações: cancelar, publicar agora, tentar novamente
- [ ] Exibir erros de agendamento no modal (`scheduleError`)
- [ ] Exportar `marketingService` como singleton

### Infra
- [ ] Servidor com HTTPS (obrigatório para OAuth e Graph API)
- [ ] Nginx como proxy reverso (atenção com prefixo `/api`)
- [ ] Diretório `uploads/marketing/` com permissão de escrita
- [ ] PM2 configurado via `ecosystem.config.js`
- [ ] MongoDB Atlas (produção) ou local (desenvolvimento)

---

## PARTE 14 — DECISÕES DE ARQUITETURA (POR QUE ASSIM)

1. **Polling obrigatório no Instagram:** A Graph API processa a imagem de forma assíncrona. Publicar sem polling resulta em erro `"Media ID is not available"`. O polling de 2s × 30 tentativas cobre até 60 segundos de processamento.

2. **Limite de 5 posts por execução do cron:** Evita sobrecarga do servidor e respeita o rate limit do Instagram (~25 posts/dia por conta).

3. **Regeneração de imagem no retry:** `retryPublish()` limpa `imageUrl` para forçar a geração de uma nova imagem server-side — evita reuso de URLs localhost ou imagens corrompidas que causaram a falha original.

4. **Mapeamento formato → plataforma no frontend:** Previne o usuário de agendar um card `story_reels` como `instagram_feed`, o que causaria erro na API do Instagram.

5. **Page Access Token (não expira):** Ao contrário do User Token (expira em 60 dias), o Page Access Token obtido via `me/accounts` não expira. É o token correto para operações automatizadas em produção.

6. **Fallback para localStorage:** Garante que cards gerados na mesma sessão mas não persistidos via API ainda apareçam disponíveis para agendamento.

7. **URL pública sem localhost:** O Instagram faz download da imagem pela URL. Se a URL for localhost, o download falha. Em produção (PM2 + Nginx), sempre usar `API_BASE_URL` = `https://api.juntix.com.br`.

---

**Implementação baseada no Juntix** — sistema funcionando em produção desde março/2026.
**Backend:** NestJS 11 + MongoDB + Redis + PM2 — `https://api.juntix.com.br`
**Frontend:** React 19 + Vite + TailwindCSS — `https://juntix.com.br`
