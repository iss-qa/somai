/**
 * Engine de gamificação v2.0 — centraliza XP, créditos, ofensiva, missões
 * e conquistas. Recebe eventos dos workers/rotas (gerar post, agendar,
 * publicar, etc.) e atualiza o estado da empresa de forma atomica.
 */
import { Types } from 'mongoose'
import {
  Gamificacao,
  Missao,
  MissaoProgresso,
  XpHistory,
  Conquista,
  type XpAcao,
  type NivelGamificacao,
  type MissaoCondicao,
} from '@soma-ai/db'

// Tabela de XP/Créditos por ação
const RECOMPENSAS: Record<
  XpAcao,
  { xp: number; creditos: number; label: string }
> = {
  gerar_post: { xp: 10, creditos: 0, label: 'Post gerado' },
  agendar_post: { xp: 5, creditos: 0, label: 'Post agendado' },
  publicar_post: { xp: 15, creditos: 0, label: 'Post publicado' },
  analisar_inspiracao: { xp: 5, creditos: 0, label: 'Inspiracao salva' },
  completar_wizard: { xp: 50, creditos: 0, label: 'Onboarding concluido' },
  criar_calendario_mes: {
    xp: 100,
    creditos: 0,
    label: 'Calendario do mes criado',
  },
  streak_bonus: { xp: 50, creditos: 0, label: 'Ofensiva de 7 dias' },
  missao_concluida: { xp: 0, creditos: 0, label: 'Missao concluida' },
  conquista_desbloqueada: { xp: 0, creditos: 0, label: 'Conquista' },
  convidar_empresa: { xp: 0, creditos: 100, label: 'Convite aceito' },
  primeira_pergunta: { xp: 20, creditos: 50, label: 'Primeira pergunta' },
  primeira_resposta: { xp: 20, creditos: 50, label: 'Primeira resposta' },
  manual: { xp: 0, creditos: 0, label: 'Ajuste manual' },
}

// Condições de missão <-> ação que as satisfaz
const ACAO_PARA_CONDICAO: Record<XpAcao, MissaoCondicao | null> = {
  gerar_post: 'gerar_post',
  agendar_post: 'agendar_post',
  publicar_post: 'publicar_post',
  analisar_inspiracao: 'analisar_inspiracao',
  completar_wizard: 'completar_wizard',
  criar_calendario_mes: 'criar_calendario_mes',
  streak_bonus: 'streak_7',
  convidar_empresa: 'convidar_empresa',
  primeira_pergunta: 'primeira_pergunta',
  primeira_resposta: 'primeira_resposta',
  missao_concluida: null,
  conquista_desbloqueada: null,
  manual: null,
}

function calcularNivel(xp: number): NivelGamificacao {
  if (xp >= 2500) return 'EXPERT'
  if (xp >= 1000) return 'AVANCADO'
  if (xp >= 350) return 'INTERMEDIARIO'
  return 'INICIANTE'
}

function xpParaProximoNivel(xp: number): { atual: number; proximo: number } {
  if (xp >= 2500) return { atual: 2500, proximo: Infinity }
  if (xp >= 1000) return { atual: 1000, proximo: 2500 }
  if (xp >= 350) return { atual: 350, proximo: 1000 }
  return { atual: 0, proximo: 350 }
}

