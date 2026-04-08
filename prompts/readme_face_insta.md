# Integração Facebook e Instagram (Meta API)

Este documento detalha o fluxo de conexão e integração com a Meta API (Facebook/Instagram) utilizado no CaixaJunto para automação de marketing e postagens.

## 🚀 Visão Geral

A integração permite que o sistema poste automaticamente conteúdos (cards, carrosséis e vídeos) diretamente no Feed ou Stories do Instagram e na Página do Facebook vinculada.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** React (Vite) + Lucide React.
- **Backend:** NestJS + Mongoose (MongoDB).
- **API:** Meta Graph API v25.0.

---

## 🔄 Fluxo de Conexão (OAuth 2.0)

O processo de conexão segue o padrão OAuth da Meta para obter tokens de acesso de longa duração.

### 1. Início do Fluxo (Frontend)
No componente `TabIntegracoes.tsx`, ao clicar no botão **"Conectar com Facebook/Instagram"**, a função `handleConnectFacebook()` é executada.

- **URL de Autorização:** Construída pela função `buildFacebookOAuthUrl()`.
- **Escopos (Permissions):** 
  - `pages_show_list`: Ver as páginas que o usuário gerencia.
  - `pages_read_engagement`: Ler engajamento da página.
  - `business_management`: Gerenciar configurações do negócio.
- **Redirect URI:** Configurada para capturar o código de volta na aba de integrações.

### 2. Consentimento e Callback
O usuário é redirecionado para o Facebook, onde autoriza o aplicativo **Juntix**. Após a autorização, a Meta redireciona de volta para:
`{ORIGIN}/painel-master/marketing?tab=integracoes&fb_callback=1&code={AUTHORIZATION_CODE}`

### 3. Troca do Código por Token (Backend)
O frontend detecta o `code` nos parâmetros da URL e chama o endpoint do backend: `POST /marketing/integration/facebook-callback`.

**Passos Internos no Backend (`MarketingService.ts`):**
1. **Token de Curta Duração:** Troca o `code` pelo `access_token` do usuário (expira em ~2 horas).
2. **Token de Longa Duração:** Troca o token de curta duração por um de longa duração (expira em ~60 dias).
3. **Busca de Páginas:** Lista as páginas do Facebook que o usuário gerencia.
4. **Token da Página:** Obtém o `access_token` específico da página (que não expira se obtido via token de longa duração).
5. **Vínculo Instagram:** Busca o `instagram_business_account` (ID da conta Business) vinculado à página do Facebook.
6. **Persistência:** Salva as credenciais no MongoDB na coleção `MarketingIntegration`.

---

## 💾 Dados Armazenados

Os seguintes campos são essenciais para o funcionamento das postagens:
- `instagramAccessToken`: Token de acesso da Página (usado para publicar no IG e FB).
- `instagramBusinessAccountId`: ID da conta do Instagram Business.
- `facebookPageId`: ID da página do Facebook vinculada.
- `isConnected`: Flag de status da conexão.
- `connectedPageName`: Nome da página ou @username do Instagram.

---

## 📤 Processo de Publicação

As publicações ocorrem via cron job ou gatilho manual através da função `publishPost()` no `MarketingService.ts`.

### Postagem Única (Feed/Stories):
1. Cria um container de mídia no Facebook Graph API.
2. Aguarda o processamento (polling do `status_code`).
3. Executa o `media_publish`.

### Carrossel:
1. Cria containers individuais para cada slide.
2. Cria um container pai do tipo `CAROUSEL` vinculando os IDs dos slides.
3. Aguarda o processamento do container pai.
4. Executa o `media_publish`.

---

## 🧪 Plano de Testes

### Testes Manuais
1. **Conexão:** Clicar em conectar, autorizar no Facebook e verificar se o badge muda para "Conectado" e exibe o nome da conta.
2. **Desconexão:** Clicar em desconectar e verificar se os tokens são limpos do banco de dados.
3. **Teste de Conexão:** Usar o botão "Testar conexão" para validar se o token atual ainda é válido via Graph API.
4. **Postagem Real:** Agendar um post para "agora" e verificar se aparece no Instagram/Facebook em até 2 minutos.

### Testes Automatizados (Fluxo Crítico)
- **Unitário (Jest):** Validar a construção da URL do Facebook no frontend.
- **Integração (Jest):** Mockar as respostas da Meta API no `MarketingService` e validar se o objeto de configuração é salvo corretamente com os IDs esperados.
- **E2E (Playwright):** 
  - Simular o clique no botão de conexão.
  - Validar a presença dos campos de ID e Token.
  - Testar a persistência das configurações após o salvamento manual.

---

### 🗂️ Referências de Código
- **Frontend UI:** `src/pages/GestaoMarketing/TabIntegracoes.tsx`
- **Backend Logic:** `src/modules/marketing/marketing.service.ts`
- **Schema:** `src/modules/marketing/schemas/marketing-integration.schema.ts`
