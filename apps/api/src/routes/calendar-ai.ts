import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Company, DatesCalendar } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { LLMService } from '../services/llm.service'
import { GamificacaoService } from '../services/gamificacao.service'

interface PautaItem {
  data: string
  horario: string
  formato: 'card' | 'carrossel' | 'reels' | 'legenda'
  objetivo: string
  headline: string
  copy: string
  hashtags: string[]
  dataComemorativa?: string
}

function safeParseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    const m = text.match(/\[[\s\S]*\]/)
    if (m) {
      try {
        return JSON.parse(m[0]) as T
      } catch {
        /* ignore */
      }
    }
    return fallback
  }
}

export default async function calendarAiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── POST /gerar-pauta-mes ── IA gera 12-20 ideias pro próximo mês ──
  app.post(
    '/gerar-pauta-mes',
    async (
      request: FastifyRequest<{
        Body: { quantidade?: number }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const company: any = await Company.findById(companyId).lean()
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const quantidade = Math.min(
        Math.max(request.body?.quantidade || 15, 4),
        30,
      )

      // Datas comemorativas dos próximos 30 dias (já filtradas por niche)
      const hoje = new Date()
      const fim = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
      const todasDatas: any[] = await DatesCalendar.find({
        active: true,
        niches: { $in: [company.niche, 'todos'] },
      }).lean()

      const anoAtual = hoje.getFullYear()
      const datasRelevantes: string[] = []
      for (const d of todasDatas) {
        const [mm, dd] = String(d.date).replace('/', '-').split('-')
        if (!mm || !dd) continue
        const candidata = new Date(anoAtual, Number(mm) - 1, Number(dd))
        if (candidata < hoje) candidata.setFullYear(anoAtual + 1)
        if (candidata <= fim) {
          datasRelevantes.push(
            `${candidata.toISOString().slice(0, 10)}: ${d.name}`,
          )
        }
      }

      const prompt = `Voce e um estrategista de marketing digital. Gere ${quantidade} ideias de posts para Instagram/Facebook distribuidas nos proximos 30 dias para esta marca.

DADOS DA MARCA:
- Nome: ${company.name || ''}
- Segmento: ${company.niche || ''}
- Descricao: ${company.marca?.descricao || ''}
- Objetivo principal: ${company.objetivo || 'nao definido'}
- Cliente ideal: ${company.publico?.clienteIdeal || ''}
- Dores: ${company.publico?.dores || ''}
- Desejos: ${company.publico?.desejos || ''}
- Tom de voz: ${(company.identidade?.tomDeVoz || []).join(', ')}
- Personalidade: ${company.identidade?.personalidade || ''}
- Estilo visual: ${company.estiloVisual?.estilo || ''}

DATAS COMEMORATIVAS NO PERIODO:
${datasRelevantes.length > 0 ? datasRelevantes.join('\n') : '(nenhuma data especifica)'}

REGRAS:
- Distribua em dias variados (evite 3 posts no mesmo dia)
- Nao use todos os dias — deixe espaco (3-5 posts por semana)
- Formatos diversos: misture card, carrossel, reels, legenda
- Horarios bons: 09:00, 12:00, 18:00, 20:00
- Use as datas comemorativas quando fizer sentido
- Headline com maximo 8 palavras, impactante
- Copy com 2-3 frases, conversa direta
- 3-5 hashtags relevantes ao segmento

Responda SOMENTE com um JSON array, sem comentarios, sem markdown:
[
  {
    "data": "YYYY-MM-DD",
    "horario": "HH:MM",
    "formato": "card | carrossel | reels | legenda",
    "objetivo": "vender | autoridade | engajamento | leads",
    "headline": "...",
    "copy": "...",
    "hashtags": ["#tag1", "#tag2"],
    "dataComemorativa": "nome da data se aplicavel ou string vazia"
  }
]`

      try {
        const text = await LLMService.generateText(prompt)
        const pauta = safeParseJson<PautaItem[]>(text, [])

        if (!Array.isArray(pauta) || pauta.length === 0) {
          return reply.status(500).send({
            error:
              'IA nao retornou uma pauta valida. Tente novamente em alguns segundos.',
          })
        }

        // Valida e filtra pautas com data futura
        const hojeStr = hoje.toISOString().slice(0, 10)
        const valida = pauta
          .filter((p) => p && p.data && p.data >= hojeStr)
          .slice(0, quantidade)
          .map((p) => ({
            data: String(p.data),
            horario: String(p.horario || '09:00'),
            formato: p.formato || 'card',
            objetivo: p.objetivo || company.objetivo || 'engajamento',
            headline: String(p.headline || '').slice(0, 120),
            copy: String(p.copy || ''),
            hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
            dataComemorativa: p.dataComemorativa || '',
          }))

        // +100 XP se é a primeira vez que gera calendário neste mês
        GamificacaoService.emitir(companyId, 'criar_calendario_mes').catch(
          () => {},
        )

        return reply.send({
          pauta: valida,
          total: valida.length,
          geradoEm: new Date().toISOString(),
        })
      } catch (err: any) {
        request.log.error(err, '[calendar-ai] gerar-pauta-mes falhou')
        return reply.status(500).send({
          error: err?.message || 'Erro ao gerar pauta com IA',
        })
      }
    },
  )
}
