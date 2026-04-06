# Soma.ai — Etapa 2: Painel Company (MVP)

**Objetivo:** Empresa parceira consegue logar, gerar cards, aprovar e agendar posts.

**Estimativa:** 5–7 dias de trabalho

**Prioridade de entrega (ordem):**
1. Auth (login)
2. Dashboard
3. Gerador de Cards
4. Biblioteca
5. Calendário + Agendamento
6. Postagens (histórico)
7. Integrações (token Meta)

---

## 2.1 Autenticação

### Rota de login — app/(auth)/login/page.tsx

- Email + senha
- JWT salvo em cookie httpOnly
- Middleware protege rotas `/app/*`
- Redireciona para `/app/dashboard` após login

### middleware.ts

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('soma-token')?.value

  const isCompanyRoute = req.nextUrl.pathname.startsWith('/app')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')

  if ((isCompanyRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
      
      if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/app/dashboard', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*']
}
```

---

## 2.2 Layout do painel Company

### app/(company)/layout.tsx

Sidebar com navegação:
- Dashboard
- Gerar Card
- Biblioteca
- Calendário
- Postagens
- Vídeos (Pro)
- Roteiros (Pro)
- Campanhas (Pro)
- WhatsApp (Pro)
- Integrações

Exibir badge de plano no rodapé da sidebar.  
Bloquear acesso às páginas Pro com overlay/redirect se o plano for Starter.

---

## 2.3 Dashboard

### app/(company)/dashboard/page.tsx

**Componentes:**

```
DashboardPage
├── GreetingHeader          → "Bom dia, Farmácia Central 👋"
├── MetricsRow              → 4 cards: posts mês, cards aprovados, agendados hoje, vídeos
├── UpcomingPosts           → lista dos próximos 5 posts agendados
│   └── PostItem            → thumb + título + data/hora + status badge
└── QuickActions            → 3 botões: Gerar Card, Agendar, Criar Vídeo
```

**API calls:**
```
GET /api/dashboard/summary   → métricas consolidadas
GET /api/post-queue?limit=5  → próximos agendados
```

---

## 2.4 Gerador de Cards

### app/(company)/cards/generate/page.tsx

**Filosofia: mínimo de campos obrigatórios, personalização opcional**

```
CardGeneratePage
├── StepsIndicator          → Passo 1: Tipo | Passo 2: Conteúdo | Passo 3: Aprovação
├── FormatSelector          → Feed 1:1 | Stories | Reels | Carrossel
├── CardPreview             → preview ao vivo do card gerado
│   └── RegenerateButton    → regenerar sem mudar os campos
└── FormPanel
    ├── RequiredSection     → tipo de post + produto/tema + preços
    └── OptionalSection     → texto extra, template, logo (colapsável)
    └── ActionButtons       → Gerar com IA | Aprovar | Editar | Agendar
