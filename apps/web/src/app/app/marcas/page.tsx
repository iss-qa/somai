'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Check,
  ArrowRight,
  Building2,
  Instagram,
  Sparkles,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { MarcaResumo } from '@/components/v2/BrandSwitcher'

export default function MarcasPage() {
  const router = useRouter()
  const [marcas, setMarcas] = useState<MarcaResumo[]>([])
  const [ativaId, setAtivaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    carregar()
  }, [])

  const ativar = async (id: string) => {
    try {
      await api.post(`/api/marcas/${id}/ativar`)
      toast.success('Marca ativada')
      window.location.href = '/app/dashboard'
    } catch (err: any) {
      toast.error(err?.message || 'Erro')
    }
  }

  const continuarSetup = async (id: string) => {
    // ativa essa marca e vai pro onboarding
    if (id !== ativaId) await api.post(`/api/marcas/${id}/ativar`)
    window.location.href = '/onboarding'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white md:h-12 md:w-12">
            <Building2 className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
              Suas marcas
            </h1>
            <p className="truncate text-sm text-gray-600 dark:text-gray-400">
              Gerencie todas as marcas que voce atende
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/onboarding')}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Adicionar Nova Marca</span>
          <span className="sm:hidden">Nova marca</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : marcas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Voce ainda nao tem nenhuma marca.
          </p>
          <Button onClick={() => router.push('/onboarding')}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira marca
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {marcas.map((m) => {
            const isAtiva = m.id === ativaId
            return (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-2xl border-2 bg-white p-5 transition dark:bg-gray-900 ${
                  isAtiva
                    ? 'border-purple-500 shadow-md dark:border-purple-500'
                    : 'border-gray-200 hover:border-purple-300 dark:border-gray-800 dark:hover:border-purple-700'
                }`}
              >
                {isAtiva && (
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                    <Check className="h-3 w-3" />
                    Ativa
                  </div>
                )}
                <div className="flex items-start gap-3">
                  {m.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.logo}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-white dark:ring-gray-800"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-200 to-pink-200">
                      <Building2 className="h-6 w-6 text-purple-700" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900 dark:text-white">
                      {m.nome}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                      {m.descricao || m.niche || 'Sem descricao'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {m.onboardingCompleto ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <Check className="h-3 w-3" /> Configurada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Setup em {m.onboardingStep}
                        </span>
                      )}
                      {m.instagramConectado && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200">
                          <Instagram className="h-3 w-3" />
                          {m.instagramHandle ? `@${m.instagramHandle}` : 'Conectado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {!m.onboardingCompleto ? (
                    <Button
                      size="sm"
                      onClick={() => continuarSetup(m.id)}
                      className="flex-1"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Continuar setup
                    </Button>
                  ) : !isAtiva ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => ativar(m.id)}
                      className="flex-1"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Ativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/app/dashboard')}
                      className="flex-1"
                    >
                      Abrir
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
