import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { User, AdminUser, Company, Plan } from '@soma-ai/db'
import { authenticate, adminOnly } from '../plugins/auth'

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
        return reply.status(400).send({ error: 'Email e senha sao obrigatorios' })
      }

      // Try AdminUser first, then User
      let foundUser: any = await AdminUser.findOne({ email, active: true }).lean()
      let isAdmin = false

      if (foundUser) {
        isAdmin = true
      } else {
        foundUser = await User.findOne({ email, active: true }).lean()
      }

      if (!foundUser) {
        return reply.status(401).send({ error: 'Credenciais invalidas' })
      }

      const passwordValid = await bcrypt.compare(password, foundUser.password_hash)
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

      if (!isAdmin && foundUser.company_id) {
        const company: any = await Company.findById(foundUser.company_id)
          .populate('plan_id')
          .lean()
        if (company) {
          companyName = company.name
          planSlug = company.plan_id?.slug || null
          niche = company.niche || null
        }
      }

      reply
        .setCookie('soma-token', token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60, // 7 days
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
          },
        })
    },
  )

  // ── POST /register (admin only) ───────────────
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

      // Check for existing user
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

  // ── POST /logout ──────────────────────────────
  app.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply
      .clearCookie('soma-token', { path: '/' })
      .send({ message: 'Logout realizado' })
  })

  // ── GET /me ───────────────────────────────────
  app.get(
    '/me',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, role } = request.user!

      const isAdmin = role === 'superadmin' || role === 'support'
      const Model = isAdmin ? AdminUser : User
      const user: any = await Model.findById(userId).select('-password_hash').lean()

      if (!user) {
        return reply.status(404).send({ error: 'Usuario nao encontrado' })
      }

      return reply.send({ user: { ...user, _id: String(user._id) } })
    },
  )
}
