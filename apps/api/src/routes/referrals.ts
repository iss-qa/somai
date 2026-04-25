import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Referral, User, Gamificacao } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { Types } from 'mongoose'

const BONUS_INVITER = 50
const BONUS_INVITEE = 30

function randomCode(seed: string): string {
  const suffix = seed.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const pad = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SOMA-${(suffix + pad).slice(0, 6)}`
}

async function ensureReferral(userId: string, companyId: string) {
  const uid = new Types.ObjectId(userId)
  let ref: any = await Referral.findOne({ owner_user_id: uid })
  if (ref) return ref

  let code = randomCode(userId)
  for (let i = 0; i < 5; i++) {
    const existing = await Referral.findOne({ code }).lean()
    if (!existing) break
    code = randomCode(userId + i)
  }

  ref = await Referral.create({
    code,
    owner_user_id: uid,
    owner_company_id: new Types.ObjectId(companyId),
  })
  return ref
}

export async function creditarReferralSignup(params: {
  code: string
  inviteeUserId: string
  inviteeCompanyId: string
  inviteeEmail: string
  inviteeName: string
}): Promise<{ creditedInviter: boolean; creditedInvitee: boolean } | null> {
  const ref: any = await Referral.findOne({
    code: params.code.toUpperCase().trim(),
    ativo: true,
  })
  if (!ref) return null

  // Evita self-referral
  if (String(ref.owner_user_id) === String(params.inviteeUserId)) {
    return null
  }

  // Evita duplicação
  const jaUsou = ref.uses.some(
    (u: any) => String(u.invitee_user_id) === String(params.inviteeUserId),
  )
  if (jaUsou) return null

  ref.uses.push({
    invitee_user_id: new Types.ObjectId(params.inviteeUserId),
    invitee_company_id: new Types.ObjectId(params.inviteeCompanyId),
    invitee_email: params.inviteeEmail,
    invitee_name: params.inviteeName,
    signed_up_at: new Date(),
    bonus_creditado_inviter: true,
    bonus_creditado_invitee: true,
  })
  ref.total_signups += 1
  ref.total_creditos_ganhos += BONUS_INVITER
  await ref.save()

  // Credita inviter
  await Gamificacao.updateOne(
    { company_id: ref.owner_company_id },
    { $inc: { creditos: BONUS_INVITER } },
    { upsert: false },
  )
  // Credita invitee
  await Gamificacao.updateOne(
    { company_id: new Types.ObjectId(params.inviteeCompanyId) },
    { $inc: { creditos: BONUS_INVITEE } },
    { upsert: false },
  )

  return { creditedInviter: true, creditedInvitee: true }
}

export default async function referralsRoutes(app: FastifyInstance) {
  // ── GET /validate/:code ── PUBLIC: valida código no signup ──
  app.get<{ Params: { code: string } }>(
    '/validate/:code',
    async (request, reply) => {
      const code = request.params.code.toUpperCase().trim()
      if (!code || !/^SOMA-[A-Z0-9]{4,8}$/.test(code)) {
        return reply.status(400).send({ valid: false, error: 'Código inválido' })
      }
      const ref: any = await Referral.findOne({ code, ativo: true })
        .populate('owner_user_id', 'name')
        .lean()
      if (!ref) {
        return reply.send({ valid: false })
      }
      return reply.send({
        valid: true,
        bonus_invitee: BONUS_INVITEE,
        inviter_name: (ref.owner_user_id as any)?.name || 'Usuário Soma.ai',
      })
    },
  )

  // ── Rotas autenticadas ──
  app.register(async (scoped) => {
    scoped.addHook('preHandler', authenticate)

    // GET /me — código + stats
    scoped.get(
      '/me',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId, companyId } = request.user!
        if (!userId || !companyId) {
          return reply.status(400).send({ error: 'Sessão inválida' })
        }
        const ref: any = await ensureReferral(userId, companyId)
        const shareUrl = `${process.env.APP_URL || 'https://app.soma.ai'}/signup?ref=${ref.code}`
        return reply.send({
          code: ref.code,
          shareUrl,
          totalSignups: ref.total_signups,
          totalConversions: ref.total_conversions,
          totalCreditosGanhos: ref.total_creditos_ganhos,
          bonusInviter: BONUS_INVITER,
          bonusInvitee: BONUS_INVITEE,
        })
      },
    )

    // GET /me/history — lista de indicações
    scoped.get(
      '/me/history',
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId } = request.user!
        if (!userId) return reply.status(400).send({ error: 'Sessão inválida' })
        const ref: any = await Referral.findOne({
          owner_user_id: new Types.ObjectId(userId),
        }).lean()
        if (!ref) return reply.send({ uses: [] })
        const uses = (ref.uses || [])
          .sort((a: any, b: any) =>
            new Date(b.signed_up_at).getTime() - new Date(a.signed_up_at).getTime(),
          )
          .map((u: any) => ({
            inviteeName: u.invitee_name,
            inviteeEmail: u.invitee_email,
            signedUpAt: u.signed_up_at,
            convertedAt: u.converted_at,
            creditadoInviter: u.bonus_creditado_inviter,
          }))
        return reply.send({ uses })
      },
    )
  })
}