function periodoMes(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function periodoDia(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function periodoSemana(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1)
  const millisInDay = 1000 * 60 * 60 * 24
  const dayOfYear =
    Math.floor((d.getTime() - onejan.getTime()) / millisInDay) + 1
  const week = Math.ceil((dayOfYear + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function diffDias(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export class GamificacaoService {
  /**
   * Garante que existe um registro de gamificação para a empresa.
   */
  static async ensure(companyId: string | Types.ObjectId) {
    const id = new Types.ObjectId(String(companyId))
    let g: any = await Gamificacao.findOne({ company_id: id }).lean()
    if (!g) {
      g = await Gamificacao.create({
        company_id: id,
        xp: 0,
        nivel: 'INICIANTE',
        creditos: 25,
        ofensiva: 0,
        mesReferencia: periodoMes(),
      })
    }
    return g
  }

  /**
   * Estado completo pro dashboard (ranking, ofensiva, missões ativas).
   */
  static async getEstado(companyId: string | Types.ObjectId) {
    const g: any = await this.ensure(companyId)
    const niveis = xpParaProximoNivel(g.xp || 0)
    return {
      xp: g.xp || 0,
      nivel: g.nivel as NivelGamificacao,
      nivelProgresso: {
        atual: niveis.atual,
        proximo: niveis.proximo,
        faltam: niveis.proximo === Infinity ? 0 : niveis.proximo - (g.xp || 0),
      },
      creditos: g.creditos || 0,
      creditosMes: g.creditosMes || 0,
      ofensiva: g.ofensiva || 0,
      maiorOfensiva: g.maiorOfensiva || 0,
      ultimaAtividade: g.ultimaAtividade,
      mesReferencia: g.mesReferencia || periodoMes(),
    }
  }

  /**
   * Dispara um evento de gamificação. Soma XP/créditos, atualiza ofensiva,
   * progride missões, registra no histórico. É fire-and-forget do caller —
   * não deve nunca lançar exceção pra fora.
   */
  static async emitir(
    companyId: string | Types.ObjectId,
    acao: XpAcao,
    extra: { refId?: string; xp?: number; creditos?: number; descricao?: string } = {},
  ): Promise<void> {
    try {
      const id = new Types.ObjectId(String(companyId))
      const mesRef = periodoMes()
      const padrao = RECOMPENSAS[acao] || RECOMPENSAS.manual
      const xp = extra.xp ?? padrao.xp
      const creditos = extra.creditos ?? padrao.creditos

      const g: any = await this.ensure(id)

      // 1. Atualiza ofensiva (apenas em ações de "criação de conteúdo")
      const { ofensiva, maiorOfensiva, ganhouStreak7 } = this.calcularOfensiva(
        g,
        acao,
      )

      // 2. Acumula XP e créditos + reset mensal se necessário
      const novoMes = g.mesReferencia !== mesRef
      const xpTotal = (g.xp || 0) + xp
      const nivel = calcularNivel(xpTotal)

      const update: Record<string, any> = {
        $set: {
          nivel,
          ofensiva,
          maiorOfensiva,
          ultimaAtividade: new Date(),
          mesReferencia: mesRef,
        },
        $inc: {
          xp,
          creditos,
        },
      }

      if (novoMes) {
        update.$set.creditosMes = creditos
        update.$set.rankingMes = 0
      } else {
        update.$inc.creditosMes = creditos
      }

      await Gamificacao.findOneAndUpdate({ company_id: id }, update, {
        upsert: true,
      })

      // 3. Histórico
      await XpHistory.create({
        company_id: id,
        acao,
        xp,
        creditos,
        descricao: extra.descricao || padrao.label,
        ref_id: extra.refId ? new Types.ObjectId(extra.refId) : undefined,
      })

      // 4. Progresso de missões que respondem a essa ação
      await this.progredirMissoes(id, acao)

      // 5. Bônus de streak de 7 dias
      if (ganhouStreak7) {
        await this.emitir(id, 'streak_bonus', {
          descricao: 'Ofensiva de 7 dias!',
        })
      }

      // 6. Checa conquistas (badges)
      await this.checarConquistas(id, acao)
    } catch (err) {
      console.warn('[GamificacaoService.emitir] erro:', err)
    }
  }

  private static calcularOfensiva(
    g: any,
    acao: XpAcao,
  ): { ofensiva: number; maiorOfensiva: number; ganhouStreak7: boolean } {
    const acoesStreak: XpAcao[] = [
      'gerar_post',
      'agendar_post',
      'publicar_post',
    ]
    if (!acoesStreak.includes(acao)) {
      return {
        ofensiva: g.ofensiva || 0,
        maiorOfensiva: g.maiorOfensiva || 0,
        ganhouStreak7: false,
      }
    }

    const hoje = new Date()
    const ult = g.ultimaAtividade ? new Date(g.ultimaAtividade) : null
    let novaOfensiva = g.ofensiva || 0
    let ganhouStreak7 = false

    if (!ult) {
      novaOfensiva = 1
    } else {
      const dias = diffDias(hoje, ult)
      if (dias === 0) {
        // mesma data → mantém
      } else if (dias === 1) {
        novaOfensiva = (g.ofensiva || 0) + 1
        if (novaOfensiva === 7) ganhouStreak7 = true
      } else {
        // quebrou
        novaOfensiva = 1
      }
    }

    return {
      ofensiva: novaOfensiva,
      maiorOfensiva: Math.max(g.maiorOfensiva || 0, novaOfensiva),
      ganhouStreak7,
    }
  }

  private static async progredirMissoes(
    companyId: Types.ObjectId,
    acao: XpAcao,
  ): Promise<void> {
    const condicao = ACAO_PARA_CONDICAO[acao]
    if (!condicao) return

    const missoes: any[] = await Missao.find({
      ativo: true,
      condicao,
    }).lean()
    if (missoes.length === 0) return

    const agora = new Date()
    for (const missao of missoes) {
      const periodo =
        missao.tipo === 'diaria'
          ? periodoDia(agora)
          : missao.tipo === 'semanal'
            ? periodoSemana(agora)
            : 'unica'

      const existente: any = await MissaoProgresso.findOneAndUpdate(
        {
          company_id: companyId,
          missao_id: missao._id,
          periodoRef: periodo,
        },
        {
          $setOnInsert: {
            tipo: missao.tipo,
            meta: missao.meta || 1,
            progresso: 0,
            completa: false,
          },
        },
        { upsert: true, new: true },
      ).lean()

      if (existente.completa) continue

      const novoProgresso = (existente.progresso || 0) + 1
      const atingiu = novoProgresso >= (missao.meta || 1)

      await MissaoProgresso.updateOne(
        { _id: existente._id },
        {
          $set: {
            progresso: novoProgresso,
            completa: atingiu,
            completadaEm: atingiu ? new Date() : null,
          },
        },
      )

      if (atingiu) {
        await Gamificacao.updateOne(
          { company_id: companyId },
          {
            $inc: {
              xp: missao.recompensaXP || 0,
              creditos: missao.recompensaCreditos || 0,
              creditosMes: missao.recompensaCreditos || 0,
            },
            $addToSet: { missoesCompletasIds: missao._id },
          },
        )
        await XpHistory.create({
          company_id: companyId,
          acao: 'missao_concluida',
          xp: missao.recompensaXP || 0,
          creditos: missao.recompensaCreditos || 0,
          descricao: `Missao: ${missao.titulo}`,
          ref_id: missao._id,
        })
      }
    }
  }

  /**
   * Checa se alguma conquista foi desbloqueada após a ação.
   * Conquistas são milestones cumulativos (50 posts, 7 dias streak, etc.)
   * e usam o XpHistory pra contar ocorrências da `condicao`.
   */
  private static async checarConquistas(
    companyId: Types.ObjectId,
    acao: XpAcao,
  ): Promise<void> {
    const conquistas: any[] = await Conquista.find({
      ativo: true,
      condicao: acao,
    }).lean()
    if (conquistas.length === 0) return

    // Busca quais ela já tem
    const gam: any = await Gamificacao.findOne({ company_id: companyId })
      .select('conquistasIds ofensiva')
      .lean()
    const desbloqueadas = new Set(
      (gam?.conquistasIds || []).map((id: any) => String(id)),
    )

    for (const c of conquistas) {
      if (desbloqueadas.has(String(c._id))) continue

      let atingiu = false
      if (c.condicao === 'streak_7') {
        atingiu = (gam?.ofensiva || 0) >= 7
      } else {
        const count = await XpHistory.countDocuments({
          company_id: companyId,
          acao: c.condicao,
        })
        atingiu = count >= (c.meta || 1)
      }

      if (atingiu) {
        await Gamificacao.updateOne(
          { company_id: companyId },
          {
            $addToSet: { conquistasIds: c._id },
            $inc: {
              xp: c.recompensaXP || 0,
              creditos: c.recompensaCreditos || 0,
              creditosMes: c.recompensaCreditos || 0,
            },
          },
        )
        await XpHistory.create({
          company_id: companyId,
          acao: 'conquista_desbloqueada',
          xp: c.recompensaXP || 0,
          creditos: c.recompensaCreditos || 0,
          descricao: `Conquista: ${c.titulo}`,
          ref_id: c._id,
        })
      }
    }
  }

  /**
   * Conquistas desbloqueadas pela empresa, com todas ativas marcadas.
   */
  static async conquistas(companyId: string | Types.ObjectId) {
    const id = new Types.ObjectId(String(companyId))
    const [todas, gam] = await Promise.all([
      Conquista.find({ ativo: true }).sort({ ordem: 1 }).lean(),
      Gamificacao.findOne({ company_id: id })
        .select('conquistasIds')
        .lean(),
    ])
    const desbloqueadas = new Set(
      ((gam as any)?.conquistasIds || []).map((x: any) => String(x)),
    )
    return todas.map((c: any) => ({
      _id: String(c._id),
      slug: c.slug,
      titulo: c.titulo,
      descricao: c.descricao,
      icone: c.icone,
      cor: c.cor,
      desbloqueada: desbloqueadas.has(String(c._id)),
      recompensaXP: c.recompensaXP,
      recompensaCreditos: c.recompensaCreditos,
    }))
  }

  /**
   * Reset: apaga progresso de missões diárias/semanais de períodos antigos.
   * Deve rodar via cron todo dia às 00h.
   */
  static async resetMissoesExpiradas(): Promise<{
    removidas: number
  }> {
    const hoje = new Date()
    const diaHoje = periodoDia(hoje)
    const semanaHoje = periodoSemana(hoje)

    const res = await MissaoProgresso.deleteMany({
      $or: [
        { tipo: 'diaria', periodoRef: { $ne: diaHoje } },
        { tipo: 'semanal', periodoRef: { $ne: semanaHoje } },
      ],
    })
    return { removidas: res.deletedCount || 0 }
  }

  /**
   * Missões ativas da empresa (com progresso) pra montar o card na dashboard.
   */
  static async missoesAtivas(
    companyId: string | Types.ObjectId,
    limit = 3,
  ) {
    const id = new Types.ObjectId(String(companyId))
    const agora = new Date()
    const periodoDiario = periodoDia(agora)
    const periodoSem = periodoSemana(agora)

    const missoes: any[] = await Missao.find({ ativo: true })
      .sort({ ordem: 1 })
      .lean()

    const progressos: any[] = await MissaoProgresso.find({
      company_id: id,
      $or: [
        { tipo: 'diaria', periodoRef: periodoDiario },
        { tipo: 'semanal', periodoRef: periodoSem },
        { tipo: 'unica' },
      ],
    }).lean()

    const mapProg = new Map(
      progressos.map((p: any) => [String(p.missao_id), p]),
    )

    const ativas = missoes
      .map((m: any) => {
        const p = mapProg.get(String(m._id))
        return {
          _id: String(m._id),
          titulo: m.titulo,
          descricao: m.descricao,
          tipo: m.tipo,
          icone: m.icone,
          recompensaXP: m.recompensaXP,
          recompensaCreditos: m.recompensaCreditos,
          progresso: p?.progresso || 0,
          meta: m.meta || 1,
          completa: !!p?.completa,
        }
      })
      .filter((m) => !m.completa)
      .slice(0, limit)

    return ativas
  }

  /**
   * Histórico de XP recente pra tela de Jornada.
   */
  static async historico(
    companyId: string | Types.ObjectId,
    limit = 30,
  ) {
    const id = new Types.ObjectId(String(companyId))
    return XpHistory.find({ company_id: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
  }

  /**
   * Ranking mensal das empresas (top N por créditosMes).
   */
  static async ranking(limit = 20) {
    const mesRef = periodoMes()
    return Gamificacao.find({ mesReferencia: mesRef })
      .sort({ creditosMes: -1 })
      .limit(limit)
      .populate('company_id', 'name logo_url niche')
      .lean()
  }
}
