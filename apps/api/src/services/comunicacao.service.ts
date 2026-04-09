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

    await whatsappQueue.add(
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
    )

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

  /**
   * Send a manual custom message to a specific company or all companies.
   */
  static async enviarManual(params: {
    mensagem: string
    escopo: 'todos' | 'company_especifica'
    company_id?: string
  }) {
    const filter: any = { status: 'active', access_enabled: true }
    if (params.escopo === 'company_especifica' && params.company_id) {
      filter._id = params.company_id
    }

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
