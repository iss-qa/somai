import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { FalUsage, AppSettings, Company } from '@soma-ai/db'
import { authenticate, adminOnly } from '../../plugins/auth'

const BALANCE_KEY = 'fal_balance_purchased'

export default async function adminFalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /stats ── saldo + gasto + top parceiros + daily breakdown ──
  app.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [saldoDoc, totalAgg, monthAgg, topAgg, dailyAgg, totalImages] =
      await Promise.all([
        AppSettings.findOne({ key: BALANCE_KEY }).lean() as any,
        FalUsage.aggregate([
          { $match: { success: true } },
          { $group: { _id: null, total: { $sum: '$cost_usd' }, count: { $sum: 1 } } },
        ]),
        FalUsage.aggregate([
          { $match: { success: true, created_at: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$cost_usd' }, count: { $sum: 1 } } },
        ]),
        // Top parceiros do MES atual
        FalUsage.aggregate([
          { $match: { success: true, created_at: { $gte: monthStart } } },
          {
            $group: {
              _id: '$company_id',
              company_name: { $first: '$company_name' },
              spent_usd: { $sum: '$cost_usd' },
              image_count: { $sum: 1 },
              last_used: { $max: '$created_at' },
            },
          },
          { $sort: { spent_usd: -1 } },
          { $limit: 10 },
        ]),
        // Daily breakdown - ultimos 30 dias
        FalUsage.aggregate([
          { $match: { success: true, created_at: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
              },
              spent: { $sum: '$cost_usd' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        FalUsage.countDocuments({}),
      ])

    const purchased = typeof saldoDoc?.value === 'number' ? saldoDoc.value : 0
    const lastSynced = saldoDoc?.updated_at || null
    const spentTotal = totalAgg[0]?.total || 0
    const spentMonth = monthAgg[0]?.total || 0
    const remaining = Math.max(0, purchased - spentTotal)

    // Enriquece top parceiros com slug/plan
    const companyIds = topAgg.map((t: any) => t._id)
    const companies: any[] = await Company.find({ _id: { $in: companyIds } })
      .select('name slug plan_id status')
      .populate('plan_id', 'name slug')
      .lean()
    const cmap = new Map<string, any>()
    companies.forEach((c) => cmap.set(String(c._id), c))

    const topPartners = topAgg.map((t: any) => {
      const c = cmap.get(String(t._id))
      return {
        company_id: String(t._id),
        company_name: t.company_name || c?.name || '-',
        slug: c?.slug || '',
        plan: c?.plan_id?.name || 'Sem plano',
        status: c?.status || '',
        spent_usd: t.spent_usd,
        image_count: t.image_count,
        last_used: t.last_used,
      }
    })

    const alertLevel =
      purchased === 0
        ? 'no_balance'
        : remaining < 0.5
          ? 'critical'
          : remaining < 2
            ? 'warning'
            : 'ok'

    return reply.send({
      balance: {
        purchased,
        spent_total: spentTotal,
        spent_month: spentMonth,
        remaining,
        last_synced: lastSynced,
        alert_level: alertLevel,
      },
      totals: {
        images_total: totalAgg[0]?.count || 0,
        images_month: monthAgg[0]?.count || 0,
        requests_total: totalImages,
      },
      top_partners: topPartners,
      daily: dailyAgg.map((d: any) => ({
        date: d._id,
        spent: d.spent,
        count: d.count,
      })),
    })
  })

  // ── PATCH /balance ── admin atualiza saldo manualmente apos recarga no fal.ai ──
  app.patch(
    '/balance',
    async (
      request: FastifyRequest<{ Body: { purchased_usd: number } }>,
      reply: FastifyReply,
    ) => {
      const { purchased_usd } = request.body || {}
      if (typeof purchased_usd !== 'number' || purchased_usd < 0) {
        return reply.status(400).send({ error: 'purchased_usd invalido' })
      }

      const userEmail = (request.user as any)?.email || 'admin'
      await AppSettings.findOneAndUpdate(
        { key: BALANCE_KEY },
        {
          key: BALANCE_KEY,
          value: purchased_usd,
          updated_by: userEmail,
          updated_at: new Date(),
        },
        { upsert: true, new: true },
      )

      return reply.send({ success: true, purchased_usd })
    },
  )

  // ── GET /usage ── lista detalhada de geracoes (paginada) ──
  app.get(
    '/usage',
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; company_id?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { page = '1', limit = '50', company_id } = request.query
      const query: any = {}
      if (company_id) query.company_id = company_id

      const pageNum = Math.max(1, parseInt(page))
      const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
      const skip = (pageNum - 1) * limitNum

      const [items, total] = await Promise.all([
        FalUsage.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        FalUsage.countDocuments(query),
      ])

      return reply.send({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    },
  )
}
