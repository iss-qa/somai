# PROMPT DE DESENVOLVIMENTO — SOMA.AI v2.0

## CONTEXTO

Você é um desenvolvedor sênior full-stack da plataforma **Soma.ai**
(somai.issqa.com.br), SaaS B2B de marketing automatizado com IA para pequenas
empresas brasileiras.

Stack atual: Next.js 14, Fastify, MongoDB, BullMQ/Redis, Evolution API,
Cloudflare R2, Gemini API.

A versão 2.0 é uma evolução completa da plataforma. A inspiração de UX/produto
é o BestContent AI (social2.bestcontent.ai). O objetivo é transformar a Soma.ai
de uma ferramenta de geração de posts em um **sistema operacional completo de
marketing**, com onboarding inteligente, gamificação, comunidade e geração de
conteúdo multi-formato.

---

## 1. ONBOARDING INTELIGENTE — "Vamos agilizar!"

### Tela inicial do onboarding
Exibida logo após o cadastro, antes do dashboard.

Título: **"Vamos agilizar!"**
Subtítulo: "Podemos preencher quase tudo automaticamente usando IA"

Dois cards de entrada:

**Card 1 — Tenho um Website**
- Campo de URL
- A IA acessa o site, extrai: nome da marca, cores, tom de voz, descrição,
  público-alvo
- Usa Puppeteer + Gemini Vision para análise

**Card 2 — Tenho Instagram** *(destaque visual, borda roxa)*
- Botão "Conectar Instagram"
- Subtexto: "Requer conta Business ou Creator"
- Fluxo OAuth via Instagram Graph API
- Após autorização: analisar os últimos 12 posts, logo do perfil, bio,
  nome da conta, categoria

**Botão principal:** "Analisar e Preencher" → ativo após selecionar uma opção

**Link secundário:** "Preencher manualmente" → pula para o wizard sem análise

---

### Tela de resultado da análise — "Analisamos sua marca!"

Exibida após análise do Instagram ou website.

Componentes:
- Badge: "Fonte: 🛍️ @nomeconta"
- Card verde de sucesso: "Logo detectada!" com preview da logo + paleta de
  cores extraída automaticamente (3 círculos coloridos)
- Lista de itens preenchidos automaticamente, cada um com ícone ✓ e botão
  de edição ✏️:
  - Dados Básicos
  - Público-alvo
  - Estilo Visual
  - Tom de Voz

**Botão principal:** "Tudo certo! Continuar"
**Link secundário:** "Quero ajustar manualmente" → abre o wizard editável

---

## 2. WIZARD DE CONFIGURAÇÃO — 5 PASSOS

Barra de progresso linear no topo. Ícones de etapa clicáveis após
completadas. Botões "Voltar" e "Continuar →" no rodapé fixo.

---

### Passo 1 — Objetivo

Título: "Qual seu principal objetivo?"
Subtítulo: "Vamos começar entendendo sua meta principal"

4 cards clicáveis (seleção única):
- 📈 **Vender mais produtos/serviços** — Aumentar vendas e conversões
- ✨ **Construir autoridade** — Se tornar referência no seu nicho
- ❤️ **Aumentar engajamento** — Criar comunidade ativa
- 👥 **Gerar leads qualificados** — Captar potenciais clientes

Salvar em: `empresa.objetivo`

---

### Passo 2 — Marca

Título: "Conte sobre sua marca"
Subtítulo: "Informações básicas para personalizarmos seu conteúdo"

Campos:
- **Nome da Marca** (input, pré-preenchido pela análise)
- **O que a marca faz?** (textarea — descreva o negócio, produto ou serviço)

Seção expansível **"Configurações avançadas"**:
- Tag / Rótulo (opcional) — ex: #divasjoias
- Site da marca (opcional)
- Localização principal (cidade/estado)

Salvar em: `empresa.marca`

---

### Passo 3 — Público

Título: "Quem é seu público-alvo?"
Subtítulo: "Descreva as pessoas que você quer alcançar"

Campos:
- **Quem é o cliente ideal?** (textarea — idade, gênero, localização,
  profissão, estilo de vida) — pré-preenchido pela análise de IA
- Seção expansível **"Configurações avançadas"**:
  - **Quais são as dores e problemas desse público?** (opcional) —
    pré-preenchido
  - **Quais são os desejos e sonhos desse público?** (opcional) —
    pré-preenchido

Salvar em: `empresa.publico`

---

### Passo 4 — Identidade

Título: "Qual a personalidade da sua marca?"
Subtítulo: "Como você quer que as pessoas percebam sua marca?"

**Tom de voz** — seleção múltipla de tags clicáveis (mínimo 1, máximo 4):
`Descontraído` `Profissional` `Inspirador` `Educativo` `Divertido`
`Acolhedor` `Direto` `Sofisticado` `Amigável` `Motivacional`

Seção expansível **"Configurações avançadas"**:
- **Se a marca fosse uma pessoa, como ela seria?** (textarea opcional)
  — pré-preenchido pela IA com base nos posts analisados

Salvar em: `empresa.identidade`

---

### Passo 5 — Estilo Visual

