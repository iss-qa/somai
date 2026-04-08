# Integração Meta/Instagram - Guia Passo a Passo

## Visão Geral
Integração do parceiro com Meta (Facebook/Instagram) para publicação automática de conteúdo.

---

## Fluxo OAuth 2.0 (Automático)

O botão "Conectar com Facebook/Instagram" executa o fluxo OAuth completo:

1. **Frontend** redireciona para `facebook.com/v25.0/dialog/oauth` com escopos
2. Usuário autoriza o app no Facebook
3. Facebook redireciona de volta com `?code=XXX`
4. **Frontend** detecta o `code` e envia para `POST /api/integrations/meta/callback`
5. **Backend** executa:
   - Troca `code` → token de curta duração (~2h)
   - Troca token curto → token de longa duração (~60 dias)
   - Busca páginas do Facebook (`/me/accounts`)
   - Obtém token da página (nunca expira via long-lived)
   - Busca `instagram_business_account` vinculado
   - Salva tudo criptografado no MongoDB

### Variáveis de ambiente necessárias
- `META_APP_ID` - ID do app no Facebook Developers
- `META_APP_SECRET` - Secret do app
- `NEXT_PUBLIC_META_APP_ID` - Mesmo ID, exposto ao frontend

---

## Checklist de Etapas

### Etapa 1 - Conectar conta Meta/Facebook
- Clicar em "Conectar com Facebook/Instagram" na página de Integrações
- Login OAuth automático com Facebook
- Autorizar o app com as permissões solicitadas
- Sistema obtém tokens e credenciais automaticamente
- Status muda para "Conectado / Ativo"

### Etapa 2 - Obter credenciais Meta/Instagram (manual, se necessário)
- Acessar Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Gerar Access Token (clicar em "Gerar Token de Acesso")
- Copiar Instagram Business Account ID (campo `instagram_business_account.id`)
- Copiar Facebook Page ID (campo `id` da página)
- Salvar credenciais no formulário da plataforma

### Etapa 3 - Criar configuração no Facebook Developers
- Acessar painel do app: https://developers.facebook.com/apps/
- Selecionar o app (referência: Juntix - ID: 1490465612677168)
- Ir em Configurações → "Criar configuração"
- Nomear configuração (ex: `integracao_instagram`)
- Vincular ativos de negócio necessários

### Etapa 4 - Gerar Token de Acesso do Sistema
- Tipo: Token de usuário do sistema
- Expiração: **Nunca expira**
- Ativos: Selecionar **todos os ativos** disponíveis
- Copiar e salvar token gerado de forma segura

### Etapa 5 - Selecionar permissões do Instagram
Marcar as seguintes permissões na configuração:

| Permissão | Descrição |
|-----------|-----------|
| `instagram_basic` | Ler conteúdo de mídia e perfil |
| `instagram_branded_content_creator` | Ler/alterar status de conteúdo patrocinado |
| `instagram_content_publish` | Criar publicações de foto e vídeo no feed |
| `instagram_manage_comments` | Gerenciar comentários nas publicações |
| `instagram_manage_insights` | Acessar métricas e analytics |
| `pages_show_list` | Listar páginas do Facebook |
| `pages_read_engagement` | Ler engajamento das páginas |
| `pages_manage_posts` | Gerenciar publicações das páginas |
| `business_management` | Ler/escrever no Gerenciador de Negócios |
| `ads_management` | Gerenciar anúncios (se aplicável) |
| `ads_read` | Ler informações de anúncios |
| `catalog_management` | Gerenciar catálogos de produtos |

### Etapa 6 - Salvar e testar conexão
- Preencher campos na página de Integrações do Soma.ai
- Clicar em "Salvar credenciais"
- Clicar em "Testar conexão"
- Verificar se o status muda para "Conectado / Ativo"

---

## URLs de Referência

| Recurso | URL |
|---------|-----|
| Graph API Explorer | https://developers.facebook.com/tools/explorer/ |
| Facebook Developers Apps | https://developers.facebook.com/apps/ |
| Páginas do Facebook | https://www.facebook.com/pages/?category=your_pages |
| Documentação Graph API | https://developers.facebook.com/docs/graph-api/ |
| Documentação Instagram API | https://developers.facebook.com/docs/instagram-api/ |

---

## Requisitos
- Conta Instagram do tipo Business ou Creator
- Conta Instagram vinculada a uma Página do Facebook
- Acesso de administrador ao app no Facebook Developers
- Portfólio empresarial configurado (Business Manager)

---

## Notas
- O token de sistema (nunca expira) é preferível ao token de usuário (expira em 60 dias)
- As credenciais são criptografadas (AES-256-GCM) antes de salvar no banco
- O token é mascarado na interface (primeiros 8 + ... + últimos 4 caracteres)
- App de referência: **Juntix** (ID: 1490465612677168)
