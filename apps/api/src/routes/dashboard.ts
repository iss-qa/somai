import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  Card,
  Post,
  PostQueue,
  Video,
  Company,
  Inspiracao,
  ComunidadePost,
  DatesCalendar,
} from '@soma-ai/db'
import { CardStatus, QueueStatus, PostStatus } from '@soma-ai/shared'
import { authenticate } from '../plugins/auth'
import { GamificacaoService } from '../services/gamificacao.service'

// Banco curto de dicas rotativas (alimentado pela IA no futuro)
const DICAS = [
  'Comece a legenda com um gancho forte.',
  'Use no máximo 3 hashtags por post no Instagram.',
  'Carrossel tem o dobro do alcance de foto única.',
  'Publique entre 18h e 21h para maior engajamento.',
  'Inclua uma pergunta para gerar comentários.',
  'Reels com menos de 15s têm maior retenção.',
  'Mostre bastidores — humaniza a marca.',
  'Responda comentários nas 2 primeiras horas do post.',
]

export default async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const query: Record<string, unknown> = {}
    if (companyId) query.company_id = companyId

    const [postsThisMonth, approvedCards, scheduledToday, videosGenerated, publishedCards] =
      await Promise.all([
        Post.countDocuments({
          ...query,
          status: PostStatus.Published,
          published_at: { $gte: monthStart },
        }),
        Card.countDocuments({ ...query, status: CardStatus.Approved }),
        PostQueue.countDocuments({
          ...query,
          status: QueueStatus.Queued,
          scheduled_at: { $gte: todayStart, $lte: todayEnd },
        }),
        Video.countDocuments({ ...query }),
        Card.countDocuments({ ...query, status: CardStatus.Posted }),
      ])

    // Upcoming queued posts
    const queuedPosts = await PostQueue.find({
      ...query,
      status: QueueStatus.Queued,
      scheduled_at: { $gte: new Date() },
    })
      .sort({ scheduled_at: 1 })
      .limit(5)
      .populate('card_id', 'headline generated_image_url')
      .lean()

    // Recently published or failed (last 24h)
    const recentDone = await PostQueue.find({
      ...query,
      status: { $in: [QueueStatus.Done, QueueStatus.Failed] },
      scheduled_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ scheduled_at: -1 })
      .limit(5)
      .populate('card_id', 'headline generated_image_url')
      .lean()

    const statusToLabel: Record<string, string> = {
      [QueueStatus.Done]: 'published',
      [QueueStatus.Failed]: 'failed',
      [QueueStatus.Queued]: 'queued',
      [QueueStatus.Processing]: 'queued',
    }

    const allPosts = [...recentDone, ...queuedPosts].slice(0, 10)

    const posts = allPosts.map((p: any) => ({
      _id: String(p._id),
      caption: p.caption || p.card_id?.headline || '',
      card_id: p.card_id && typeof p.card_id === 'object' ? { generated_image_url: p.card_id.generated_image_url } : undefined,
      platforms: p.platforms || [],
      published_at: p.status === QueueStatus.Done ? p.scheduled_at : null,
      created_at: p.scheduled_at,
      status: statusToLabel[p.status] || p.status,
    }))

    return reply.send({
      metrics: { postsThisMonth, approvedCards, scheduledToday, videosGenerated, publishedCards },
      upcomingPosts: posts,
    })
  })

  // ── GET /v2 ── dashboard v2.0 (3 colunas) ─────
  app.get('/v2', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!
    if (!companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada' })
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStartPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59, 999,
    )
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const query: Record<string, unknown> = { company_id: companyId }

    const [
      company,
      totalPosts,
      postsEsteMes,
      postsMesAnterior,
      agendadosSemana,
      agendadosHoje,
      cardsAprovados,
      videosGerados,
      proximasPostagensRaw,
      ultimosCards,
      gamificacaoState,
      missoes,
      inspiracoesComunidade,
      duvidasComunidade,
    ] = await Promise.all([
      Company.findById(companyId).lean(),
      Post.countDocuments({ ...query, status: PostStatus.Published }),
      Post.countDocuments({
        ...query,
        status: PostStatus.Published,
        published_at: { $gte: monthStart },
      }),
      Post.countDocuments({
        ...query,
        status: PostStatus.Published,
        published_at: { $gte: monthStartPrev, $lt: monthStart },
      }),
      PostQueue.countDocuments({
        ...query,
        status: QueueStatus.Queued,
        scheduled_at: { $gte: now, $lte: weekEnd },
      }),
      PostQueue.countDocuments({
        ...query,
        status: QueueStatus.Queued,
        scheduled_at: { $gte: todayStart, $lte: todayEnd },
      }),
      Card.countDocuments({ ...query, status: CardStatus.Approved }),
      Video.countDocuments({ ...query }),
      PostQueue.find({
        ...query,
        status: QueueStatus.Queued,
        scheduled_at: { $gte: now },
      })
        .sort({ scheduled_at: 1 })
        .limit(5)
        .populate('card_id', 'headline generated_image_url')
        .lean(),
      Card.find({ ...query })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('headline generated_image_url status createdAt')
        .lean(),
      GamificacaoService.getEstado(companyId),
      GamificacaoService.missoesAtivas(companyId, 3),
      Inspiracao.find({ ativo: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('thumbUrl imageUrl segmento formato')
        .lean(),
      ComunidadePost.find({ ativo: true })
        .sort({ createdAt: -1 })
        .limit(1)
        .select('titulo tags upvotes')
        .lean(),
    ])

    const pautasPara30d = await PostQueue.countDocuments({
      ...query,
      status: QueueStatus.Queued,
      scheduled_at: {
        $gte: now,
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Próximas datas comemorativas do segmento (próximos 30 dias)
    const datasProximas = await buscarDatasProximas(
      (company as any)?.niche || '',
      30,
    )

    // Variação percentual vs mês anterior
    let variacao = 0
    if (postsMesAnterior > 0) {
      variacao = Math.round(
        ((postsEsteMes - postsMesAnterior) / postsMesAnterior) * 100,
      )
    } else if (postsEsteMes > 0) {
      variacao = 100
    }

    // "Próximo passo" — 3 marcos
    const c: any = company
    const passos = [
      {
        key: 'primeiro-post',
        label: 'Gere seu primeiro post',
        feito: totalPosts > 0,
      },
      {
        key: 'agendar',
        label: 'Agende um post',
        feito: agendadosSemana > 0 || pautasPara30d > 0,
      },
      {
        key: 'publicar',
        label: 'Publique no Instagram',
        feito: totalPosts > 0 && !!c?.instagramConectado,
      },
    ]
    const passosCompletos = passos.filter((p) => p.feito).length
    const proximoPasso = passos.find((p) => !p.feito) || passos[0]

    const dicaIdx = Math.floor(Math.random() * DICAS.length)

    return reply.send({
      empresa: {
        id: String(c?._id || ''),
        nome: c?.name || '',
        logo: c?.logo_url || '',
        niche: c?.niche || '',
        instagramHandle: c?.instagramHandle || '',
        onboardingCompleto: !!c?.onboardingCompleto,
      },
      metricas: {
        totalPosts,
        postsEsteMes,
        variacaoTotal: variacao,
        pautasPara30d,
        agendadosSemana,
        agendadosHoje,
        cardsAprovados,
        videosGerados,
        creditos: gamificacaoState.creditos,
        plano: c?.plan_id ? 'Pro' : 'Gratuito',
      },
      gamificacao: gamificacaoState,
      missoes,
      proximoPasso: {
        ...proximoPasso,
        completos: passosCompletos,
        total: passos.length,
      },
      ultimasCriacoes: ultimosCards.map((card: any) => ({
        id: String(card._id),
        headline: card.headline || '',
        imageUrl: card.generated_image_url || '',
        status: card.status,
        createdAt: card.createdAt,
      })),
      proximasPostagens: proximasPostagensRaw.map((p: any) => {
        const cardObj =
          p.card_id && typeof p.card_id === 'object' ? p.card_id : null
        return {
          id: String(p._id),
          cardId: cardObj ? String(cardObj._id || p.card_id) : null,
          headline: cardObj?.headline || p.caption || '',
          imageUrl: cardObj?.generated_image_url || '',
          platforms: p.platforms || [],
          scheduledAt: p.scheduled_at,
          status: p.status,
        }
      }),
      posts: {
        comunidade: inspiracoesComunidade.map((i: any) => ({
          id: String(i._id),
          thumb: i.thumbUrl || i.imageUrl || '',
          segmento: i.segmento,
          formato: i.formato,
        })),
      },
      comunidade: duvidasComunidade.map((p: any) => ({
        id: String(p._id),
        titulo: p.titulo,
        tags: p.tags || [],
        upvotes: p.upvotes || 0,
      })),
      datasProximas,
      dicaRapida: DICAS[dicaIdx],
    })
  })

  // ── GET /datas-comemorativas ── lista expandida pro drawer "Ver calendario"
  app.get('/datas-comemorativas', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!
    if (!companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada' })
    }
    const company: any = await Company.findById(companyId).lean()
    const datas = await buscarDatasProximas(company?.niche || '', 365, 200)
    return reply.send({ datas })
  })
}

/**
 * Busca datas comemorativas (DatesCalendar) relevantes pra um segmento,
 * nos próximos N dias. O campo `date` é MM-DD (ou MM/DD); aceitamos ambos.
 */
async function buscarDatasProximas(niche: string, diasFrente = 30, limit = 8) {
  const hoje = new Date()
  const fim = new Date(hoje.getTime() + diasFrente * 24 * 60 * 60 * 1000)
  const q: Record<string, any> = { active: true }
  if (niche) q.niches = { $in: [niche, 'todos'] }

  const todas: any[] = await DatesCalendar.find(q).lean()

  const anoAtual = hoje.getFullYear()
  const cached: Array<{
    date: string
    name: string
    description: string
    dateISO: string
    suggested_headline: string
  }> = []

  for (const d of todas) {
    const [mm, dd] = String(d.date).replace('/', '-').split('-')
    if (!mm || !dd) continue
    const candidata = new Date(anoAtual, Number(mm) - 1, Number(dd))
    // se já passou este ano, tenta ano que vem
    if (candidata < hoje) {
      candidata.setFullYear(anoAtual + 1)
    }
    if (candidata <= fim) {
      cached.push({
        date: d.date,
        name: d.name,
        description: d.description || '',
        dateISO: candidata.toISOString(),
        suggested_headline: d.suggested_headline || '',
      })
    }
  }
  cached.sort(
    (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime(),
  )
  return cached.slice(0, limit)
}