Título: "Como é o visual da sua marca?"
Subtítulo: "Vamos garantir que os posts tenham a sua cara"

Campos:
- **Paleta de cores** — 3 pickers coloridos (pré-preenchidos pela análise
  da logo)
- **Upload de logo** (se não detectada automaticamente)
- **Estilo visual** — seleção única:
  `Minimalista` `Colorido` `Elegante` `Moderno` `Rústico` `Feminino`
  `Corporativo`
- **Fontes preferidas** (opcional) — input de texto

Salvar em: `empresa.estiloVisual`

---

## 3. DASHBOARD v2.0

Layout de 3 colunas: lateral esquerda (gamificação) + centro (feed/ações)
+ lateral direita (comunidade/dicas).

---

### Coluna esquerda — Gamificação

**Card de Ranking**
- Mês atual (ex: "Ranking de Abril")
- Créditos acumulados no período
- Nível atual: INICIANTE / INTERMEDIÁRIO / AVANÇADO / EXPERT
- Barra de XP com progresso para o próximo nível (ex: 0/350 XP)

**Card Ofensiva (streak)**
- Ícone de raio laranja
- Número de dias seguidos postando
- Texto motivacional: "X dias seguidos!" ou "Comece sua ofensiva hoje!"

**Card Missões** (com link "Ver todas")
- Lista de até 3 missões ativas com recompensa em XP:
  - ⚡ Analise uma inspiração +5 XP →
  - ⚡ Gere 1 post hoje +10 XP →
  - 📅 Crie um calendário +100 XP →

---

### Coluna central — Área principal

**Banner "Próximo passo"** (dismiss após conclusão):
- Ícone mascote Soma
- Título: "Gere seu primeiro post"
- Subtítulo: "Crie conteúdo incrível com ajuda da IA"
- Progress: X/3 completas
- Botão "Ir →"

**Seção "Últimos posts da comunidade"**
- Carrossel horizontal de avatars/thumbnails de posts de outros usuários
- Clicável para ver o post e se inspirar
- Configurações (ícone ⚙️)

**Dashboard da empresa** — cards de métricas:
- TOTAL DE POSTS (com % de variação)
- PAUTAS PARA CRIAR (próximos 30 dias)
- AGENDADOS (para esta semana)
- CRÉDITOS IA (com barra de uso e nome do plano)

**Botões de ação rápida:**
- 📅 Agendamento
- ✚ Criar Post

**Seção "Suas Últimas Criações"** (com link "Ver biblioteca →")
- Grid de posts gerados
- Estado vazio: "Você ainda não criou nenhum post" + botão "Criar primeiro post"

**Seção de Sugestões da IA**
- Mascote animado + "A IA está buscando sugestões para você!"
- Botão "Ver inspirações"

---

### Coluna direita — Comunidade e Dicas

**Card Comunidade** (com link "Ver mais →")
- Badge "Dúvidas" + "Publicação no Instagram"
- Botão "Ganhe 100 Créditos" (CTA de engajamento)

**Card Próximas Datas**
- Lista de datas comemorativas do segmento do cliente
- Estado vazio: "Nenhuma data comemorativa encontrada"

**Card Dica Rápida**
- Dica contextual gerada pela IA (ex: "Comece a legenda com um gancho forte.")
- Rotativa a cada sessão

---

## 4. SISTEMA DE GAMIFICAÇÃO

### Moedas e Pontos

| Moeda | Nome | Uso |
|---|---|---|
| XP | Pontos na Fé... ops, Pontos Soma | Subir de nível |
| 🪙 | Créditos IA | Consumir features de IA |

### Níveis
- INICIANTE: 0–349 XP
- INTERMEDIÁRIO: 350–999 XP
- AVANÇADO: 1000–2499 XP
- EXPERT: 2500+ XP

### Ações que geram XP/Créditos
- Gerar 1 post: +10 XP
- Agendar post: +5 XP
- Publicar post: +15 XP
- Analisar inspiração: +5 XP
- Completar wizard de setup: +50 XP
- Criar calendário do mês: +100 XP
- Streak de 7 dias: +50 XP bônus
- Convidar empresa: +100 Créditos

### Ofensiva (streak)
- Incrementa 1 por dia que o usuário gera ou agenda pelo menos 1 post
- Zera se passar 24h sem ação
- Proteção de ofensiva: consumir 200 Créditos para não zerar

### Ranking mensal
- Ranking por empresa baseado em Créditos acumulados no mês
- Reset todo dia 1º
- Top 3 ganham bônus de Créditos

### Missões
- Banco de missões no MongoDB: `db.missoes`
- Missões diárias (reset 00h), semanais, únicas (onboarding)
- Cada missão tem: título, descrição, tipo, recompensa XP, recompensa créditos,
  condição de conclusão, ícone

---

## 5. MENU PRINCIPAL — Navegação v2.0

Itens do menu superior/lateral:
- **Dashboard** — visão geral
- **+ Criar** — criar post, vídeo, carrossel, roteiro (CTA destacado)
- **Inspiração** — feed de posts da comunidade + tendências do nicho
- **Biblioteca** — todos os conteúdos criados, organizados por formato
- **Calendário** — agendamentos e datas comemorativas
- **Comunidade** — fórum/feed de dúvidas e posts de outros usuários
- **Jornada** — missões, conquistas, ranking (ícone de troféu)

