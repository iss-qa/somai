# CONTEXTO DO PROJETO

Você é um desenvolvedor sênior full-stack trabalhando na plataforma **Soma.ai**
(somai.issqa.com.br), um SaaS B2B de marketing automatizado com IA para pequenas
empresas brasileiras.

Stack atual: Next.js 14, Fastify, MongoDB, BullMQ/Redis, Evolution API (WhatsApp),
Cloudflare R2.

---

# OBJETIVO

Implementar um fluxo completo de **onboarding pós-cadastro**, com comunicação
automatizada via WhatsApp, modal de integração com pré-condições, opção de
delegação de setup, e painel admin para gestão dos setups pendentes.

---

# FUNCIONALIDADES A IMPLEMENTAR

---

## 1. FLUXO DE MENSAGENS WHATSAPP PÓS-CADASTRO (Evolution API)

### Mensagem 1 — Boas-vindas (imediata, já existe)
Disparada no momento do cadastro. Já implementada.

### Mensagem 2 — Orientação de pré-condições (delay de 5 minutos)

Usar BullMQ com `delay: 5 * 60 * 1000` para enfileirar o envio após o cadastro.

Conteúdo da mensagem:

---
Olá {primeiro_nome}! 😊

Para a gente começar a publicar nas suas redes sociais, você precisa de
3 coisas prontas:

1️⃣ *Página no Facebook* — não pode ser perfil pessoal, precisa ser uma Página
2️⃣ *Instagram Profissional* — conta Comercial ou Criador de Conteúdo
3️⃣ *Instagram vinculado à sua Página do Facebook*

Não sabe como fazer? Preparamos um guia passo a passo pra você 👇
🔗 somai.issqa.com.br/guia-setup

Depois de preparar tudo, você tem duas opções:
✅ Fazer a integração você mesmo direto no painel
✅ Agendar com nosso time pra fazer junto

Qualquer dúvida é só responder aqui! 🚀
— Time Soma.ai
---

### Mensagem 3 — Lembrete (24h após cadastro, se setup não concluído)

---
Oi {primeiro_nome}! Tudo bem?

Notamos que sua conta {nome_empresa} ainda não conectou as redes sociais. 😊

Quer que nosso time faça o setup pra você?
👉 somai.issqa.com.br/agendar-setup

Estamos aqui pra ajudar!
---

---

## 2. PÁGINA DE GUIA — /guia-setup (pública, sem login)

Página educativa com 3 seções em accordion ou steps:

### Seção 1 — Criar uma Página no Facebook
- Passo a passo textual com prints ilustrativos
- URL de referência: facebook.com/pages/create
- Passos: Entrar no Facebook → Menu → Páginas → Criar nova Página →
  Preencher nome da empresa → Categoria → Criar

### Seção 2 — Tornar o Instagram uma conta Profissional
- Passo a passo com prints:
  1. Abrir Instagram → Perfil → Menu (≡) → Configurações
  2. Conta → Tipo de conta → Mudar para Conta Profissional
  3. Escolher: Comercial (empresas) ou Criador de Conteúdo
  4. Selecionar categoria do negócio

### Seção 3 — Vincular Instagram à Página do Facebook
- Passo a passo:
  1. No Instagram → Configurações → Conta → Conta vinculada ao Facebook
  2. Entrar com Facebook → Selecionar a Página correta
  3. Confirmar vínculo
- Alternativa pelo Facebook:
  Página → Configurações → Instagram → Conectar conta

### CTA final da página
Dois botões:
- "Já fiz tudo — quero integrar agora" → redireciona para /integracoes (requer login)
- "Prefiro agendar com o time" → abre modal de agendamento

---

## 3. MODAL DE INTEGRAÇÃO — pré-tela de /integracoes

Quando o usuário clicar em "Integrações" no menu (durante o período de trial),
ANTES de mostrar a tela de integrações, exibir um modal bloqueante em steps.

### Regra de exibição:
- Mostrar modal se: `empresa.integracaoConfigurada === false`
- Após conclusão do fluxo, setar flag e não exibir novamente

### Step 1 — Pré-condições
Título: "Antes de integrar, confirme:"

Checklist interativo (o usuário marca cada item):
☐ Tenho uma Página criada no Facebook
☐ Meu Instagram está como conta Comercial ou Criador
☐ Meu Instagram está vinculado à minha Página do Facebook

Botão "Não sei como fazer" → abre /guia-setup em nova aba
Botão "Tudo pronto, continuar" → avança para Step 2 (ativo só após marcar os 3)

### Step 2 — Escolha do método de setup

Título: "Como prefere configurar?"

Opção A (card clicável):
🔧 Integrar eu mesmo
Você conecta suas redes direto no painel.
Rápido, seguro, feito em minutos.
→ Fecha modal → exibe tela de integrações normalmente

Opção B (card clicável):
📅 Agendar com o time Soma.ai
Nossa equipe faz uma reunião de setup com você.
Guiamos cada passo em tempo real.
→ Avança para Step 3A

Opção C (card clicável):
🔑 Delegar para o time Soma.ai
Você fornece os dados de acesso e a gente configura tudo.
Prazo: até 24 horas úteis.
→ Avança para Step 3B

### Step 3A — Agendamento de reunião

Título: "Agendar reunião de setup"

