import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../plugins/auth'
import { adminOnly } from '../../plugins/auth'
import { MessageHistory, StatusMensagem, Company } from '@soma-ai/db'
import { ComunicacaoService } from '../../services/comunicacao.service'
import whatsappQueue from '../../queues/whatsapp.queue'

export default async function adminComunicacaoRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate)
  app.addHook('onRequest', adminOnly)

  // ── GET /historico — paginated message history ──
  app.get('/historico', async (request, reply) => {
    const {
      company_id,
      tipo,
      status,
      page = '1',
      limit = '20',
    } = request.query as Record<string, string>

    const filter: any = {}
    if (company_id) filter.company_id = company_id
    if (tipo && tipo !== 'todos') filter.tipo = tipo
    if (status && status !== 'todos') filter.status = status

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const [mensagens, total] = await Promise.all([
      MessageHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MessageHistory.countDocuments(filter),
    ])

    return {
      mensagens,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    }
  })

  // ── GET /stats — communication stats ──
  app.get('/stats', async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalEnviadas, totalPendentes, totalFalhas, enviadasHoje] =
      await Promise.all([
        MessageHistory.countDocuments({ status: StatusMensagem.ENVIADO }),
        MessageHistory.countDocuments({ status: StatusMensagem.PENDENTE }),
        MessageHistory.countDocuments({ status: StatusMensagem.FALHA }),
        MessageHistory.countDocuments({
          status: StatusMensagem.ENVIADO,
          data_envio: { $gte: todayStart },
        }),
      ])

    return {
      total_enviadas: totalEnviadas,
      total_pendentes: totalPendentes,
      total_falhas: totalFalhas,
      enviadas_hoje: enviadasHoje,
    }
  })

  // ── GET /companies — list companies for filter dropdown ──
  app.get('/companies', async () => {
    const companies = await Company.find(
      {},
      { _id: 1, name: 1 },
    )
      .sort({ name: 1 })
      .lean()
    return companies
  })

  // ── POST /enviar-manual — send manual message ──
  app.post('/enviar-manual', async (request, reply) => {
    const { mensagem, escopo, company_id } = request.body as {
      mensagem: string
      escopo: 'todos' | 'company_especifica'
      company_id?: string
    }

    if (!mensagem || !mensagem.trim()) {
      return reply.status(400).send({ error: 'Mensagem e obrigatoria' })
    }

    if (escopo === 'company_especifica' && !company_id) {
      return reply
        .status(400)
        .send({ error: 'company_id e obrigatorio para escopo company_especifica' })
    }

    const result = await ComunicacaoService.enviarManual({
      mensagem: mensagem.trim(),
      escopo,
      company_id,
    })

    return {
      success: true,
      message: `Mensagem enviada para ${result.enviados} empresa(s)`,
      ...result,
    }
  })

  // ── POST /resend/:id — resend a failed message ──
  app.post('/resend/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const msg = await MessageHistory.findById(id)
    if (!msg) {
      return reply.status(404).send({ error: 'Mensagem nao encontrada' })
    }

    // Reset status
    msg.status = StatusMensagem.PENDENTE
    msg.error_message = undefined as any
    msg.data_envio = undefined as any
    await msg.save()

    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'SOMA_AI'

    await whatsappQueue.add(
      'send_text',
      {
        historicoId: msg._id.toString(),
        phoneNumber: msg.destinatario_telefone,
        message: msg.conteudo,
        instanceName,
      },
      {
        priority: 3,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    )

    return {
      success: true,
      mensagemId: msg._id,
      destinatario: msg.destinatario_nome,
      tipo: msg.tipo,
      status: 'pendente',
    }
  })

  // ── GET /mensagem/:id — message details ──
  app.get('/mensagem/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const msg = await MessageHistory.findById(id).lean()
    if (!msg) {
      return reply.status(404).send({ error: 'Mensagem nao encontrada' })
    }
    return msg
  })

  // ── GET /queue-status — queue metrics ──
  app.get('/queue-status', async () => {
    try {
      const [waiting, active, failed, completed] = await Promise.all([
        whatsappQueue.getWaitingCount(),
        whatsappQueue.getActiveCount(),
        whatsappQueue.getFailedCount(),
        whatsappQueue.getCompletedCount(),
      ])

      return { waiting, active, failed, completed }
    } catch {
      return { waiting: 0, active: 0, failed: 0, completed: 0 }
    }
  })
}
