import {
  MessageHistory,
  TipoMensagem,
  StatusMensagem,
  Company,
} from '@soma-ai/db'
import { EvolutionService } from './evolution.service'
import { LogService } from './log.service'
import whatsappQueue from '../queues/whatsapp.queue'

const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'SOMA_AI'

// Detect if we should skip the queue (serverless env with no real Redis, or explicit opt-out)
function shouldSkipQueue(): boolean {
  if (process.env.DISABLE_QUEUE === 'true') return true
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) return true
  const redisUrl = process.env.REDIS_URL || ''
  // No Redis URL or points to local (won't work in production)
  if (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
    return true
  }
  return false
}

function formatPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, '')
  return cleaned.length <= 11 ? '55' + cleaned : cleaned
}

// ── Message Templates ────────────────────────────────

function templateBoasVindas(companyName: string, responsavel: string): string {
  return `Ola *${responsavel}*! 👋

Seja bem-vindo ao *Soma.ai* - Sua inteligencia artificial para redes sociais! 🚀

Sua empresa *${companyName}* foi cadastrada com sucesso na plataforma.

*O que o Soma.ai faz por voce?* 💡
✅ *Cards automaticos* - Criacao inteligente de posts para suas redes
✅ *Agendamento* - Publique no melhor horario automaticamente
✅ *Multi-plataforma* - Instagram e Facebook integrados
✅ *IA Generativa* - Textos, imagens e videos com IA

📲 *Proximos passos:*
Acesse o painel e configure suas integracoes para comecar a publicar!

💬 Duvidas? Entre em contato com nosso suporte.

_Mensagem automatica - Soma.ai_`
}

function templateCardPublicado(
  companyName: string,
  cardName: string,
  dataHora: string,
  platform: string,
): string {
  return `📢 *Publicacao realizada!*

Ola *${companyName}*,

O card *${cardName}* foi publicado com sucesso no *${platform}* em *${dataHora}*.

Acesse o Instagram para visualizar a postagem. 📱

_Mensagem automatica - Soma.ai_`
}

function templateCardAgendado(
  companyName: string,
  cardName: string,
  dataAgendamento: string,
  platform: string,
): string {
  return `📅 *Card agendado!*

Ola *${companyName}*,

O card *${cardName}* foi agendado para publicacao no *${platform}* em *${dataAgendamento}*.

Acompanhe pelo painel o status da publicacao.

_Mensagem automatica - Soma.ai_`
}

function templateLembreteMensalidade(
  responsavel: string,
  companyName: string,
  valor: string,
  dataVencimento: string,
  diasRestantes: number,
): string {
  return `Ola *${responsavel}*,

Sua mensalidade do *Soma.ai* para a empresa *${companyName}* no valor de *R$ ${valor}* vence em *${diasRestantes} dia(s)* (*${dataVencimento}*).

Mantenha sua assinatura em dia para nao perder acesso a plataforma.

_Mensagem automatica - Soma.ai_`
}

function templateBoletoSetup(
  responsavel: string,
  companyName: string,
  valor: string,
  linkBoleto: string,
): string {
  return `Ola *${responsavel}*,

O boleto de *SETUP* da empresa *${companyName}* no valor de *R$ ${valor}* foi gerado.

📄 *Link do Boleto/Fatura:*
${linkBoleto}

Apos o pagamento, sua conta sera ativada automaticamente.

_Mensagem automatica - Soma.ai_`
}

function templateBoletoMensalidade(
  responsavel: string,
  companyName: string,
  valor: string,
  dataVencimento: string,
  linkBoleto: string,
): string {
  return `Ola *${responsavel}*,

O boleto da mensalidade do *Soma.ai* para *${companyName}* foi gerado.

💰 *Valor:* R$ ${valor}
📅 *Vencimento:* ${dataVencimento}

📄 *Link do Boleto/Fatura:*
${linkBoleto}

_Mensagem automatica - Soma.ai_`
}

function templateConfirmacaoPagamento(
  responsavel: string,
  companyName: string,
  valor: string,
  referencia: string,
): string {
  return `✅ *Pagamento confirmado!*

Ola *${responsavel}*,

O pagamento da empresa *${companyName}* no valor de *R$ ${valor}*, referente a *${referencia}*, foi confirmado com sucesso.

Obrigado por manter sua assinatura em dia! 🎉

_Mensagem automatica - Soma.ai_`
}