```

**Campos obrigatórios (mínimo):**
- Tipo de post (select: Promoção, Dica, Novidade, Institucional, Data comemorativa)
- Produto / Tema (input de texto)
- Preço original (opcional se não for promoção)
- Preço promocional (opcional se não for promoção)

**Campos opcionais (seção colapsável):**
- Texto adicional / CTA personalizado
- Template (Automático por padrão)
- Logo (usa a salva por padrão)
- Paleta de cores (usa a da empresa por padrão)

**API calls:**
```
POST /api/cards/generate     → gera card com IA, retorna card + image_url
PATCH /api/cards/:id/approve → aprova card, muda status para 'approved'
```

**Lógica de geração no backend:**
1. Buscar `niche_config` da empresa para montar prompt
2. Montar prompt enriquecido com dados do produto + nicho + tom
3. Chamar IA para gerar imagem (DALL-E / Ideogram)
4. Gerar caption com hashtags usando LLM
5. Salvar card no MongoDB, imagem no R2
6. Retornar card completo para preview

---

## 2.5 Biblioteca de Cards

### app/(company)/cards/library/page.tsx

```
LibraryPage
├── FilterBar               → Todos | Feed | Stories | Reels | Carrossel
├── StatusFilter            → Todos | Aprovados | Agendados | Publicados | Rascunhos
├── CardGrid                → grid responsivo 3 colunas
│   └── CardTile
│       ├── Thumbnail       → imagem gerada
│       ├── Title           → headline do card
│       ├── Meta            → formato + data criação
│       ├── StatusBadge
│       └── Actions         → Agendar | Editar | Arquivar | Download PNG
└── EmptyState              → quando não há cards
```

**API calls:**
```
GET /api/cards?format=&status=&page=   → listagem paginada
DELETE /api/cards/:id                  → arquivar
GET /api/cards/:id/download            → retorna URL do PNG
```

---

## 2.6 Calendário Editorial

### app/(company)/calendar/page.tsx

```
CalendarPage
├── CalendarHeader          → Mês/Ano + navegação + botão "Agendar Card"
├── MonthGrid               → grid 7 colunas
│   └── DayCell
│       ├── DayNumber
│       └── PostChips       → chips coloridos por tipo (max 3 visíveis + "+N")
└── UpcomingList            → lista de próximos agendamentos abaixo do calendário
```

**Ao clicar em um dia:**
- Modal de agendamento
- Selecionar card da biblioteca (aprovados)
- Definir horário
- Definir plataforma (Instagram, Facebook ou ambos)
- Botão "Agendar"

**API calls:**
```
GET /api/post-queue?month=2026-03       → posts do mês
POST /api/post-queue                    → criar agendamento
DELETE /api/post-queue/:id              → cancelar agendamento
```

---

## 2.7 Postagens (histórico)

### app/(company)/posts/page.tsx

```
PostsPage
├── MetricCards             → Total | Publicados | Agendados | Falhas
├── FilterBar               → status + plataforma + atualizar
└── PostsTable
    ├── Columns: Preview | Legenda | Plataforma | Data | Status | Ações
    └── Actions: Ver | Tentar novamente (se falhou)
```

**Status badges:**
- Publicado (verde)
- Agendado (azul)
- Falhou (vermelho) + botão retry
- Cancelado (cinza)

**API calls:**
```
GET /api/posts?status=&platform=&page=
POST /api/posts/:id/retry              → recolocar na fila
```

---

## 2.8 Integrações (Meta API)

### app/(company)/settings/integrations/page.tsx

Replicar exatamente o que já existe no Juntix (você já tem isso funcionando).

```
IntegrationsPage
├── ConnectedAccount        → @username + status ativo/inativo
├── AccessTokenSection
│   ├── HowToGuide          → instruções colapsáveis (links para Graph Explorer)
│   ├── TokenInput          → Instagram User Access Token
│   ├── BusinessAccountId   → Instagram Business Account ID
│   └── FacebookPageId      → Facebook Page ID
│   └── Actions             → Salvar credenciais | Testar conexão
└── ScheduleConfig
    └── WeeklySlots         → grid dia x horário com checkboxes
```

**API calls:**
```
GET  /api/integrations/meta              → credenciais salvas (mascaradas)
POST /api/integrations/meta              → salvar e criptografar token
POST /api/integrations/meta/test         → testar se token é válido
GET  /api/schedules                      → config de horários
PUT  /api/schedules                      → salvar horários
```

---

## 2.9 Checklist da Etapa 2

- [ ] Login funcionando com JWT
- [ ] Middleware protegendo rotas company
- [ ] Layout da sidebar responsivo
- [ ] Dashboard com métricas reais
- [ ] Gerador de cards (campos mínimos → gerar → preview)
- [ ] Aprovação de card funcionando
- [ ] Biblioteca com filtros e grid
- [ ] Download do card em PNG
- [ ] Calendário com view mensal
- [ ] Modal de agendamento funcionando
- [ ] Histórico de postagens com filtros
- [ ] Tela de integrações Meta API
- [ ] Proteção de features Pro (Starter vê, não usa)

---

## Próxima etapa

→ `05_etapa3_admin_panel.md` — Painel Admin
