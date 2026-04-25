'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Instagram, Globe, Loader2, Sparkles, ArrowRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OnboardingAPI } from '@/lib/onboarding-api'

type Opcao = 'instagram' | 'site' | null

export default function OnboardingInicioPage() {
  const router = useRouter()
  const [opcao, setOpcao] = useState<Opcao>(null)
  const [urlSite, setUrlSite] = useState('')
  const [analisando, setAnalisando] = useState(false)
  const [confirmIg, setConfirmIg] = useState(false)
  const [metaConfig, setMetaConfig] = useState<{
    appId: string
    redirectUri: string
    configured: boolean
  } | null>(null)

  useEffect(() => {
    // Multi-marca: sempre permitimos entrar em /onboarding pra
    // (re)configurar a marca ativa. Não forçamos redirect.
    OnboardingAPI.getMetaConfig().then(setMetaConfig).catch(() => {})
  }, [])

  const conectarInstagram = async () => {
    if (!metaConfig?.configured) {
      toast.error('Integracao Meta nao configurada no servidor')
      return
    }
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
    ].join(',')
    const state = Math.random().toString(36).slice(2)
    sessionStorage.setItem('soma_onb_meta_state', state)

    const oauthUrl =
      `https://www.facebook.com/v25.0/dialog/oauth` +
      `?client_id=${metaConfig.appId}` +
      `&redirect_uri=${encodeURIComponent(metaConfig.redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=${state}`

    const w = 600
    const h = 720
    const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2
    const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2
    const popup = window.open(
      oauthUrl,
      'soma-ig-oauth',
      `width=${w},height=${h},top=${y},left=${x}`,
    )
    if (!popup) {
      toast.error('Permita popups para conectar o Instagram')
      return
    }

    setAnalisando(true)
    toast.loading('Aguardando autorizacao...', { id: 'ig-oauth' })

    const handler = async (ev: MessageEvent) => {
      if (ev.data?.type !== 'soma-meta-oauth') return
      window.removeEventListener('message', handler)
      toast.dismiss('ig-oauth')

      if (ev.data.error) {
        setAnalisando(false)
        toast.error(ev.data.error)
        return
      }
      const expected = sessionStorage.getItem('soma_onb_meta_state')
      if (expected && ev.data.state !== expected) {
        setAnalisando(false)
        toast.error('Estado OAuth invalido')
        return
      }

      try {
        toast.loading('Analisando sua marca...', { id: 'ig-analyze' })
        const res = await OnboardingAPI.analyzeInstagram(
          ev.data.code,
          metaConfig.redirectUri,
        )
        toast.success(`Instagram conectado! Analisando @${res.handle}...`, {
          id: 'ig-analyze',
        })
        router.push('/onboarding/analise')
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao analisar Instagram', {
          id: 'ig-analyze',
        })
        setAnalisando(false)
      }
    }
    window.addEventListener('message', handler)
  }

  const analisarSite = async () => {
    if (!urlSite.trim()) {
      toast.error('Digite a URL do seu site')
      return
    }
    setAnalisando(true)
    try {
      toast.loading('Abrindo seu site e analisando...', { id: 'site-analyze' })
      await OnboardingAPI.analyzeWebsite(urlSite.trim())
      toast.success('Analise concluida!', { id: 'site-analyze' })
      router.push('/onboarding/analise')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao analisar site', {
        id: 'site-analyze',
      })
      setAnalisando(false)
    }
  }

  const pularAnalise = async () => {
    try {
      await OnboardingAPI.skipAnalysis()
      router.push('/onboarding/wizard?step=objetivo')
    } catch (err: any) {
      toast.error(err?.message || 'Erro')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Vamos agilizar!
          </h1>
          <p className="mt-2 text-gray-600">
            Podemos preencher quase tudo automaticamente usando IA
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card Instagram */}
          <button
            type="button"
            onClick={() => setOpcao('instagram')}
            disabled={analisando}
            className={`group relative flex flex-col items-start rounded-2xl border-2 bg-white p-6 text-left transition hover:shadow-lg disabled:opacity-50 ${
              opcao === 'instagram'
                ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="absolute right-4 top-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              Recomendado
            </div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tenho Instagram
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Conecte em 1 clique. Vamos analisar seus ultimos posts, logo e
              bio automaticamente.
            </p>
            <div
              className="group/req relative mt-3 inline-flex items-center gap-1 text-xs text-gray-400"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Requer conta Business ou Creator</span>
              <Info className="h-3 w-3 text-gray-400 transition group-hover/req:text-gray-600" />
              <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg opacity-0 transition-opacity group-hover/req:opacity-100">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Pre-requisitos
                </p>
                <ul className="space-y-1.5 text-xs leading-snug text-gray-600">
                  <li className="flex gap-1.5">
                    <span className="text-purple-500">•</span>
                    <span>Conta Instagram <strong className="text-gray-800">Profissional</strong> (Business ou Creator)</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-purple-500">•</span>
                    <span>Vinculada a uma <strong className="text-gray-800">Pagina do Facebook</strong></span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-purple-500">•</span>
                    <span>Voce precisa ser <strong className="text-gray-800">admin da Pagina</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </button>

          {/* Card Site */}
          <button
            type="button"
            onClick={() => setOpcao('site')}
            disabled={analisando}
            className={`group relative flex flex-col items-start rounded-2xl border-2 bg-white p-6 text-left transition hover:shadow-lg disabled:opacity-50 ${
              opcao === 'site'
                ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tenho um Website
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              A IA acessa o site e extrai nome, cores, tom de voz e
              publico-alvo.
            </p>
          </button>
        </div>

        {opcao === 'site' && (
          <div className="mt-6 rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              URL do seu site
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://suamarca.com.br"
                value={urlSite}
                onChange={(e) => setUrlSite(e.target.value)}
                disabled={analisando}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') analisarSite()
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled={!opcao || analisando}
            onClick={() => {
              if (opcao === 'instagram') setConfirmIg(true)
              else if (opcao === 'site') analisarSite()
            }}
            className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700"
          >
            {analisando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                Analisar e Preencher
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={pularAnalise}
            disabled={analisando}
            className="text-sm text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline"
          >
            Preencher manualmente
          </button>
        </div>
      </div>

      {confirmIg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Instagram className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-center text-xl font-bold text-gray-900">
              Confirmar conta do Instagram
            </h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">
              Verifique se você está logado na{' '}
              <span className="font-semibold text-gray-900">conta correta</span>{' '}
              do Instagram no seu navegador. A conexão será feita com a conta
              que estiver logada no momento.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmIg(false)}
                disabled={analisando}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  setConfirmIg(false)
                  conectarInstagram()
                }}
                disabled={analisando}
              >
                Continuar e conectar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