function templateAlertaAtraso(
  responsavel: string,
  companyName: string,
  valor: string,
  diasAtraso: number,
): string {
  return `🚨 *ALERTA DE ATRASO*

Ola *${responsavel}*,

A mensalidade da empresa *${companyName}* esta com *${diasAtraso} dias de atraso*.

💰 *Valor:* R$ ${valor}

⚠️ Regularize o pagamento para evitar o bloqueio do acesso a plataforma.

_Mensagem automatica - Soma.ai_`
}

function templateTrialExpirando(
  responsavel: string,
  companyName: string,
  diasRestantes: number,
): string {
  return `⏳ *Periodo de teste expirando!*

Ola *${responsavel}*,

O periodo de teste gratuito da empresa *${companyName}* no Soma.ai expira em *${diasRestantes} dia(s)*.

Assine um plano para continuar utilizando todos os recursos da plataforma!

_Mensagem automatica - Soma.ai_`
}

function templateAcessoBloqueado(
  responsavel: string,
  companyName: string,
): string {
  return `🔒 *Acesso bloqueado*

Ola *${responsavel}*,

O acesso da empresa *${companyName}* ao Soma.ai foi *bloqueado* por falta de pagamento.

Entre em contato com nosso suporte para regularizar sua situacao.

_Mensagem automatica - Soma.ai_`
}

function templateErroPostagem(
  companyName: string,
  cardName: string,
  platform: string,
  motivo: string,
): string {
  return `⚠️ *Erro na publicacao*

Ola *${companyName}*,

Ocorreu um erro ao publicar o card *${cardName}* no *${platform}*.

❌ *Motivo:* ${motivo}

Verifique suas integracoes no painel e tente republicar. Se o problema persistir, entre em contato com o suporte.

_Mensagem automatica - Soma.ai_`
}

function templatePreCondicoesSetup(primeiroNome: string): string {
  return `Ola ${primeiroNome}! 😊

Para a gente comecar a publicar nas suas redes sociais, voce precisa de 3 coisas prontas:

1️⃣ *Pagina no Facebook* — nao pode ser perfil pessoal, precisa ser uma Pagina
2️⃣ *Instagram Profissional* — conta Comercial ou Criador de Conteudo
3️⃣ *Instagram vinculado a sua Pagina do Facebook*

Nao sabe como fazer? Preparamos um guia passo a passo pra voce 👇
🔗 somai.issqa.com.br/guia-setup

Depois de preparar tudo, voce tem duas opcoes:
✅ Fazer a integracao voce mesmo direto no painel
✅ Agendar com nosso time pra fazer junto

Qualquer duvida e so responder aqui! 🚀
— Time Soma.ai`
}

function templateLembreteSetup(primeiroNome: string, nomeEmpresa: string): string {
  return `Oi ${primeiroNome}! Tudo bem?

Notamos que sua conta *${nomeEmpresa}* ainda nao conectou as redes sociais. 😊

Quer que nosso time faca o setup pra voce?
👉 somai.issqa.com.br/agendar-setup

Estamos aqui pra ajudar!`
}

function templateConfirmacaoAgendamento(primeiroNome: string): string {
  return `✅ *Agendamento recebido!*

Ola ${primeiroNome}!

Recebemos sua solicitacao de agendamento de setup. Nossa equipe vai entrar em contato para confirmar o horario.

Qualquer duvida, e so responder aqui! 😊
— Time Soma.ai`
}

function templateConfirmacaoCredenciais(primeiroNome: string): string {
  return `✅ Recebemos seus dados! O time Soma.ai iniciara o setup em ate 24 horas uteis.

Voce recebera uma mensagem assim que comecarmos.

— Time Soma.ai`
}

function templateSetupIniciado(primeiroNome: string, nomeEmpresa: string): string {
  return `Ola ${primeiroNome}! 🚀

O time da *Soma.ai* deu inicio ao setup da sua conta *${nomeEmpresa}*.

⏱ Prazo estimado: ate *48 horas uteis*

Voce recebera uma nova mensagem assim que tudo estiver pronto.
Qualquer duvida, e so responder aqui!

— Time Soma.ai`
}