Campos:
- Nome completo (pré-preenchido com dados da conta)
- WhatsApp (pré-preenchido)
- Data preferida (datepicker — dias úteis, próximos 7 dias)
- Horário preferido (select: 09h, 10h, 11h, 14h, 15h, 16h, 17h)
- Observações (textarea opcional)

Ao submeter:
- Salvar agendamento em `db.setupAgendamentos` com status `pendente`
- Enviar WhatsApp para o cliente confirmando solicitação
- Enviar notificação WhatsApp para o admin da Soma.ai
- Fechar modal com mensagem de confirmação

### Step 3B — Delegação com credenciais

Título: "Fornecer dados de acesso"

⚠️ Banner de aviso (obrigatório, não pode ser fechado antes de ler):
"Seus dados são armazenados de forma criptografada e usados exclusivamente
para a configuração inicial. O time Soma.ai assina acordo de confidencialidade.
Você pode revogar o acesso a qualquer momento após o setup."

Campos:
- Nome da conta / rede social (ex: @minhaempresa)
- E-mail de acesso
- Senha (campo tipo password, com toggle mostrar/ocultar)
- Plataforma (checkbox: Facebook, Instagram, ambos)
- Observações adicionais (textarea)

Ao submeter:
- Criptografar senha com AES-256 antes de salvar
- Salvar em `db.setupCredenciais` com status `aguardando_setup`
  vinculado ao `empresaId`
- Enviar WhatsApp ao cliente:
  "✅ Recebemos seus dados! O time Soma.ai iniciará o setup em até 24 horas úteis.
   Você receberá uma mensagem assim que começarmos. — Time Soma.ai"
- Fechar modal com confirmação

---

## 4. PAINEL ADMIN — Tela de Setups Pendentes

Rota: /admin/setups
Acesso: somente usuários com role `master_admin`

### Tabela de setups pendentes

Colunas:
- Empresa / Cliente
- Tipo (Agendado | Credenciais fornecidas)
- Data solicitação
- Status (Aguardando | Em andamento | Concluído)
- Ações

### Ação: "Dar início ao setup"

Ao clicar:
- Abre modal de confirmação com os dados da empresa:
  - Nome, WhatsApp, tipo de setup
  - Se credenciais: exibe e-mail + botão "Revelar senha" (log de acesso registrado)
  - Se agendado: exibe data/hora agendada

- Botão "Confirmar início" → executa:
  1. Atualiza status para `em_andamento` no banco
  2. Registra `adminId`, `dataInicio` no documento
  3. Dispara WhatsApp para o cliente via Evolution API:

---
Olá {primeiro_nome}! 🚀

O time da *Soma.ai* deu início ao setup da sua conta *{nome_empresa}*.

⏱ Prazo estimado: até *48 horas úteis*

Você receberá uma nova mensagem assim que tudo estiver pronto.
Qualquer dúvida, é só responder aqui!

— Time Soma.ai
---

### Ação: "Marcar como concluído"

- Atualiza status para `concluido`
- Seta `empresa.integracaoConfigurada = true`
- Dispara WhatsApp final para o cliente:

---
✅ {primeiro_nome}, o setup da *{nome_empresa}* foi concluído!

Suas redes já estão conectadas e a Soma.ai já pode publicar por você.

👉 Acesse o painel e veja tudo pronto: somai.issqa.com.br/dashboard

Boas publicações! 🎉
— Time Soma.ai
---

---

## 5. MODELO DE DADOS — MongoDB

### Collection: setupAgendamentos
```json
{
  "_id": ObjectId,
  "empresaId": ObjectId,
  "tipo": "agendamento",
  "nome": String,
  "whatsapp": String,
  "dataPreferida": Date,
  "horarioPreferido": String,
  "observacoes": String,
  "status": "pendente | em_andamento | concluido",
  "adminId": ObjectId | null,
  "dataInicio": Date | null,
  "dataConclusao": Date | null,
  "criadoEm": Date
}
```

### Collection: setupCredenciais
```json
{
  "_id": ObjectId,
  "empresaId": ObjectId,
  "tipo": "credenciais",
  "nomeConta": String,
  "email": String,
  "senhaCriptografada": String,
  "plataformas": ["facebook", "instagram"],
  "observacoes": String,
  "status": "aguardando_setup | em_andamento | concluido",
  "adminId": ObjectId | null,
  "dataInicio": Date | null,
  "dataConclusao": Date | null,
  "acessosAdmin": [{ "adminId": ObjectId, "dataAcesso": Date }],
  "criadoEm": Date
}
```

---

## 6. REGRAS GERAIS DE IMPLEMENTAÇÃO

- Durante o trial, bloquear todas as rotas exceto `/dashboard` e `/integracoes`
- O modal de integração tem prioridade sobre a tela — só exibir a tela após conclusão
- Toda senha fornecida deve ser criptografada com AES-256 antes de persistir
- Todo acesso à senha descriptografada deve ser logado em `acessosAdmin`
- As mensagens WhatsApp devem ser enfileiradas no BullMQ, nunca disparadas de forma síncrona
- Todos os textos das mensagens devem suportar variáveis: {primeiro_nome}, {nome_empresa}
- A página /guia-setup deve ser acessível sem login (para uso externo via link no WhatsApp)