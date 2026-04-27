'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Plus,
  Settings,
  Check,
  Loader2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface MarcaResumo {
  id: string
  nome: string
  logo: string
  niche: string
  descricao: string
  onboardingCompleto: boolean
  onboardingStep: string
  instagramConectado: boolean
  instagramHandle: string
}

export function BrandSwitcher() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [marcas, setMarcas] = useState<MarcaResumo[]>([])
  const [ativaId, setAtivaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNova, setShowNova] = useState(false)

  const carregar = () => {
    setLoading(true)
    api
      .get<{ ativaId: string | null; marcas: MarcaResumo[] }>(
        '/api/marcas/minhas',
      )
      .then((d) => {
        setMarcas(d.marcas || [])
        setAtivaId(d.ativaId)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.id) carregar()
  }, [user?.id])

  const ativa = marcas.find((m) => m.id === ativaId) || marcas[0] || null

  const trocar = async (id: string) => {
    if (id === ativaId) {
      setOpen(false)
      return
    }
    try {
      await api.post(`/api/marcas/${id}/ativar`)
      toast.success('Marca ativa atualizada')
      setOpen(false)
      // Reload the page pra repropagar companyId nas chamadas
      window.location.href = '/app/dashboard'
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao trocar marca')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[36px] min-w-0 max-w-full items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-sm hover:bg-gray-100"
      >
        {ativa?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ativa.logo}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-purple-200 to-pink-200" />
        )}
        <span className="min-w-0 max-w-[160px] truncate text-gray-700">
          {ativa?.nome || user?.companyName || 'Selecionar marca'}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-gray-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            aria-label="Fechar"
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-3 py-2 text-[11px] font-semibold uppercase text-gray-500">
              Suas Marcas
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {!loading && marcas.length === 0 && (
                <div className="px-3 py-3 text-xs text-gray-500">
                  Voce ainda nao tem nenhuma marca.
                </div>
              )}
              {marcas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => trocar(m.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  {m.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.logo}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {m.nome}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {m.descricao || m.niche || '—'}
                    </div>
                  </div>
                  {m.id === ativaId ? (
                    <Check className="h-4 w-4 flex-shrink-0 text-purple-600" />
                  ) : !m.onboardingCompleto ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                      setup
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 py-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setShowNova(true)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4 text-purple-500" />
                Adicionar Nova Marca
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push('/app/marcas')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                Gerenciar Marcas
              </button>
            </div>
          </div>
        </>
      )}

      {showNova && (
        <NovaMarcaDialog
          onClose={() => setShowNova(false)}
          onCreated={() => {
            setShowNova(false)
            // Redireciona direto pro onboarding da nova marca
            router.push('/onboarding')
          }}
        />
      )}
    </div>
  )
}

function NovaMarcaDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)

  const criar = async () => {
    if (!nome.trim()) {
      toast.error('Informe o nome da marca')
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ id: string; nome: string }>(
        '/api/marcas',
        { nome: nome.trim() },
      )
      // Ativa a marca recém-criada
      await api.post(`/api/marcas/${res.id}/ativar`)
      toast.success(`Marca "${res.nome}" criada! Vamos configurar.`)
      onCreated()
      // Reload pra atualizar contexto
      window.location.href = '/onboarding'
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar marca')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Nova marca
            </div>
            <p className="text-xs text-gray-500">
              Damos um nome inicial — voce vai configurar cores, tom de voz e
              publico no proximo passo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Input
          placeholder="Ex: Divas Semijoias"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') criar()
          }}
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={criar} disabled={loading || !nome.trim()}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar e configurar
          </Button>
        </div>
      </div>
    </div>
  )
}