function templateSetupConcluido(primeiroNome: string, nomeEmpresa: string): string {
  return `✅ ${primeiroNome}, o setup da *${nomeEmpresa}* foi concluido!

Suas redes ja estao conectadas e a Soma.ai ja pode publicar por voce.

👉 Acesse o painel e veja tudo pronto: somai.issqa.com.br/dashboard

Boas publicacoes! 🎉
— Time Soma.ai`
}

// ── Service ──────────────────────────────────────────

export class ComunicacaoService {
  /**
   * Create a history record and enqueue a WhatsApp text message.
   */
  static async enviarMensagem(params: {
    company_id: string
    company_name: string
    destinatario_nome: string
    destinatario_telefone: string
    tipo: TipoMensagem
    conteudo: string
    metadata?: Record<string, any>
    delay?: number
    priority?: number
  }) {
    const historico = await MessageHistory.create({
      company_id: params.company_id,
      company_name: params.company_name,
      destinatario_nome: params.destinatario_nome,
      destinatario_telefone: params.destinatario_telefone,
      tipo: params.tipo,
      conteudo: params.conteudo,
      status: StatusMensagem.PENDENTE,
      metadata: params.metadata || {},
    })

    const skipQueue = shouldSkipQueue()

    if (!skipQueue) {
      try {
        await Promise.race([
          whatsappQueue.add(
            'send_text',
            {
              historicoId: historico._id.toString(),
              phoneNumber: params.destinatario_telefone,
              message: params.conteudo,
              instanceName: EVOLUTION_INSTANCE,
            },
            {
              priority: params.priority || 5,
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
              delay: params.delay || 0,
            },
          ),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Queue timeout')), 3000),
          ),
        ])
        return historico
      } catch (queueErr: any) {
        console.warn('[comunicacao] Queue unavailable, falling back to direct:', queueErr.message)
      }
    }

    // Direct send via Evolution API
    try {
      const phone = formatPhone(params.destinatario_telefone)
      await EvolutionService.sendText(EVOLUTION_INSTANCE, phone, params.conteudo)
      await MessageHistory.findByIdAndUpdate(historico._id, {
        status: StatusMensagem.ENVIADO,
        data_envio: new Date(),
      })
      console.log(`[comunicacao] Sent to ${params.destinatario_nome} (${phone})`)
    } catch (directErr: any) {
      console.error('[comunicacao] Direct send failed:', directErr.message)
      await MessageHistory.findByIdAndUpdate(historico._id, {
        status: StatusMensagem.FALHA,
        error_message: directErr.message,
      })
    }

