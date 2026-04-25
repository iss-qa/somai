'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, Calendar, Zap, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface PautaItem {
  data: string
  horario: string
  formato: string
  objetivo: string
  headline: string
  copy: string
  hashtags: string[]
  dataComemorativa?: string
}

export function GerarPautaIA({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pauta, setPauta] = useState<PautaItem[] | null>(null)

  const gerar = async () => {
    setLoading(true)
    setPauta(null)
    try {
      const res = await api.post<{ pauta: PautaItem[]; total: number }>(
        '/api/calendar-ai/gerar-pauta-mes',
        { quantidade: 15 },
      )
      setPauta(res.pauta)
      toast.success(
        `${res.total} ideias geradas! +100 XP por criar calendario`,
        { duration: 4000 },
      )
      onSuccess?.()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar pauta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true)
          if (!pauta) gerar()
        }}
        variant="outline"
        className="border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Gerar pauta do mes com IA
        <span className="ml-2 rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-semibold">
          +100 XP
        </span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    Pauta do mes
                  </div>
                  <div className="text-xs text-gray-500">
                    {pauta
                      ? `${pauta.length} ideias personalizadas para sua marca`
                      : 'Criando sua estrategia do mes...'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <p className="text-sm text-gray-600">
                    A IA esta analisando sua marca e gerando as melhores
                    ideias...
                  </p>
                </div>
              )}
              {!loading && pauta && pauta.length === 0 && (
                <div className="py-16 text-center text-sm text-gray-500">
                  A IA nao retornou uma pauta valida. Tente novamente.
                </div>
              )}
              {!loading && pauta && pauta.length > 0 && (
                <div className="space-y-2">
                  {pauta.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3"
                    >
                      <div className="flex h-12 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 text-[10px] font-semibold text-purple-700">
                        {new Date(p.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                        <div className="text-[9px] text-gray-600">
                          {p.horario}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1">
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] uppercase text-purple-700">
                            {p.formato}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                            {p.objetivo}
                          </span>
                          {p.dataComemorativa && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                              🎉 {p.dataComemorativa}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {p.headline}
                        </div>
                        <p className="line-clamp-2 text-xs text-gray-600">
                          {p.copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 p-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Fechar
              </button>
              <div className="flex gap-2">
                {!loading && pauta && pauta.length > 0 && (
                  <Button
                    onClick={gerar}
                    variant="outline"
                    disabled={loading}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Gerar outra
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