---

## 6. TELA DE CRIAÇÃO DE CONTEÚDO — Criar v2.0

Substituir o fluxo atual por um criador multi-formato:

### Formatos disponíveis
- 🖼️ Card / Post estático
- 🎠 Carrossel
- 🎬 Vídeo curto (Reels)
- 📝 Roteiro / Script
- 💬 Legenda apenas
- 📧 Mensagem WhatsApp

### Fluxo de criação
1. Escolher formato
2. Briefing rápido (objetivo do post, produto/serviço, destaque)
3. IA gera variações (3 opções)
4. Usuário seleciona, edita, aprova
5. Publicar agora / Agendar / Salvar na biblioteca

### Editor visual
- Canvas de preview do post com as cores e logo da marca
- Troca de template com 1 clique
- Campo de edição de copy inline
- Seletor de hashtags sugeridas pela IA

---

## 7. TELA DE INSPIRAÇÃO

- Feed de posts criados por outras empresas na plataforma (anonimizados
  por segmento)
- Filtros: por nicho, formato, objetivo, engajamento
- Botão "Usar como base" → abre criador com briefing pré-preenchido
- Botão "Salvar" → salva na biblioteca de inspirações do usuário
- Ação "Salvar inspiração" gera +5 XP (missão)

---

## 8. TELA DE CALENDÁRIO

- Visão mensal com posts agendados
- Datas comemorativas do segmento destacadas automaticamente
- Drag and drop para reagendar
- Botão "Gerar calendário do mês com IA" → gera pauta completa do mês
  baseada no objetivo e público da empresa → +100 XP ao concluir

---

## 9. TELA DE COMUNIDADE

- Feed de perguntas e respostas entre usuários
- Tags por tema: Instagram, Facebook, WhatsApp, IA, Estratégia
- Sistema de upvote
- Resposta da IA para dúvidas frequentes (moderada pelo admin)
- CTA "Ganhe 100 Créditos" ao fazer primeira pergunta ou primeira resposta

---

## 10. TELA DE JORNADA (Gamificação completa)

Seções:
- **Ranking do mês** — tabela com foto, nome da empresa, créditos
- **Minhas Conquistas** — badges desbloqueadas (primeiro post, 7 dias de
  ofensiva, 50 posts criados etc.)
- **Missões ativas** — diárias + semanais + especiais
- **Histórico de XP** — log de ações e pontos ganhos

---

## 11. MODELO DE DADOS — Novos schemas MongoDB

### empresa (atualizado)
```json
{
  "objetivo": String,
  "marca": {
    "nome": String,
    "descricao": String,
    "tag": String,
    "site": String,
    "localizacao": String
  },
  "publico": {
    "clienteIdeal": String,
    "dores": String,
    "desejos": String
  },
  "identidade": {
    "tomDeVoz": [String],
    "personalidade": String
  },
  "estiloVisual": {
    "cores": [String],
    "logoUrl": String,
    "estilo": String,
    "fontes": String
  },
  "onboardingCompleto": Boolean,
  "instagramConectado": Boolean,
  "instagramHandle": String
}
```

### gamificacao (por empresa)
```json
{
  "empresaId": ObjectId,
  "xp": Number,
  "nivel": String,
  "creditos": Number,
  "ofensiva": Number,
  "ultimaAtividade": Date,
  "rankingMes": Number,
  "creditosMes": Number,
  "conquistasIds": [ObjectId],
  "missoesCompletasIds": [ObjectId]
}
```

### missoes
```json
{
  "_id": ObjectId,
  "titulo": String,
  "descricao": String,
  "tipo": "diaria | semanal | unica",
  "recompensaXP": Number,
  "recompensaCreditos": Number,
  "icone": String,
  "condicao": String,
  "ativo": Boolean
}
```

### inspiracoes (comunidade)
```json
{
  "_id": ObjectId,
  "empresaId": ObjectId,
  "segmento": String,
  "formato": String,
  "imageUrl": String,
  "copy": String,
  "objetivo": String,
  "upvotes": Number,
  "salvamentos": Number,
  "anonimizado": Boolean,
  "criadoEm": Date
}
```

---

## 12. REGRAS GERAIS DE IMPLEMENTAÇÃO

- O onboarding substitui o acesso direto ao dashboard no primeiro login
- Wizard pode ser retomado se o usuário fechar antes de concluir
- Toda ação relevante deve disparar evento de gamificação via BullMQ
  (não síncrono)
- O sistema de créditos é desacoplado do sistema de planos — créditos
  podem ser ganhos por ações mesmo no plano gratuito
- A comunidade exibe posts de outras empresas sempre anonimizados,
  agrupados por segmento, nunca por empresa individualmente (LGPD)
- O mascote Soma (personagem roxa) deve aparecer em estados vazios,
  onboarding e mensagens motivacionais
- Toda tela deve ter estado vazio ilustrado com mascote + CTA claro
- Mobile-first: todas as telas devem funcionar em 375px+