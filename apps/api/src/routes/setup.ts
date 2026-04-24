import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import { Company, SetupAgendamento, SetupCredencial } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { ComunicacaoService } from '../services/comunicacao.service'
import { EvolutionService } from '../services/evolution.service'

const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'SOMA_AI'
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || ''

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'soma_ai_encryption_key_32chars!!'
  return Buffer.from(key.padEnd(32).slice(0, 32), 'utf8')
}

function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function notifyAdmin(message: string) {
  if (!ADMIN_WHATSAPP) return
  const phone = ADMIN_WHATSAPP.replace(/\D/g, '')
  EvolutionService.sendText(EVOLUTION_INSTANCE, phone, message).catch(() => {})
}

export default async function setupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── POST /agendamento ─────────────────────────
  app.post(
    '/agendamento',
    async (request: FastifyRequest<{
      Body: {
        nome: string
        whatsapp: string
        data_preferida: string
        horario_preferido: string
        observacoes?: string
      }
    }>, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) return reply.status(403).send({ error: 'Sem empresa vinculada' })

      const { nome, whatsapp, data_preferida, horario_preferido, observacoes } = request.body
      if (!nome || !whatsapp || !data_preferida || !horario_preferido) {
        return reply.status(400).send({ error: 'Campos obrigatorios: nome, whatsapp, data_preferida, horario_preferido' })
      }

      const company = await Company.findById(companyId)
      if (!company) return reply.status(404).send({ error: 'Empresa nao encontrada' })

      const agendamento = await SetupAgendamento.create({
        empresa_id: companyId,
        nome,
        whatsapp,
        data_preferida: new Date(data_preferida),
        horario_preferido,
        observacoes: observacoes || '',
        status: 'pendente',
      })

      // Marca integracao_configurada para não exibir modal novamente
      await Company.findByIdAndUpdate(companyId, { integracao_configurada: true })

      // Notifica o cliente
      ComunicacaoService.enviarConfirmacaoAgendamento(companyId).catch(() => {})

      // Notifica admin
      notifyAdmin(
        `📅 *Novo agendamento de setup*\n\nEmpresa: *${company.name}*\nNome: ${nome}\nWhatsApp: ${whatsapp}\nData: ${data_preferida} às ${horario_preferido}${observacoes ? `\nObs: ${observacoes}` : ''}\n\nAcesse /admin/setups para confirmar.`
      )

      return reply.status(201).send({ success: true, agendamento: { id: String(agendamento._id) } })
    },
  )

  // ── POST /credenciais ─────────────────────────
  app.post(
    '/credenciais',
    async (request: FastifyRequest<{
      Body: {
        nome_conta: string
        email: string
        senha: string
        plataformas: string[]
        observacoes?: string
      }
    }>, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) return reply.status(403).send({ error: 'Sem empresa vinculada' })

      const { nome_conta, email, senha, plataformas, observacoes } = request.body
      if (!nome_conta || !email || !senha || !plataformas?.length) {
        return reply.status(400).send({ error: 'Campos obrigatorios: nome_conta, email, senha, plataformas' })
      }

      const company = await Company.findById(companyId)
      if (!company) return reply.status(404).send({ error: 'Empresa nao encontrada' })

      const senhaCriptografada = encryptPassword(senha)

      const credencial = await SetupCredencial.create({
        empresa_id: companyId,
        nome_conta,
        email,
        senha_criptografada: senhaCriptografada,
        plataformas,
        observacoes: observacoes || '',
        status: 'aguardando_setup',
      })

      await Company.findByIdAndUpdate(companyId, { integracao_configurada: true })

      ComunicacaoService.enviarConfirmacaoCredenciais(companyId).catch(() => {})

      notifyAdmin(
        `🔑 *Credenciais recebidas para setup*\n\nEmpresa: *${company.name}*\nConta: ${nome_conta}\nEmail: ${email}\nPlataformas: ${plataformas.join(', ')}\n\nAcesse /admin/setups para iniciar.`
      )

      return reply.status(201).send({ success: true, credencial: { id: String(credencial._id) } })
    },
  )

  // ── POST /self-setup ──────────────────────────
  // Chamado quando o usuário escolhe fazer o setup sozinho
  app.post(
    '/self-setup',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) return reply.status(403).send({ error: 'Sem empresa vinculada' })

      await Company.findByIdAndUpdate(companyId, { integracao_configurada: true })

      return reply.send({ success: true })
    },
  )
}
