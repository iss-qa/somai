'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Building2,
  Users,
  Fingerprint,
  Palette,
  TrendingUp,
  Sparkles,
  Heart,
  UserPlus,
  Lightbulb,
  X,
  Upload,
  Wand2,
  ImageIcon,
  Shuffle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  OnboardingAPI,
  type Objetivo,
  type OnboardingState,
  type EstiloVisual,
  type TomDeVoz,
} from '@/lib/onboarding-api'

const STEPS = [
  { key: 'objetivo', label: 'Objetivo', icon: Target },
  { key: 'marca', label: 'Marca', icon: Building2 },
  { key: 'publico', label: 'Publico', icon: Users },
  { key: 'identidade', label: 'Identidade', icon: Fingerprint },
  { key: 'estilo', label: 'Estilo', icon: Palette },
] as const

type StepKey = (typeof STEPS)[number]['key']

export default function WizardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  )
}

function WizardContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [saving, setSaving] = useState(false)

  const stepParam = params.get('step') as StepKey | null
  const currentIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === (stepParam || 'objetivo')),
  )
  const current = STEPS[currentIdx]

  useEffect(() => {
    OnboardingAPI.getState().then((s) => {
      if (s.onboardingCompleto) {
        router.replace('/app/dashboard')
        return
      }
      setState(s)
    })
  }, [router])

  const setField = (patch: Partial<OnboardingState>) => {
    setState((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const validar = (): string | null => {
    if (!state) return 'Carregando...'
    if (current.key === 'objetivo' && !state.objetivo)
      return 'Escolha um objetivo'
    if (current.key === 'marca' && !state.marca?.nome?.trim())
      return 'Informe o nome da marca'
    if (current.key === 'marca' && !state.marca?.descricao?.trim())
      return 'Descreva o que sua marca faz'
    if (
      current.key === 'publico' &&
      !state.publico?.clienteIdeal?.trim()
    )
      return 'Descreva seu cliente ideal'
    if (
      current.key === 'identidade' &&
      (!state.identidade?.tomDeVoz || state.identidade.tomDeVoz.length === 0)
    )
      return 'Selecione pelo menos 1 tom de voz'
    return null
  }

  const salvar = async (): Promise<boolean> => {
    if (!state) return false
    const payloadByStep: Record<StepKey, any> = {
      objetivo: { objetivo: state.objetivo },
      marca: state.marca,
      publico: state.publico,
      identidade: state.identidade,
      estilo: state.estiloVisual,
    }
    try {
      await OnboardingAPI.saveStep(
        current.key === 'estilo' ? 'estiloVisual' : current.key,
        payloadByStep[current.key],
      )
      return true
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar')
      return false
    }
  }

  const avancar = async () => {
    const erro = validar()
    if (erro) {
      toast.error(erro)
      return
    }
    setSaving(true)
    const ok = await salvar()
    if (!ok) {
      setSaving(false)
      return
    }
    if (currentIdx === STEPS.length - 1) {
      try {
        await OnboardingAPI.complete()
        toast.success('Tudo pronto! Bem-vindo a Soma.ai')
        router.replace('/app/dashboard')
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao concluir')
      } finally {
        setSaving(false)
      }
      return
    }
    setSaving(false)
    const next = STEPS[currentIdx + 1]
    router.push(`/onboarding/wizard?step=${next.key}`)
  }

  const voltar = () => {
    if (currentIdx === 0) {
      router.push('/onboarding')
      return
    }
    const prev = STEPS[currentIdx - 1]
    router.push(`/onboarding/wizard?step=${prev.key}`)
  }

  const fecharWizard = () => router.push('/onboarding')

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                soma<span className="text-purple-600">.ai</span>
              </div>
              <div className="text-xs text-gray-500">
                Configure sua conta em 5 passos simples
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Passo {currentIdx + 1} de {STEPS.length}
            </div>
            <button
              type="button"
              onClick={fecharWizard}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Progress */}
        <div className="mx-auto mt-3 max-w-4xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${((currentIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <div
                  key={s.key}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      active
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : done
                          ? 'border-purple-300 bg-purple-100 text-purple-600'
                          : 'border-gray-200 bg-white text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div
                    className={`text-xs ${active ? 'font-medium text-gray-900' : 'text-gray-500'}`}
                  >
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {current.key === 'objetivo' && (
            <StepObjetivo
              value={state.objetivo}
              onChange={(v) => setField({ objetivo: v })}
            />
          )}
          {current.key === 'marca' && (
            <StepMarca
              value={state.marca || {}}
              onChange={(v) => setField({ marca: v })}
            />
          )}
          {current.key === 'publico' && (
            <StepPublico
              value={state.publico || {}}
              onChange={(v) => setField({ publico: v })}
            />
          )}
          {current.key === 'identidade' && (
            <StepIdentidade
              value={state.identidade || {}}
              onChange={(v) => setField({ identidade: v })}
            />
          )}
          {current.key === 'estilo' && (
            <StepEstilo
              value={state.estiloVisual || {}}
              onChange={(v) => setField({ estiloVisual: v })}
              marcaNome={state.marca?.nome}
              objetivo={state.objetivo}
              identidade={state.identidade}
              publico={state.publico}
              marca={state.marca}
            />
          )}
        </div>
      </div>

      {/* Rodapé fixo */}
      <div className="sticky bottom-0 border-t bg-white px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button
            type="button"
            onClick={voltar}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentIdx === 0 ? 'Voltar a Analise' : 'Voltar'}
          </button>
          <Button
            onClick={avancar}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {currentIdx === STEPS.length - 1 ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PASSOS
// ─────────────────────────────────────────────

const OBJETIVO_OPCOES: {
  key: Objetivo
  titulo: string
  subtitulo: string
  icon: any
  bg: string
}[] = [
  {
    key: 'vender',
    titulo: 'Vender mais produtos/servicos',
    subtitulo: 'Aumentar vendas e conversoes',
    icon: TrendingUp,
    bg: 'bg-green-100 text-green-600',
  },
  {
    key: 'autoridade',
    titulo: 'Construir autoridade',
    subtitulo: 'Se tornar referencia no seu nicho',
    icon: Sparkles,
    bg: 'bg-pink-100 text-pink-600',
  },
  {
    key: 'engajamento',
    titulo: 'Aumentar engajamento',
    subtitulo: 'Criar comunidade ativa',
    icon: Heart,
    bg: 'bg-orange-100 text-orange-600',
  },
  {
    key: 'leads',
    titulo: 'Gerar leads qualificados',
    subtitulo: 'Captar potenciais clientes',
    icon: UserPlus,
    bg: 'bg-blue-100 text-blue-600',
  },
]

function StepObjetivo({
  value,
  onChange,
}: {
  value: Objetivo | null | undefined
  onChange: (v: Objetivo) => void
}) {
  return (
    <div>
      <Header
        icon={<Target className="h-6 w-6" />}
        title="Qual seu principal objetivo?"
        subtitle="Vamos comecar entendendo sua meta principal"
        color="from-purple-500 to-purple-600"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {OBJETIVO_OPCOES.map((o) => {
          const Icon = o.icon
          const selected = value === o.key
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`flex flex-col items-start rounded-2xl border-2 bg-white p-5 text-left transition ${
                selected
                  ? 'border-purple-500 shadow-md ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${o.bg}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">{o.titulo}</h3>
              <p className="text-sm text-gray-600">{o.subtitulo}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepMarca({
  value,
  onChange,
}: {
  value: Partial<OnboardingState['marca']>
  onChange: (v: Partial<OnboardingState['marca']>) => void
}) {
  const [avancado, setAvancado] = useState(false)
  return (
    <div>
      <Header
        icon={<Building2 className="h-6 w-6" />}
        title="Conte sobre sua marca"
        subtitle="Informacoes basicas para personalizarmos seu conteudo"
        color="from-purple-500 to-purple-600"
      />
      <div className="space-y-4">
        <Field label="Nome da Marca">
          <Input
            value={value.nome || ''}
            onChange={(e) => onChange({ ...value, nome: e.target.value })}
            placeholder="Ex: Minha Empresa"
          />
        </Field>
        <Field
          label="O que a marca faz?"
          hint="Descreva em poucas frases o negocio, produto ou servico"
        >
          <Textarea
            value={value.descricao || ''}
            onChange={(e) =>
              onChange({ ...value, descricao: e.target.value })
            }
            placeholder="Ex: Vendemos roupas femininas focadas em moda sustentavel..."
            rows={4}
          />
        </Field>
        <AvancadoToggle open={avancado} onToggle={() => setAvancado(!avancado)} />
        {avancado && (
          <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <Field
              label="Tag / Rotulo"
              optional
              hint="Identificador curto para diferenciar marcas com nomes parecidos"
            >
              <Input
                value={value.tag || ''}
                onChange={(e) => onChange({ ...value, tag: e.target.value })}
                placeholder="Ex: Clinica SP, Lancamento 2026, Pessoal"
              />
            </Field>
            <Field label="@ do Instagram" optional>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200">
                <span className="text-sm text-gray-400">@</span>
                <input
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  value={value.instagram || ''}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      instagram: e.target.value.replace(/^@/, ''),
                    })
                  }
                  placeholder="suaempresa"
                />
              </div>
            </Field>
            <Field label="Website" optional>
              <Input
                value={value.site || ''}
                onChange={(e) => onChange({ ...value, site: e.target.value })}
                placeholder="https://www.suaempresa.com.br"
              />
            </Field>
            <Field
              label="O que torna a marca unica?"
              optional
              hint="Qual o diferencial em relacao aos concorrentes?"
            >
              <Textarea
                value={value.diferencial || ''}
                onChange={(e) =>
                  onChange({ ...value, diferencial: e.target.value })
                }
                placeholder="Ex: Somos a unica marca que usa 100% algodao organico..."
                rows={3}
              />
            </Field>
            <Field
              label="Produtos/Servicos principais"
              optional
              hint="Liste os principais e, se possivel, a faixa de preco"
            >
              <Textarea
                value={value.produtosServicos || ''}
                onChange={(e) =>
                  onChange({ ...value, produtosServicos: e.target.value })
                }
                placeholder="Ex: Vestidos (R$150-300), Blusas (R$80-150), Calcas (R$120-200)"
                rows={3}
              />
            </Field>
            <Field label="Localizacao principal" optional>
              <Input
                value={value.localizacao || ''}
                onChange={(e) =>
                  onChange({ ...value, localizacao: e.target.value })
                }
                placeholder="Cidade / Estado"
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

function StepPublico({
  value,
  onChange,
}: {
  value: Partial<OnboardingState['publico']>
  onChange: (v: Partial<OnboardingState['publico']>) => void
}) {
  const [avancado, setAvancado] = useState(false)
  return (
    <div>
      <Header
        icon={<Users className="h-6 w-6" />}
        title="Quem e seu publico-alvo?"
        subtitle="Descreva as pessoas que voce quer alcancar"
        color="from-blue-500 to-cyan-500"
      />
      <div className="space-y-4">
        <Field
          label="Quem e o cliente ideal?"
          hint="Idade, genero, localizacao, profissao, estilo de vida"
        >
          <Textarea
            value={value.clienteIdeal || ''}
            onChange={(e) =>
              onChange({ ...value, clienteIdeal: e.target.value })
            }
            rows={4}
          />
        </Field>
        <AvancadoToggle open={avancado} onToggle={() => setAvancado(!avancado)} />
        {avancado && (
          <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <Field
              label="Quais sao as dores e problemas desse publico?"
              optional
              hint="O que incomoda? O que falta? Que problemas precisam resolver?"
            >
              <Textarea
                value={value.dores || ''}
                onChange={(e) => onChange({ ...value, dores: e.target.value })}
                rows={3}
              />
            </Field>
            <Field
              label="Quais sao os desejos e sonhos desse publico?"
              optional
            >
              <Textarea
                value={value.desejos || ''}
                onChange={(e) =>
                  onChange({ ...value, desejos: e.target.value })
                }
                rows={3}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

const TONS: { key: TomDeVoz; label: string }[] = [
  { key: 'descontraido', label: 'Descontraido' },
  { key: 'profissional', label: 'Profissional' },
  { key: 'inspirador', label: 'Inspirador' },
  { key: 'educativo', label: 'Educativo' },
  { key: 'divertido', label: 'Divertido' },
  { key: 'acolhedor', label: 'Acolhedor' },
  { key: 'direto', label: 'Direto' },
  { key: 'sofisticado', label: 'Sofisticado' },
  { key: 'amigavel', label: 'Amigavel' },
  { key: 'motivacional', label: 'Motivacional' },
]

function StepIdentidade({
  value,
  onChange,
}: {
  value: Partial<OnboardingState['identidade']>
  onChange: (v: Partial<OnboardingState['identidade']>) => void
}) {
  const [avancado, setAvancado] = useState(false)
  const tons = value.tomDeVoz || []
  const toggleTom = (k: TomDeVoz) => {
    if (tons.includes(k)) {
      onChange({ ...value, tomDeVoz: tons.filter((t) => t !== k) })
    } else if (tons.length < 4) {
      onChange({ ...value, tomDeVoz: [...tons, k] })
    } else {
      toast.error('Maximo 4 tons')
    }
  }
  return (
    <div>
      <Header
        icon={<Fingerprint className="h-6 w-6" />}
        title="Qual a personalidade da sua marca?"
        subtitle="Como voce quer que as pessoas percebam sua marca?"
        color="from-purple-500 to-pink-500"
      />
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tom de voz
          </label>
          <p className="mb-3 text-xs text-gray-500">
            Selecione os tons que melhor representam sua marca (1 a 4)
          </p>
          <div className="flex flex-wrap gap-2">
            {TONS.map((t) => {
              const active = tons.includes(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleTom(t.key)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? 'border-purple-500 bg-purple-100 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        <AvancadoToggle open={avancado} onToggle={() => setAvancado(!avancado)} />
        {avancado && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <Field
              label="Se a marca fosse uma pessoa, como ela seria?"
              optional
              hint="Descreva personalidade, jeito de falar, estilo"
            >
              <Textarea
                value={value.personalidade || ''}
                onChange={(e) =>
                  onChange({ ...value, personalidade: e.target.value })
                }
                rows={4}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

type PaletaPreset = { key: string; nome: string; cores: [string, string, string] }

const PALETAS_BASE: PaletaPreset[] = [
  { key: 'coral', nome: 'Coral Suave', cores: ['#F47C7C', '#FFFDF6', '#F7B2AD'] },
  { key: 'neutro', nome: 'Neutro', cores: ['#1F2937', '#F3F4F6', '#9CA3AF'] },
  { key: 'por-do-sol', nome: 'Por do Sol', cores: ['#F59E0B', '#FEF3C7', '#FBBF24'] },
  { key: 'frutas-vermelhas', nome: 'Frutas Vermelhas', cores: ['#9F1239', '#FECDD3', '#E11D48'] },
]

const PALETAS_EXTRA: PaletaPreset[] = [
  { key: 'oceano', nome: 'Oceano', cores: ['#0EA5E9', '#E0F2FE', '#0369A1'] },
  { key: 'floresta', nome: 'Floresta', cores: ['#065F46', '#D1FAE5', '#10B981'] },
  { key: 'lavanda', nome: 'Lavanda', cores: ['#7C3AED', '#EDE9FE', '#A78BFA'] },
  { key: 'terracota', nome: 'Terracota', cores: ['#9A3412', '#FED7AA', '#EA580C'] },
]

function StepEstilo({
  value,
  onChange,
  marcaNome,
  objetivo,
  identidade,
  publico,
  marca,
}: {
  value: Partial<OnboardingState['estiloVisual']>
  onChange: (v: Partial<OnboardingState['estiloVisual']>) => void
  marcaNome?: string
  objetivo?: Objetivo | null
  identidade?: Partial<OnboardingState['identidade']>
  publico?: Partial<OnboardingState['publico']>
  marca?: Partial<OnboardingState['marca']>
}) {
  const user = useAuthStore((s) => s.user)
  const [personalizar, setPersonalizar] = useState(false)
  const [paletasPage, setPaletasPage] = useState<0 | 1>(0)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [refinando, setRefinando] = useState(false)

  const cores = [
    value.cores?.[0] ?? '',
    value.cores?.[1] ?? '',
    value.cores?.[2] ?? '',
  ]

  const paletas = paletasPage === 0 ? PALETAS_BASE : PALETAS_EXTRA
  const activePaleta = value.paleta || ''

  const aplicarPaleta = (p: PaletaPreset) => {
    onChange({ ...value, paleta: p.key, cores: [...p.cores] })
  }

  const setCor = (i: number, v: string) => {
    const next = [...cores]
    next[i] = v
    onChange({ ...value, paleta: 'personalizado', cores: next })
  }

  const uploadLogo = async (file: File) => {
    if (!user?.companyId) {
      toast.error('Empresa nao encontrada')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo deve ter no maximo 5MB')
      return
    }
    try {
      setUploadingLogo(true)
      const dataUrl = await fileToDataUrl(file)
      const res = await api.post<{ logo_url: string }>(
        `/api/companies/${user.companyId}/logo`,
        { dataUrl },
      )
      onChange({ ...value, logoUrl: res.logo_url })
      toast.success('Logo enviada!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const uploadReferencia = async (file: File) => {
    if (!user?.companyId) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Referencia deve ter no maximo 5MB')
      return
    }
    try {
      setUploadingRef(true)
      const dataUrl = await fileToDataUrl(file)
      const res = await api.post<{ logo_url: string }>(
        `/api/companies/${user.companyId}/logo`,
        { dataUrl },
      )
      onChange({ ...value, referenciaUrl: res.logo_url })
      toast.success('Referencia adicionada')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar referencia')
    } finally {
      setUploadingRef(false)
    }
  }

  const refinarComIA = async () => {
    setRefinando(true)
    try {
      const res = await api.post<{ descricao: string }>(
        '/api/onboarding/refine-style',
        {
          marcaNome,
          objetivo,
          marca,
          publico,
          identidade,
          referenciaUrl: value.referenciaUrl || '',
          cores: value.cores || [],
          descricaoAtual: value.descricao || '',
        },
      )
      onChange({ ...value, descricao: res.descricao })
      toast.success('Descricao refinada')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao refinar')
    } finally {
      setRefinando(false)
    }
  }

  return (
    <div>
      <Header
        icon={<Palette className="h-6 w-6" />}
        title="Estilo visual da marca"
        subtitle="Defina a identidade visual para suas criacoes"
        color="from-pink-500 to-rose-500"
      />
      <div className="space-y-5">
        {/* Logo da marca */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-amber-500" />
            <label className="text-sm font-medium text-gray-800">
              Logo da marca
            </label>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
              opcional
            </span>
          </div>

          {value.logoUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <img
                src={value.logoUrl}
                alt="Logo"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium text-gray-900">Logo enviada</div>
                <div className="truncate text-xs text-gray-500">
                  {value.logoUrl}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...value, logoUrl: '' })}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ) : (
            <LogoUpload onFile={uploadLogo} uploading={uploadingLogo} />
          )}
        </div>

        {/* Cores */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-500" />
              <label className="text-sm font-medium text-gray-800">
                Cores da marca
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              Personalizar
              <input
                type="checkbox"
                checked={personalizar}
                onChange={(e) => setPersonalizar(e.target.checked)}
                className="h-4 w-7 appearance-none rounded-full bg-gray-300 transition-colors checked:bg-purple-500 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-3 cursor-pointer"
              />
            </label>
          </div>

          <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <span className="text-xs text-gray-500">Cores atuais:</span>
            {(['Primaria', 'Secundaria', 'Destaque'] as const).map(
              (label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span
                    className="h-6 w-6 rounded border border-gray-200"
                    style={{ backgroundColor: cores[i] || 'transparent' }}
                  />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ),
            )}
          </div>

          {personalizar ? (
            <div className="flex gap-3">
              {(['Primaria', 'Secundaria', 'Destaque'] as const).map(
                (label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={cores[i] || '#000000'}
                      onChange={(e) => setCor(i, e.target.value)}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-gray-200"
                    />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {paletas.map((p) => {
                  const active = activePaleta === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => aplicarPaleta(p)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition ${
                        active
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex gap-1">
                        {p.cores.map((c, i) => (
                          <span
                            key={i}
                            className="h-5 w-5 rounded-full border border-white shadow"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {p.nome}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPaletasPage((p) => (p === 0 ? 1 : 0))}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-purple-300"
                >
                  <Shuffle className="h-3 w-3" />
                  Ver outras paletas
                </button>
              </div>
            </>
          )}
        </div>

        {/* Descrição do estilo visual */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <label className="text-sm font-medium text-gray-800">
              Descricao do estilo visual
            </label>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            A IA gera esta descricao baseada nos dados da sua marca. Edite
            livremente ou adicione uma referencia visual.
          </p>
          <Textarea
            value={value.descricao || ''}
            onChange={(e) =>
              onChange({ ...value, descricao: e.target.value })
            }
            rows={6}
            placeholder="Ex: Visual clean e moderno, tipografia sans-serif, tons sobrios com um ponto de cor..."
          />

          <div className="mt-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 hover:border-purple-400 md:flex-1">
              <Upload className="h-3 w-3" />
              {uploadingRef
                ? 'Enviando...'
                : value.referenciaUrl
                  ? 'Trocar referencia visual'
                  : 'Adicionar referencia visual'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingRef}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadReferencia(f)
                }}
              />
            </label>
            <button
              type="button"
              onClick={refinarComIA}
              disabled={refinando}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-medium text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
            >
              {refinando ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              Refinar com IA
            </button>
          </div>

          {value.referenciaUrl ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <img
                src={value.referenciaUrl}
                alt="Referencia"
                className="h-10 w-10 rounded object-cover"
              />
              <span className="flex-1 truncate text-xs text-gray-600">
                Referencia carregada
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...value, referenciaUrl: '' })}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ) : null}

          <p className="mt-2 text-[11px] text-gray-400">
            Esta descricao guia a IA na geracao de imagens para sua marca.
            Quanto mais detalhada, melhores os resultados.
          </p>
        </div>
      </div>
    </div>
  )
}

function LogoUpload({
  onFile,
  uploading,
}: {
  onFile: (f: File) => void
  uploading: boolean
}) {
  const [drag, setDrag] = useState(false)
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition ${
        drag
          ? 'border-purple-500 bg-purple-50'
          : 'border-gray-300 bg-white hover:border-purple-400'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        ) : (
          <Upload className="h-5 w-5 text-gray-500" />
        )}
      </div>
      <span className="text-sm font-medium text-gray-800">
        {uploading ? 'Enviando...' : 'Enviar logo'}
      </span>
      <span className="text-xs text-gray-500">
        PNG, JPG ou WebP ate 5MB
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────
function Header({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
}) {
  return (
    <div className="mb-6 text-center">
      <div
        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md`}
      >
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  )
}

function Field({
  label,
  children,
  hint,
  optional,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  optional?: boolean
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {optional && (
          <span className="text-xs text-gray-400">(opcional)</span>
        )}
      </div>
      {hint && <p className="mb-2 text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  )
}

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
    />
  )
}

function AvancadoToggle({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-left text-sm hover:bg-purple-50"
    >
      <Lightbulb className="h-4 w-4 text-purple-500" />
      <div className="flex-1">
        <div className="font-medium text-gray-900">Configuracoes avancadas</div>
        <div className="text-xs text-gray-500">
          Esses detalhes ajudam a IA a criar conteudo ainda melhor, mas voce
          pode preencher depois.
        </div>
      </div>
      {open ? (
        <ChevronUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      )}
    </button>
  )
}
