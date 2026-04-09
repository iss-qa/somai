import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { User, AdminUser, Company, Plan } from '@soma-ai/db'
import { authenticate, adminOnly } from '../plugins/auth'
import { EvolutionService } from '../services/evolution.service'
import { LogService } from '../services/log.service'

// In-memory recovery codes (in production use Redis)
const recoveryCodes = new Map<
  string,
  { code: string; userId: string; expiresAt: number }
>()

export default async function authRoutes(app: FastifyInstance) {
  // ── POST /login ───────────────────────────────
  app.post(
    '/login',
    async (
      request: FastifyRequest<{
        Body: { email: string; password: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { email, password } = request.body

      if (!email || !password) {
        return reply
          .status(400)
          .send({ error: 'Email e senha sao obrigatorios' })
      }

      // Try AdminUser first, then User
      let foundUser: any = await AdminUser.findOne({
        email,
        active: true,
      }).lean()
      let isAdmin = false

      if (foundUser) {
        isAdmin = true
      } else {
        foundUser = await User.findOne({ email, active: true }).lean()
      }

      if (!foundUser) {
        return reply.status(401).send({ error: 'Credenciais invalidas' })
      }

      const passwordValid = await bcrypt.compare(
        password,
        foundUser.password_hash,
      )
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Credenciais invalidas' })
      }

      // Update last_login
      const Model = isAdmin ? AdminUser : User
      await Model.findByIdAndUpdate(foundUser._id, { last_login: new Date() })

      const payload = {
        userId: String(foundUser._id),
        companyId: isAdmin ? null : String(foundUser.company_id),
        role: foundUser.role,
      }

      const token = app.jwt.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      })

      // Fetch company details for non-admin users
      let companyName: string | null = null
      let planSlug: string | null = null
      let niche: string | null = null
      let accessEnabled = true
      let trialExpiresAt: string | null = null

      if (!isAdmin && foundUser.company_id) {
        const company: any = await Company.findById(foundUser.company_id)
          .populate('plan_id')
          .lean()
        if (company) {
          companyName = company.name
          planSlug = company.plan_id?.slug || null
          niche = company.niche || null
          accessEnabled = company.access_enabled || false
          trialExpiresAt = company.trial_expires_at
            ? new Date(company.trial_expires_at).toISOString()
            : null
        }
      }

      await LogService.info('auth', 'login_success', `Login: ${foundUser.email} (${foundUser.role})`, {
        company_id: isAdmin ? undefined : String(foundUser.company_id),
        company_name: companyName || undefined,
        ip: request.ip,
        metadata: { userId: String(foundUser._id), isAdmin },
      })

      reply
        .setCookie('soma-token', token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60,
        })
        .send({
          token,
          user: {
            id: String(foundUser._id),
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            companyId: isAdmin ? null : String(foundUser.company_id),
            companyName,
            plan: planSlug,
            niche,
            accessEnabled,
            trialExpiresAt,
          },
        })
    },
  )

  // ── POST /register (admin only — internal) ────
  app.post<{
    Body: {
      name: string
      email: string
      password: string
      role: string
      company_id?: string
    }
  }>(
    '/register',
    { preHandler: [authenticate, adminOnly] },
    async (request, reply) => {
      const { name, email, password, role, company_id } = request.body

      if (!name || !email || !password || !role) {
        return reply
          .status(400)
          .send({ error: 'Campos obrigatorios: name, email, password, role' })
      }

      const existingUser = await User.findOne({ email }).lean()
      const existingAdmin = await AdminUser.findOne({ email }).lean()
      if (existingUser || existingAdmin) {
        return reply.status(409).send({ error: 'Email ja cadastrado' })
      }

      const password_hash = await bcrypt.hash(password, 12)

      if (role === 'superadmin' || role === 'support') {
        const admin = await AdminUser.create({
          name,
          email,
          password_hash,
          role,
        })
        return reply.status(201).send({
          user: {
            id: String(admin._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        })
      }

      if (!company_id) {
        return reply
          .status(400)
          .send({ error: 'company_id e obrigatorio para usuarios nao-admin' })
      }

      const user = await User.create({
        name,
        email,
        password_hash,
        role,
        company_id,
      })

      return reply.status(201).send({
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: String(user.company_id),
        },
      })
    },
  )

  // ── POST /partner-signup — PUBLIC (no auth) ───
  app.post(
    '/partner-signup',
    async (
      request: FastifyRequest<{
        Body: {
          company_name: string
          responsible_name: string
          email: string
          document?: string
          whatsapp: string
          password: string
          niche: string
          city: string
          state: string
          plan?: string
          trial_days?: number
        }
      }>,
      reply: FastifyReply,
    ) => {
      const {
        company_name,
        responsible_name,
        email,
        document: docField,
        whatsapp,
        password,
        niche,
        city,
        state,
        plan: selectedPlan,
        trial_days: requestedTrialDays,
      } = request.body

      console.log('[partner-signup] Recebido:', {
        company_name,
        responsible_name,
        email,
        whatsapp: whatsapp ? '***' + whatsapp.slice(-4) : 'vazio',
        niche,
        city,
        state,
        selectedPlan,
        requestedTrialDays,
      })

      // Validate required fields
      if (
        !company_name ||
        !responsible_name ||
        !email ||
        !whatsapp ||
        !password
      ) {
        console.log('[partner-signup] Campos faltando')
        return reply.status(400).send({
          error:
            'Campos obrigatorios: company_name, responsible_name, email, whatsapp, password',
        })
      }

      if (password.length < 6) {
        return reply
          .status(400)
          .send({ error: 'Senha deve ter no minimo 6 caracteres' })
      }

      // Check existing email
      const existingUser = await User.findOne({ email }).lean()
      const existingAdmin = await AdminUser.findOne({ email }).lean()
      if (existingUser || existingAdmin) {
        console.log('[partner-signup] Email ja existe:', email)
        return reply.status(409).send({ error: 'Email ja cadastrado' })
      }

      // Check existing CNPJ/CPF (document)
      if (docField) {
        const cleanDoc = docField.replace(/\D/g, '')
        if (cleanDoc) {
          const existingDoc = await Company.findOne({
            document: { $regex: cleanDoc },
            status: { $ne: 'cancelled' },
          }).lean()
          if (existingDoc) {
            console.log('[partner-signup] Documento ja existe:', cleanDoc)
            return reply.status(409).send({ error: 'CPF/CNPJ ja cadastrado' })
          }
        }
      }

      // Get plan (user-selected or default starter)
      const planSlug = selectedPlan || 'starter'
      let plan: any = await Plan.findOne({
        slug: planSlug,
        active: true,
      }).lean()
      if (!plan) {
        plan = await Plan.findOne({ slug: 'starter', active: true }).lean()
      }
      if (!plan) {
        plan = await Plan.findOne({ active: true }).lean()
      }
      console.log('[partner-signup] Plano:', plan?.slug || 'nenhum encontrado')

      // Calculate trial period
      const trialDays = requestedTrialDays || 3
      const trialExpiresAt = new Date()
      trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDays)

      // Create slug from company name
      const slug = company_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      try {
        // Create company
        const company = await Company.create({
          name: company_name,
          slug,
          niche: niche || 'outro',
          city: city || '',
          state: state || '',
          responsible_name,
          document: docField || '',
          whatsapp,
          email,
          logo_url: '',
          brand_colors: { primary: '#8B5CF6', secondary: '#facc15' },
          plan_id: plan?._id || null,
          status: 'trial',
          access_enabled: false,
          setup_paid: false,
          setup_amount: plan?.setup_price ?? 0,
          trial_days: trialDays,
          trial_expires_at: trialExpiresAt,
          billing: {
            monthly_amount: plan?.monthly_price || 39.9,
            due_day: 10,
            status: 'pending',
          },
          notes: `Cadastro via formulario de parceria — Trial ${trialDays} dias`,
        })

        console.log('[partner-signup] Company criada:', String(company._id))

        await LogService.info('auth', 'partner_signup', `Nova empresa cadastrada: ${company_name}`, {
          company_id: String(company._id),
          company_name,
          ip: request.ip,
          metadata: { email, niche: niche || 'outro', plan: planSlug, trialDays },
        })

      // Create user (owner)
      const password_hash = await bcrypt.hash(password, 12)
      const user = await User.create({
        name: responsible_name,
        email,
        password_hash,
        role: 'owner',
        company_id: company._id,
      })

      // Auto-login: generate token
      const payload = {
        userId: String(user._id),
        companyId: String(company._id),
        role: 'owner',
      }

      const token = app.jwt.sign(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      })

      // Send welcome message (fire-and-forget — don't block signup response)
      import('../services/comunicacao.service')
        .then(({ ComunicacaoService }) => ComunicacaoService.enviarBoasVindas(String(company._id)))
        .catch((err) => console.warn('[auth] WhatsApp welcome failed:', err))

      reply
        .setCookie('soma-token', token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60,
        })
        .status(201)
        .send({
          token,
          user: {
            id: String(user._id),
            name: responsible_name,
            email,
            role: 'owner',
            companyId: String(company._id),
            companyName: company_name,
            plan: plan?.slug || 'starter',
            niche: niche || 'outro',
            accessEnabled: false,
            trialExpiresAt: trialExpiresAt.toISOString(),
          },
        })
      } catch (err: any) {
        console.error('[partner-signup] ERRO:', err.message, err.errors || '')
        return reply.status(500).send({
          error: err.message || 'Erro interno ao cadastrar empresa',
        })
      }
    },
  )

  // ── POST /recovery/request — Send code via WhatsApp ──
  app.post(
    '/recovery/request',
    async (
      request: FastifyRequest<{ Body: { email: string } }>,
      reply: FastifyReply,
    ) => {
      const { email } = request.body

      if (!email) {
        return reply.status(400).send({ error: 'Email e obrigatorio' })
      }

      // Find user
      const user: any = await User.findOne({ email, active: true }).lean()
      if (!user) {
        // Don't reveal if email exists
        return reply.send({
          message: 'Se o email estiver cadastrado, enviaremos um codigo via WhatsApp',
        })
      }

      // Get company to find WhatsApp number
      const company: any = await Company.findById(user.company_id).lean()
      const whatsappNumber = company?.whatsapp

      if (!whatsappNumber) {
        return reply.send({
          message: 'Se o email estiver cadastrado, enviaremos um codigo via WhatsApp',
        })
      }

      // Generate 6-digit code
      const code = crypto.randomInt(100000, 999999).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

      // Store code
      recoveryCodes.set(email, {
        code,
        userId: String(user._id),
        expiresAt,
      })

      // Send via WhatsApp
      try {
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'SOMA_AI'
        if (instanceName) {
          const cleanNumber = whatsappNumber.replace(/\D/g, '')
          await EvolutionService.sendText(
            instanceName,
            cleanNumber,
            `Soma.ai - Codigo de recuperacao: *${code}*\n\nUse este codigo para redefinir sua senha. Valido por 10 minutos.\n\nSe voce nao solicitou, ignore esta mensagem.`,
          )
        }
      } catch (err) {
        console.error('[auth] Recovery WhatsApp failed:', err)
        return reply.status(502).send({
          error: 'Erro ao enviar codigo. Tente novamente.',
        })
      }

      // Mask WhatsApp number for display
      const clean = whatsappNumber.replace(/\D/g, '')
      const masked = clean.slice(0, 4) + '****' + clean.slice(-2)

      return reply.send({
        message: 'Codigo enviado via WhatsApp',
        whatsapp_masked: masked,
      })
    },
  )

  // ── POST /recovery/verify — Verify code and reset password ──
  app.post(
    '/recovery/verify',
    async (
      request: FastifyRequest<{
        Body: { email: string; code: string; new_password: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { email, code, new_password } = request.body

      if (!email || !code || !new_password) {
        return reply
          .status(400)
          .send({ error: 'Email, codigo e nova senha sao obrigatorios' })
      }

      if (new_password.length < 6) {
        return reply
          .status(400)
          .send({ error: 'Nova senha deve ter no minimo 6 caracteres' })
      }

      const stored = recoveryCodes.get(email)

      if (!stored) {
        return reply
          .status(400)
          .send({ error: 'Nenhum codigo solicitado para este email' })
      }

      if (Date.now() > stored.expiresAt) {
        recoveryCodes.delete(email)
        return reply
          .status(400)
          .send({ error: 'Codigo expirado. Solicite um novo.' })
      }

      if (stored.code !== code) {
        return reply.status(400).send({ error: 'Codigo incorreto' })
      }

      // Reset password
      const password_hash = await bcrypt.hash(new_password, 12)
      await User.findByIdAndUpdate(stored.userId, { password_hash })

      // Cleanup
      recoveryCodes.delete(email)

      return reply.send({ message: 'Senha alterada com sucesso!' })
    },
  )

  // ── POST /logout ──────────────────────────────
  app.post(
    '/logout',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      reply
        .clearCookie('soma-token', { path: '/' })
        .send({ message: 'Logout realizado' })
    },
  )

  // ── GET /me ───────────────────────────────────
  app.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, role } = request.user!

      const isAdmin = role === 'superadmin' || role === 'support'
      const Model = isAdmin ? AdminUser : User
      const user: any = await Model.findById(userId)
        .select('-password_hash')
        .lean()

      if (!user) {
        return reply.status(404).send({ error: 'Usuario nao encontrado' })
      }

      return reply.send({ user: { ...user, _id: String(user._id) } })
    },
  )
}
