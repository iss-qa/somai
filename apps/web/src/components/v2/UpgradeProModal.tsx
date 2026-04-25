'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Sparkles, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export function UpgradeProModal({
  open,
  onClose,
  title = 'Continue criando conteudo incrivel!',
  subtitle = 'Crie posts profissionais sem limites! Faca upgrade para acessar tudo.',
}: Props) {
  const router = useRouter()
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')

  if (!open) return null

  const precoMensal = 59.9
  const precoAnualAVista = 579
  const economiaAnual = precoMensal * 12 - precoAnualAVista

  const beneficios = [
    { text: '600 creditos mensais de IA (~40 posts)', destaque: true },
    { text: 'Acesso a atualizacoes futuras' },
    { text: 'Inspiracoes sem restricoes' },
    { text: 'Calendario editorial completo' },
    { text: 'Agendamento de publicacoes' },
    { text: 'Suporte prioritario' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header gradiente */}
        <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 px-6 py-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/25 text-2xl">
              🎨
            </div>
            <div>
              <h2 className="text-lg font-bold md:text-xl">{title}</h2>
              <p className="mt-1 text-sm text-white/90">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-2 md:px-8">
          {/* Coluna beneficios */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-500" />
              Plano PRO inclui:
            </div>
            <ul className="space-y-2">
              {beneficios.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      b.destaque
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span
                    className={
                      b.destaque
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }
                  >
                    {b.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna preco */}
          <div>
            {/* Toggle mensal/anual */}
            <div className="relative mb-4 grid grid-cols-2 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setCiclo('mensal')}
                className={`rounded-full py-1.5 text-xs font-semibold transition ${
                  ciclo === 'mensal'
                    ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setCiclo('anual')}
                className={`relative rounded-full py-1.5 text-xs font-semibold transition ${
                  ciclo === 'anual'
                    ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                Anual
                <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  -30%
                </span>
              </button>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-gray-800/60">
              {ciclo === 'mensal' ? (
                <>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-500">R$</span>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      59,90
                    </span>
                    <span className="text-sm text-gray-500">/mes</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Renovacao mensal automatica
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-500">R$</span>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      48,25
                    </span>
                    <span className="text-sm text-gray-500">/mes</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    R$ {precoAnualAVista.toFixed(2).replace('.', ',')} a vista ou
                    12x de R$ 48,25
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    💚 Economize R${' '}
                    {economiaAnual.toFixed(2).replace('.', ',')}/ano
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={() => router.push('/app/planos')}
              className="mt-4 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 text-white shadow-lg hover:from-amber-500 hover:to-orange-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Assinar PRO {ciclo === 'anual' ? 'Anual' : 'Mensal'}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 block w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Talvez depois
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
