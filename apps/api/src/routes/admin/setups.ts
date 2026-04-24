import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import { Company, SetupAgendamento, SetupCredencial } from '@soma-ai/db'
import { authenticate, adminOnly } from '../../plugins/auth'
import { ComunicacaoService } from '../../services/comunicacao.service'

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'soma_ai_encryption_key_32chars!!'
  return Buffer.from(key.padEnd(32).slice(0, 32), 'utf8')
}

function decryptPassword(encrypted: string): string {
  const [ivHex, encHex] = encrypted.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export default async function adminSetupsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET / — Lista todos os setups pendentes ───
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [agendamentos, credenciais] = await Promise.all([
      SetupAgendamento.find({ status: { $ne: 'concluido' } })
        .sort({ createdAt: -1 })
        .lean(),
      SetupCredencial.find({ status: { $ne: 'concluido' } })
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const empresaIds = [
      ...agendamentos.map((a) => a.empresa_id),
      ...credenciais.map((c) => c.empresa_id),
    ]
    const empresas = await Company.find({ _id: { $in: empresaIds } })
      .select('name whatsapp responsible_name')
      .lean()
    const empresaMap = Object.fromEntries(empresas.map((e) => [String(e._id), e]))

    const itens = [
      ...agendamentos.map((a) => ({
        _id: String(a._id),
        tipo: 'agendamento',
        empresa_id: String(a.empresa_id),
        empresa: empresaMap[String(a.empresa_id)] || null,
        nome: a.nome,
        whatsapp: a.whatsapp,
        data_preferida: a.data_preferida,
        horario_preferido: a.horario_preferido,
        observacoes: a.observacoes,
        status: a.status,
        createdAt: a.createdAt,
      })),
      ...credenciais.map((c) => ({
        _id: String(c._id),
        tipo: 'credenciais',
        empresa_id: String(c.empresa_id),
        empresa: empresaMap[String(c.empresa_id)] || null,
        nome_conta: c.nome_conta,
        email: c.email,
        plataformas: c.plataformas,
        observacoes: c.observacoes,
        status: c.status,
        createdAt: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return reply.send({ itens })
  })

  // ── GET /todos — Inclui concluídos ────────────
  app.get('/todos', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [agendamentos, credenciais] = await Promise.all([
      SetupAgendamento.find().sort({ createdAt: -1 }).lean(),
      SetupCredencial.find().sort({ createdAt: -1 }).lean(),
    ])

    const empresaIds = [
      ...agendamentos.map((a) => a.empresa_id),
      ...credenciais.map((c) => c.empresa_id),
    ]
    const empresas = await Company.find({ _id: { $in: empresaIds } })
      .select('name whatsapp responsible_name')
      .lean()
    const empresaMap = Object.fromEntries(empresas.map((e) => [String(e._id), e]))

    const itens = [
      ...agendamentos.map((a) => ({
        _id: String(a._id),
        tipo: 'agendamento',
        empresa_id: String(a.empresa_id),
        empresa: empresaMap[String(a.empresa_id)] || null,
        nome: a.nome,
        whatsapp: a.whatsapp,
        data_preferida: a.data_preferida,
        horario_preferido: a.horario_preferido,
        observacoes: a.observacoes,
        status: a.status,
        admin_id: a.admin_id,
        data_inicio: a.data_inicio,
        data_conclusao: a.data_conclusao,
        createdAt: a.createdAt,
      })),
      ...credenciais.map((c) => ({
        _id: String(c._id),
        tipo: 'credenciais',
        empresa_id: String(c.empresa_id),
        empresa: empresaMap[String(c.empresa_id)] || null,
        nome_conta: c.nome_conta,
        email: c.email,
        plataformas: c.plataformas,
        observacoes: c.observacoes,
        status: c.status,
        admin_id: c.admin_id,
        data_inicio: c.data_inicio,
        data_conclusao: c.data_conclusao,
        createdAt: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return reply.send({ itens })
  })

  // ── POST /:id/iniciar ─────────────────────────
  app.post(
    '/:id/iniciar',
    async (request: FastifyRequest<{
      Params: { id: string }
      Body: { tipo: 'agendamento' | 'credenciais' }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const { tipo } = request.body
      const { userId } = request.user!

      if (!tipo) return reply.status(400).send({ error: 'Tipo obrigatorio (agendamento | credenciais)' })

      const now = new Date()
      let empresaId: string | null = null

      if (tipo === 'agendamento') {
        const doc = await SetupAgendamento.findByIdAndUpdate(
          id,
          { status: 'em_andamento', admin_id: userId, data_inicio: now },
          { new: true },
        )
        if (!doc) return reply.status(404).send({ error: 'Agendamento nao encontrado' })
        empresaId = String(doc.empresa_id)
      } else {
        const doc = await SetupCredencial.findByIdAndUpdate(
          id,
          { status: 'em_andamento', admin_id: userId, data_inicio: now },
          { new: true },
        )
        if (!doc) return reply.status(404).send({ error: 'Credencial nao encontrada' })
        empresaId = String(doc.empresa_id)
      }

      if (empresaId) {
        ComunicacaoService.enviarSetupIniciado(empresaId).catch(() => {})
      }

      return reply.send({ success: true })
    },
  )

  // ── POST /:id/concluir ────────────────────────
  app.post(
    '/:id/concluir',
    async (request: FastifyRequest<{
      Params: { id: string }
      Body: { tipo: 'agendamento' | 'credenciais' }
    }>, reply: FastifyReply) => {
      const { id } = request.params
      const { tipo } = request.body

      if (!tipo) return reply.status(400).send({ error: 'Tipo obrigatorio (agendamento | credenciais)' })

      const now = new Date()
      let empresaId: string | null = null

      if (tipo === 'agendamento') {
        const doc = await SetupAgendamento.findByIdAndUpdate(
          id,
          { status: 'concluido', data_conclusao: now },
          { new: true },
        )
        if (!doc) return reply.status(404).send({ error: 'Agendamento nao encontrado' })
        empresaId = String(doc.empresa_id)
      } else {
        const doc = await SetupCredencial.findByIdAndUpdate(
          id,
          { status: 'concluido', data_conclusao: now },
          { new: true },
        )
        if (!doc) return reply.status(404).send({ error: 'Credencial nao encontrada' })
        empresaId = String(doc.empresa_id)
      }

      if (empresaId) {
        await Company.findByIdAndUpdate(empresaId, { integracao_configurada: true })
        ComunicacaoService.enviarSetupConcluido(empresaId).catch(() => {})
      }

      return reply.send({ success: true })
    },
  )

  // ── POST /:id/revelar-senha ───────────────────
  // Descriptografa e retorna a senha, registrando o acesso
  app.post(
    '/:id/revelar-senha',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params
      const { userId } = request.user!

      const doc = await SetupCredencial.findByIdAndUpdate(
        id,
        {
          $push: {
            acessos_admin: { admin_id: userId, data_acesso: new Date() },
          },
        },
        { new: true },
      )

      if (!doc) return reply.status(404).send({ error: 'Credencial nao encontrada' })

      let senha: string
      try {
        senha = decryptPassword(doc.senha_criptografada)
      } catch {
        return reply.status(500).send({ error: 'Erro ao descriptografar senha' })
      }

      return reply.send({ senha })
    },
  )
}
