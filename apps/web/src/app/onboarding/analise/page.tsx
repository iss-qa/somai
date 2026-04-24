'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Check,
  Pencil,
  Target,
  Users,
  Palette,
  MessageSquare,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OnboardingAPI, type OnboardingState } from '@/lib/onboarding-api'

type SecaoKey = 'marca' | 'publico' | 'estilo' | 'tom'

const SECOES: { key: SecaoKey; titulo: string; icon: any; bg: string }[] = [
  { key: 'marca', titulo: 'Dados Basicos', icon: Target, bg: 'bg-purple-500/20' },
  { key: 'publico', titulo: 'Publico-alvo', icon: Users, bg: 'bg-blue-500/20' },
  { key: 'estilo', titulo: 'Estilo Visual', icon: Palette, bg: 'bg-pink-500/20' },
  { key: 'tom', titulo: 'Tom de Voz', icon: MessageSquare, bg: 'bg-green-500/20' },
]

export default function AnalisePage() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [expanded, setExpanded] = useState<SecaoKey | null>(null)

  useEffect(() => {
    OnboardingAPI.getState().then((s) => {
      if (s.onboardingCompleto) {
        router.replace('/app/dashboard')
        return
      }
      if (!s.onboardingFonte || s.onboardingFonte === 'manual') {
        router.replace('/onboarding')
        return
      }
      setState(s)
    })
  }, [router])

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const fonte = state.onboardingFonte
  const handle = state.instagramHandle
  const badge =
    fonte === 'instagram' && handle
      ? `Fonte: 📸 @${handle}`
      : fonte === 'site'
        ? 'Fonte: 🌐 seu site'
        : ''

  const cores = state.estiloVisual?.cores || []
  const logoUrl = state.estiloVisual?.logoUrl || ''

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analisamos sua marca!
          </h1>
          <p className="mt-2 text-gray-600">
            Encontramos sua logo e extraimos as cores automaticamente
          </p>
          {badge && (
            <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {badge}
            </span>
          )}
        </div>

        {/* Logo + cores */}
        <div className="mb-4 rounded-2xl border-2 border-green-300 bg-green-50/60 p-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-16 rounded-xl object-cover ring-2 ring-white"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-xs text-gray-400">
                sem logo
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                <Check className="h-4 w-4" />
                Logo detectada!
              </div>
              <p className="text-xs text-gray-600">
                As cores da marca foram extraidas automaticamente da sua logo.
              </p>
            </div>
            <div className="flex gap-1">
              {cores.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Seções preenchidas */}
        <div className="space-y-2">
          {SECOES.map((s) => {
            const Icon = s.icon
            const isOpen = expanded === s.key
            return (
              <div
                key={s.key}
                className="rounded-2xl border border-gray-200 bg-white transition hover:border-purple-300"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-4"
                  onClick={() => setExpanded(isOpen ? null : s.key)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}
                    >
                      <Icon className="h-4 w-4 text-gray-700" />
                    </span>
                    <span className="font-medium text-gray-900">
                      {s.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Check className="h-4 w-4 text-green-500" />
                    <Pencil className="h-4 w-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-gray-100 px-4 pb-4 pt-3 text-sm text-gray-700">
                    <SecaoPreview secao={s.key} state={state} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={() => router.push('/onboarding/wizard?step=objetivo')}
            className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Tudo certo! Continuar
          </Button>
          <button
            type="button"
            onClick={() => router.push('/onboarding/wizard?step=objetivo')}
            className="text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
          >
            Quero ajustar manualmente
          </button>
        </div>
      </div>
    </div>
  )
}

function SecaoPreview({
  secao,
  state,
}: {
  secao: SecaoKey
  state: OnboardingState
}) {
  if (secao === 'marca') {
    return (
      <>
        <Field label="Nome" value={state.marca?.nome || ''} />
        <Field label="Descricao" value={state.marca?.descricao || ''} />
        {state.marca?.produtosServicos ? (
          <Field
            label="Produtos/Servicos"
            value={state.marca.produtosServicos}
          />
        ) : null}
        {state.marca?.diferencial ? (
          <Field label="Diferencial" value={state.marca.diferencial} />
        ) : null}
        {state.marca?.instagram ? (
          <Field label="Instagram" value={`@${state.marca.instagram}`} />
        ) : null}
        {state.marca?.site ? (
          <Field label="Site" value={state.marca.site} />
        ) : null}
      </>
    )
  }
  if (secao === 'publico') {
    return (
      <>
        <Field
          label="Cliente Ideal"
          value={state.publico?.clienteIdeal || ''}
        />
        <Field label="Dores" value={state.publico?.dores || ''} />
        <Field label="Desejos" value={state.publico?.desejos || ''} />
      </>
    )
  }
  if (secao === 'estilo') {
    return (
      <>
        <Field label="Estilo" value={state.estiloVisual?.estilo || '-'} />
        <Field
          label="Cores"
          value={(state.estiloVisual?.cores || []).join(', ') || '-'}
        />
      </>
    )
  }
  return (
    <>
      <Field
        label="Tom de Voz"
        value={(state.identidade?.tomDeVoz || []).join(', ') || '-'}
      />
      <Field
        label="Personalidade"
        value={state.identidade?.personalidade || ''}
      />
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500">{label}:</div>
      <div className="text-sm text-gray-800">{value || '-'}</div>
    </div>
  )
}