    return historico
  }

  // ── Template-based senders ─────────────────────────

  static async enviarBoasVindas(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateBoasVindas(company.name, company.responsible_name)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.BOAS_VINDAS,
      conteudo,
      delay: 3000,
    })
  }

  static async enviarCardPublicado(
    companyId: string,
    cardName: string,
    dataHora: string,
    platform: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateCardPublicado(company.name, cardName, dataHora, platform)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.CARD_PUBLICADO,
      conteudo,
      metadata: { card_name: cardName, platform },
    })
  }

  static async enviarCardAgendado(
    companyId: string,
    cardName: string,
    dataAgendamento: string,
    platform: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateCardAgendado(company.name, cardName, dataAgendamento, platform)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.CARD_AGENDADO,
      conteudo,
      metadata: { card_name: cardName, platform, data_agendamento: dataAgendamento },
    })
  }

  static async enviarLembreteMensalidade(
    companyId: string,
    valor: string,
    dataVencimento: string,
    diasRestantes: number,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateLembreteMensalidade(
      company.responsible_name, company.name, valor, dataVencimento, diasRestantes,
    )
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.LEMBRETE_MENSALIDADE,
      conteudo,
      metadata: { valor, data_vencimento: dataVencimento, dias_restantes: diasRestantes },
    })
  }

  static async enviarBoletoSetup(
    companyId: string,
    valor: string,
    linkBoleto: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateBoletoSetup(company.responsible_name, company.name, valor, linkBoleto)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.BOLETO_SETUP,
      conteudo,
      metadata: { valor, link_boleto: linkBoleto },
      priority: 3,
    })
  }

  static async enviarBoletoMensalidade(
    companyId: string,
    valor: string,
    dataVencimento: string,
    linkBoleto: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateBoletoMensalidade(
      company.responsible_name, company.name, valor, dataVencimento, linkBoleto,
    )
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.BOLETO_MENSALIDADE,
      conteudo,
      metadata: { valor, data_vencimento: dataVencimento, link_boleto: linkBoleto },
      priority: 3,
    })
  }

  static async enviarConfirmacaoPagamento(
    companyId: string,
    valor: string,
    referencia: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateConfirmacaoPagamento(
      company.responsible_name, company.name, valor, referencia,
    )
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.CONFIRMACAO_PAGAMENTO,
      conteudo,
      metadata: { valor, referencia },
    })
  }

  static async enviarAlertaAtraso(
    companyId: string,
    valor: string,
    diasAtraso: number,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateAlertaAtraso(
      company.responsible_name, company.name, valor, diasAtraso,
    )
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.ALERTA_ATRASO,
      conteudo,
      metadata: { valor, dias_atraso: diasAtraso },
      priority: 2,
    })
  }

  static async enviarTrialExpirando(companyId: string, diasRestantes: number) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateTrialExpirando(
      company.responsible_name, company.name, diasRestantes,
    )
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.TRIAL_EXPIRANDO,
      conteudo,
      metadata: { dias_restantes: diasRestantes },
    })
  }

  static async enviarAcessoBloqueado(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateAcessoBloqueado(company.responsible_name, company.name)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.ACESSO_BLOQUEADO,
      conteudo,
      priority: 1,
    })
  }

  static async enviarErroPostagem(
    companyId: string,
    cardName: string,
    platform: string,
    motivo: string,
  ) {
    const company = await Company.findById(companyId)
    if (!company) return

    const conteudo = templateErroPostagem(company.name, cardName, platform, motivo)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.ERRO_POSTAGEM,
      conteudo,
      metadata: { card_name: cardName, platform, motivo },
      priority: 2,
    })
  }

  static async enviarPreCondicoesSetup(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templatePreCondicoesSetup(primeiroNome)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.PRE_CONDICOES_SETUP,
      conteudo,
      delay: 5 * 60 * 1000,
    })
  }

  static async enviarLembreteSetup(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    if (company.integracao_configurada) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templateLembreteSetup(primeiroNome, company.name)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.LEMBRETE_SETUP,
      conteudo,
      delay: 24 * 60 * 60 * 1000,
    })
  }

  static async enviarConfirmacaoAgendamento(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templateConfirmacaoAgendamento(primeiroNome)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.CONFIRMACAO_AGENDAMENTO,
      conteudo,
    })
  }

  static async enviarConfirmacaoCredenciais(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templateConfirmacaoCredenciais(primeiroNome)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.CONFIRMACAO_CREDENCIAIS,
      conteudo,
    })
  }

  static async enviarSetupIniciado(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templateSetupIniciado(primeiroNome, company.name)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.SETUP_INICIADO,
      conteudo,
    })
  }

  static async enviarSetupConcluido(companyId: string) {
    const company = await Company.findById(companyId)
    if (!company) return

    const primeiroNome = company.responsible_name.split(' ')[0]
    const conteudo = templateSetupConcluido(primeiroNome, company.name)
    return this.enviarMensagem({
      company_id: companyId,
      company_name: company.name,
      destinatario_nome: company.responsible_name,
      destinatario_telefone: company.whatsapp,
      tipo: TipoMensagem.SETUP_CONCLUIDO,
      conteudo,
      priority: 1,
    })
  }

  /**
   * Send a manual custom message to a specific company or all companies.
   */
  static async enviarManual(params: {
    mensagem: string
    escopo: 'todos' | 'company_especifica'
    company_id?: string
  }) {
    // Para empresa especifica, nao filtra por status/access - admin pode enviar para qualquer empresa
    const filter: any = params.escopo === 'company_especifica' && params.company_id
      ? { _id: params.company_id }
      : { status: 'active', access_enabled: true }

    const companies = await Company.find(filter).lean()
    const resultados: string[] = []
    let delayIndex = 0

    for (const company of companies) {
      await this.enviarMensagem({
        company_id: String(company._id),
        company_name: company.name,
        destinatario_nome: company.responsible_name,
        destinatario_telefone: company.whatsapp,
        tipo: TipoMensagem.MANUAL,
        conteudo: params.mensagem,
        delay: delayIndex * 3000,
      })
      resultados.push(company.name)
      delayIndex++
    }

    return { enviados: resultados.length, empresas: resultados }
  }
}
