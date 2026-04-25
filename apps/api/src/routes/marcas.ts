/**
 * Multi-marca v2.0 — o usuário pode ter várias Companies (marcas).
 * Cada Company tem seu próprio onboarding, gamificação, integrações.
 *
 * Identificação: `owner_user_id` aponta pro User dono. Quando um user
 * abre a plataforma, vê todas as suas marcas. A marca "ativa" (usada
 * pelas rotas existentes que leem `req.user.companyId`) é gravada em
 * `User.company_id` — quando troca de marca, atualizamos isso e
 * emitimos um JWT novo.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, User, Integration } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'

export default async function marcasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET /minhas ── todas as marcas do user ──
  app.get(
    '/minhas',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, companyId, role } = request.user!

      // Admin vê marcas próprias (criadas por ele) OU todas se quiser gerenciar
      const q: any = {
        $or: [
          { owner_user_id: userId },
          ...(companyId ? [{ _id: companyId }] : []),
        ],
      }

      const marcas: any[] = await Company.find(q)
        .select(
          'name logo_url niche brand_colors onboardingCompleto onboardingStep instagramConectado instagramHandle marca.descricao',
        )
        .sort({ createdAt: -1 })
        .lean()

      // Desduplica por _id (fallback do $or)
      const seen = new Set<string>()
      const uniq = marcas.filter((m) => {
        const id = String(m._id)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

      return reply.send({
        ativaId: companyId || null,
        marcas: uniq.map((m) => ({
          id: String(m._id),
          nome: m.name,
          logo: m.logo_url || '',
          niche: m.niche || '',
          cores: m.brand_colors || {},
          onboardingCompleto: !!m.onboardingCompleto,
          onboardingStep: m.onboardingStep || 'inicio',
          instagramConectado: !!m.instagramConectado,
          instagramHandle: m.instagramHandle || '',
          descricao: m.marca?.descricao || '',
        })),
        role,
      })
    },
  )

  // ── POST / ── cria nova marca ──
  app.post(
    '/',
    async (
      request: FastifyRequest<{
        Body: { nome: string; niche?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { userId } = request.user!
      const { nome, niche } = request.body || { nome: '' }

      if (!nome || nome.trim().length < 2) {
        return reply
          .status(400)
          .send({ error: 'Informe um nome de marca com pelo menos 2 letras' })
      }

      const user: any = await User.findById(userId).lean()
      if (!user) {
        return reply.status(404).send({ error: 'Usuario nao encontrado' })
      }

      const slug = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)

      const nova = await Company.create({
        name: nome.trim(),
        slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
        niche: niche || 'outro',
        responsible_name: user.name,
        whatsapp: user.whatsapp || '00000000000',
        email: user.email,
        owner_user_id: userId,
        onboardingCompleto: false,
        onboardingStep: 'inicio',
        status: 'setup_pending',
      })

      // Cria Integration vazia pra receber OAuth depois
      await Integration.create({ company_id: nova._id })

      return reply.status(201).send({
        id: String(nova._id),
        nome: nova.name,
      })
    },
  )

  // ── POST /:id/ativar ── troca a marca ativa (reemite JWT) ──
  app.post(
    '/:id/ativar',
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      const { userId, role } = request.user!
      const { id } = request.params

      const marca: any = await Company.findById(id).lean()
      if (!marca) {
        return reply.status(404).send({ error: 'Marca nao encontrada' })
      }

      const isAdmin = role === 'superadmin' || role === 'support'
      const isOwner = String(marca.owner_user_id || '') === String(userId)
      if (!isAdmin && !isOwner) {
        return reply.status(403).send({ error: 'Sem permissao' })
      }

      await User.findByIdAndUpdate(userId, { company_id: id })

      // Emite novo token com companyId atualizado
      const token = await reply.server.jwt.sign(
        {
          userId: String(userId),
          companyId: String(id),
          role,
        },
        { expiresIn: '7d' },
      )

      reply.setCookie('soma-token', token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      })

      return reply.send({
        ok: true,
        token,
        companyId: String(id),
      })
    },
  )
}
