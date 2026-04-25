'use client'

import { useEffect, useState } from 'react'
import {
  Trophy,
  Zap,
  Award,
  Flame,
  TrendingUp,
  Crown,
} from 'lucide-react'
import { api } from '@/lib/api'

interface GamState {
  xp: number
  nivel: string
  nivelProgresso: { atual: number; proximo: number; faltam: number }
  creditos: number
  creditosMes: number
  ofensiva: number
  maiorOfensiva: number
}

interface Missao {
  _id: string
  titulo: string
  descricao: string
  tipo: 'diaria' | 'semanal' | 'unica'
  recompensaXP: number
  recompensaCreditos: number
  progresso: number
  meta: number
}

interface Ranking {
  posicao: number
  creditosMes: number
  xp: number
  nivel: string
  empresa: { id: string; nome: string; logo: string; niche: string } | null
}

interface HistoricoItem {
  _id: string
  acao: string
  xp: number
  creditos: number
  descricao: string
  createdAt: string
}

export default function JornadaPage() {
  const [tab, setTab] = useState<'ranking' | 'missoes' | 'historico'>(
    'ranking',
  )
  const [state, setState] = useState<GamState | null>(null)
  const [missoes, setMissoes] = useState<Missao[]>([])
  const [ranking, setRanking] = useState<Ranking[]>([])
  const [historico, setHistorico] = useState<HistoricoItem[]>([])

  useEffect(() => {
    api.get<GamState>('/api/gamificacao/state').then(setState).catch(() => {})
    api
      .get<{ missoes: Missao[] }>('/api/gamificacao/missoes?limit=20')
      .then((d) => setMissoes(d.missoes))
      .catch(() => {})
    api
      .get<{ ranking: Ranking[] }>('/api/gamificacao/ranking?limit=20')
      .then((d) => setRanking(d.ranking))
      .catch(() => {})
    api
      .get<{ eventos: HistoricoItem[] }>('/api/gamificacao/historico?limit=50')
      .then((d) => setHistorico(d.eventos))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jornada</h1>
          <p className="text-sm text-gray-600">
            Missoes, conquistas e ranking
          </p>
        </div>
      </div>

      {/* Resumo */}
      {state && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={<Zap className="h-4 w-4" />}
            label="XP Total"
            value={String(state.xp)}
          />
          <Stat
            icon={<Crown className="h-4 w-4" />}
            label="Nivel"
            value={state.nivel}
          />
          <Stat
            icon={<Flame className="h-4 w-4" />}
            label="Ofensiva"
            value={`${state.ofensiva} dias`}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Creditos no mes"
            value={String(state.creditosMes)}
          />
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <TabBtn active={tab === 'ranking'} onClick={() => setTab('ranking')}>
          Ranking do mes
        </TabBtn>
        <TabBtn active={tab === 'missoes'} onClick={() => setTab('missoes')}>
          Missoes ativas
        </TabBtn>
        <TabBtn
          active={tab === 'historico'}
          onClick={() => setTab('historico')}
        >
          Historico de XP
        </TabBtn>
      </div>

      {tab === 'ranking' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3 text-right">Creditos no mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Ainda nao ha empresas no ranking deste mes.
                  </td>
                </tr>
              )}
              {ranking.map((r) => (
                <tr key={r.empresa?.id || r.posicao} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.empresa?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.empresa.logo}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200" />
                      )}
                      <span className="font-medium text-gray-900">
                        {r.empresa?.nome || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.nivel}</td>
                  <td className="px-4 py-3 text-right font-semibold text-purple-700">
                    {r.creditosMes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'missoes' && (
        <div className="space-y-3">
          {missoes.length === 0 && (
            <p className="text-sm text-gray-500">Sem missoes ativas.</p>
          )}
          {missoes.map((m) => {
            const pct = Math.round((m.progresso / m.meta) * 100)
            return (
              <div
                key={m._id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-purple-600">
                      {m.tipo}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {m.titulo}
                    </div>
                    <div className="text-xs text-gray-600">{m.descricao}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                      <Zap className="h-3 w-3" />+{m.recompensaXP} XP
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-gray-500">
                  {m.progresso}/{m.meta}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'historico' && (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {historico.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                Nenhum evento ainda.
              </div>
            )}
            {historico.map((h) => (
              <div
                key={h._id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-purple-500" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {h.descricao}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(h.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  {h.xp > 0 && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                      +{h.xp} XP
                    </span>
                  )}
                  {h.creditos > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                      +{h.creditos} 🪙
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
        active
          ? 'border-purple-600 text-purple-700'
          : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}
