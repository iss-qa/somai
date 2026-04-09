'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/authStore'
import {
  CheckCircle2,
  ExternalLink,
  LogIn,
  Key,
  Settings,
  Shield,
  Save,
  ZoomIn,
  X,
  Hash,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AppWindow,
} from 'lucide-react'

/* ── Tutorial image: collapsible + lightbox ──── */
function TutorialImage({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 transition-colors"
      >
        {expanded ? <X className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
        <span>{expanded ? 'Ocultar imagem' : label}</span>
      </button>
      {expanded && (
        <button
          onClick={() => setLightbox(true)}
          className="group relative block w-full rounded-lg overflow-hidden border border-brand-border hover:border-primary-500/50 transition-colors cursor-zoom-in"
        >
          <Image src={src} alt={alt} width={800} height={400} className="w-full h-auto" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
              <ZoomIn className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <Image src={src} alt={alt} width={1400} height={800} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

/* ── Production URLs (always Soma.ai domain) ── */
const SOMA_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'somai.issqa.com.br'
const SOMA_ORIGIN = `https://${SOMA_DOMAIN}`
const SOMA_REDIRECT_URI = `${SOMA_ORIGIN}/app/settings/integrations`

/* ── Step definitions ────────────────────────── */
interface Step {
  id: string
  title: string
  shortTitle: string
  icon: typeof Settings
}

const STEPS: Step[] = [
  { id: 'create_app', title: 'Criar App no Facebook Developers', shortTitle: '1. Criar App', icon: Settings },
  { id: 'credentials', title: 'Credenciais do App Meta', shortTitle: '2. Credenciais', icon: Key },
  { id: 'config_permissions', title: 'Configuração e Permissões', shortTitle: '3. Config', icon: Shield },
  { id: 'connect', title: 'Conectar com Facebook/Instagram', shortTitle: '4. Conectar', icon: LogIn },
]

const STORAGE_KEY_PREFIX = 'soma_integration_checklist'

/* ── Props ───────────────────────────────────── */
interface IntegrationChecklistProps {
  onAllCompleted?: (completed: boolean) => void
  metaAppId: string
  metaAppSecret: string
  showAppSecret: boolean
  savingApp: boolean
  onMetaAppIdChange: (v: string) => void
  onMetaAppSecretChange: (v: string) => void
  onToggleShowAppSecret: () => void
  onSaveAppCredentials: () => void
}

export default function IntegrationChecklist({
  onAllCompleted,
  metaAppId,
  metaAppSecret,
  showAppSecret,
  savingApp,
  onMetaAppIdChange,
  onMetaAppSecretChange,
  onToggleShowAppSecret,
  onSaveAppCredentials,
}: IntegrationChecklistProps) {
  const companyId = useAuthStore((s) => s.user?.companyId)
  const storageKey = `${STORAGE_KEY_PREFIX}_${companyId || 'default'}`
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState(STEPS[0].id)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setCompletedSteps(JSON.parse(saved))
      else setCompletedSteps({})
    } catch {}
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completedSteps))
    const allDone = STEPS.every((s) => completedSteps[s.id])
    onAllCompleted?.(allDone)
  }, [completedSteps, onAllCompleted, storageKey])

  const completedCount = STEPS.filter((s) => completedSteps[s.id]).length
  const percentage = Math.round((completedCount / STEPS.length) * 100)

  function toggleStep(id: string) {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-100">Checklist de Integração</h3>
          <p className="text-xs text-gray-500 mt-0.5">Complete as etapas para ativar a integração</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">{completedCount}/{STEPS.length}</span>
          <Badge variant={percentage === 100 ? 'success' : percentage > 0 ? 'warning' : 'secondary'}>
            {percentage}%
          </Badge>
        </div>
      </div>
      <Progress value={percentage} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex h-auto gap-1 p-1">
          {STEPS.map((step, index) => {
            const done = completedSteps[step.id]
            return (
              <TabsTrigger key={step.id} value={step.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 flex-1 min-w-0">
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-gray-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                )}
                <span className={`truncate ${done ? 'line-through text-gray-500' : ''}`}>{step.shortTitle}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 1 — Criar App                          */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="create_app">
          <StepWrapper step={STEPS[0]} index={0} done={completedSteps['create_app']} onToggle={() => toggleStep('create_app')}>
            <div className="space-y-5">
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Pré-requisito: ter acesso de administrador no{' '}
                  <a href="https://business.facebook.com/" target="_blank" rel="noopener" className="underline">Meta Business Suite</a>{' '}
                  e uma <strong>Página do Facebook</strong> já criada para a empresa.
                </p>
              </div>

              {/* Passo: Criar app */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">1. Criar o aplicativo</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>
                      Acesse{' '}
                      <a href="https://developers.facebook.com/apps/creation/" target="_blank" rel="noopener"
                        className="text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1">
                        developers.facebook.com/apps/creation <ExternalLink className="w-3 h-3" />
                      </a>
                    </span>
                  </li>
                  <li className="ml-7">
                    <TutorialImage src="/images/tutorial/criar-apps.png" alt="Tela de criação de app" label="Ver tela de criação" />
                  </li>
                  <li className="flex items-start gap-2">
                    <Bullet n={2} />
                    <span>Preencha o <strong className="text-gray-200">Nome do app</strong> (ex: nome da empresa) e o <strong className="text-gray-200">E-mail de contato</strong></span>
                  </li>
                </ol>
              </div>

              {/* Passo: Casos de uso */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">2. Casos de uso</p>
                <p className="text-xs text-gray-500">Na tela de casos de uso, marque as seguintes opções:</p>
                <div className="space-y-2 ml-1">
                  {[
                    { name: 'Criar e gerenciar anúncios com a API de Marketing', checked: true },
                    { name: 'Criar e gerenciar anúncios de apps com o Gerenciador de Anúncios da Meta', checked: true },
                    { name: 'Acessar a API do Threads', checked: false },
                    { name: 'Launch an Instant Game on Facebook and Messenger', checked: false },
                    { name: 'Autenticar e solicitar dados de usuários com o Login do Facebook', checked: false },
                    { name: 'Conectar-se com clientes pelo WhatsApp', checked: true },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        item.checked
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-gray-800/30 border border-gray-700/30 text-gray-500'
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-gray-600 flex-shrink-0" />
                      )}
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passo: Empresa */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">3. Vincular Empresa</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>Selecione o <strong className="text-gray-200">Portfólio Empresarial</strong> (Business Manager) do parceiro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bullet n={2} />
                    <span>A empresa deve ter uma <strong className="text-gray-200">Página do Facebook</strong> vinculada</span>
                  </li>
                </ol>
                <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-300">
                    Se a empresa não tiver portfólio, crie em{' '}
                    <a href="https://business.facebook.com/overview" target="_blank" rel="noopener" className="underline">
                      business.facebook.com
                    </a>
                  </p>
                </div>
              </div>

              {/* Passo: Visão geral */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">4. Requisitos e Visão Geral</p>
                <ul className="space-y-1 text-xs text-gray-400 ml-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-500" /> Conta Instagram Business/Creator vinculada à Página</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-500" /> Portfólio empresarial configurado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-500" /> Administrador do app no Facebook Developers</li>
                </ul>
                <p className="text-xs text-gray-500">Após criar, clique em <strong className="text-gray-300">&quot;Criar aplicativo&quot;</strong>. Você será redirecionado ao Painel do app.</p>
              </div>
            </div>
          </StepWrapper>
        </TabsContent>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 2 — Credenciais do App Meta             */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="credentials">
          <StepWrapper step={STEPS[1]} index={1} done={completedSteps['credentials']} onToggle={() => toggleStep('credentials')}>
            <div className="space-y-5">
              {/* Tutorial: onde encontrar */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">Onde encontrar App ID e App Secret:</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>
                      Acesse{' '}
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener"
                        className="text-primary-400 hover:text-primary-300 underline inline-flex items-center gap-1">
                        developers.facebook.com/apps <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      e selecione o app
                    </span>
                  </li>
                  <li className="ml-7">
                    <TutorialImage src="/images/tutorial/acessar-app.png" alt="Tela de apps" label="Ver tela de apps" />
                  </li>
                  <li className="flex items-start gap-2">
                    <Bullet n={2} />
                    <span>
                      <strong className="text-gray-300">Configurações do app {'>'} Básico</strong> → copie{' '}
                      <strong className="text-gray-200">ID do Aplicativo</strong> e clique{' '}
                      <strong className="text-gray-200">&quot;Mostrar&quot;</strong> na Chave Secreta
                    </span>
                  </li>
                  <li className="ml-7">
                    <TutorialImage src="/images/tutorial/id-do-app.png" alt="ID e Secret do app" label="Ver onde copiar ID e Secret" />
                  </li>
                </ol>
              </div>

              {/* Form: App ID + Secret */}
              <div className="space-y-4 p-4 rounded-lg bg-brand-surface border border-brand-border">
                <div className="flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-gray-200">Credenciais do App</span>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Hash className="w-3.5 h-3.5 text-gray-500" />
                    Facebook App ID
                  </Label>
                  <Input
                    placeholder="Ex: 1267221968950424"
                    value={metaAppId}
                    onChange={(e) => onMetaAppIdChange(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500">Configurações do app {'>'} Básico {'>'} Identificação do aplicativo</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    App Secret (Chave Secreta)
                  </Label>
                  <div className="relative">
                    <Input
                      type={showAppSecret ? 'text' : 'password'}
                      placeholder="Cole a Chave Secreta do App"
                      value={metaAppSecret}
                      onChange={(e) => onMetaAppSecretChange(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={onToggleShowAppSecret}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">Configurações do app {'>'} Básico {'>'} Chave Secreta {'>'} Mostrar</p>
                </div>

                <Button className="gap-2" disabled={savingApp} onClick={onSaveAppCredentials}>
                  {savingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar credenciais do App
                </Button>
              </div>
            </div>
          </StepWrapper>
        </TabsContent>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 3 — Configuração e Permissões           */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="config_permissions">
          <StepWrapper step={STEPS[2]} index={2} done={completedSteps['config_permissions']} onToggle={() => toggleStep('config_permissions')}>
            <div className="space-y-5">

              {/* Passo 0: Liberar domínio e URI de redirecionamento */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-red-400">0. Configurar domínio e URI de redirecionamento (obrigatório)</p>

                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <p className="text-xs text-blue-300">
                    <strong>Importante:</strong> o domínio e a URI de redirecionamento são sempre do <strong>Soma.ai</strong> ({SOMA_DOMAIN}), não do site do parceiro.
                    Cada empresa cria seu app no Facebook Developers, mas o redirecionamento aponta para a plataforma Soma.ai.
                    <strong> Não é necessário que cada cliente tenha um domínio próprio.</strong>
                  </p>
                </div>

                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 space-y-1">
                  <p className="text-xs text-red-300">
                    Sem este passo, ao clicar em &quot;Conectar&quot; aparecerá o erro <strong>&quot;URL bloqueada&quot;</strong>.
                  </p>
                </div>

                {/* Passo 0a: Domínio do aplicativo */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-200">0.1 — Adicionar domínio do aplicativo</p>
                  <ol className="space-y-2 text-sm text-gray-400 ml-1">
                    <li className="flex items-start gap-2">
                      <Bullet n={1} />
                      <span>No app, vá em <strong className="text-gray-200">Configurações do app {'>'} Básico</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bullet n={2} />
                      <span>
                        No campo <strong className="text-gray-200">&quot;Domínios do aplicativo&quot;</strong>, adicione o domínio do Soma.ai:
                      </span>
                    </li>
                  </ol>
                  <code className="block ml-7 px-3 py-2 rounded bg-gray-900 text-primary-300 text-xs select-all">
                    {SOMA_DOMAIN}
                  </code>
                  <p className="ml-7 text-[10px] text-gray-500">
                    Se já tiver outros domínios (ex: juntix.com.br), mantenha-os. O campo aceita múltiplos domínios.
                  </p>
                  <div className="ml-7">
                    <TutorialImage src="/images/tutorial/dominio_app.png" alt="Configurações do app - Básico - Domínios do aplicativo" label="Ver onde adicionar domínio" />
                  </div>
                </div>

                {/* Passo 0b: URI de redirecionamento */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-200">0.2 — Adicionar URI de redirecionamento OAuth</p>
                  <ol className="space-y-2 text-sm text-gray-400 ml-1">
                    <li className="flex items-start gap-2">
                      <Bullet n={1} />
                      <span>
                        No menu lateral, vá em <strong className="text-gray-200">Login do Facebook para ... {'>'} Configurações</strong> (primeira opção)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bullet n={2} />
                      <span>Ative <strong className="text-gray-200">&quot;Login no OAuth do cliente&quot;</strong> e <strong className="text-gray-200">&quot;Login do OAuth na Web&quot;</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bullet n={3} />
                      <span>
                        No campo <strong className="text-gray-200">&quot;URIs de redirecionamento do OAuth válidos&quot;</strong>, adicione a URL abaixo e pressione Enter:
                      </span>
                    </li>
                  </ol>
                  <code className="block ml-7 px-3 py-2 rounded bg-gray-900 text-primary-300 text-xs select-all">
                    {SOMA_REDIRECT_URI}
                  </code>
                  <div className="ml-7 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-300">
                      O Facebook aceita <strong>múltiplas URIs</strong> de redirecionamento. Se já tiver outras (ex: do Juntix), mantenha-as. Basta digitar a nova URI e pressionar Enter para adicionar.
                    </p>
                  </div>
                  <div className="ml-7">
                    <TutorialImage src="/images/tutorial/uri_direcionamento.png" alt="Login do Facebook - URIs de redirecionamento do OAuth válidos" label="Ver onde adicionar URI de redirecionamento" />
                  </div>
                </div>
              </div>

              {/* Passo 1: Acessar configurações */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">1. Acessar Login do Facebook para Empresas</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>No menu lateral do app, acesse <strong className="text-gray-200">Login do Facebook para ...</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bullet n={2} />
                    <span>Clique na segunda opção: <strong className="text-gray-200">Configurações</strong></span>
                  </li>
                </ol>
                <TutorialImage src="/images/tutorial/config.png" alt="Tela de configurações do Login do Facebook" label="Ver tela de configurações" />
              </div>

              {/* Passo 2: Criar configuração */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">2. Criar configuração</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>Clique em <strong className="text-gray-200">&quot;Criar configuração&quot;</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Bullet n={2} />
                    <span>
                      <strong className="text-gray-200">Nome:</strong>{' '}
                      <code className="px-1.5 py-0.5 rounded bg-gray-800 text-primary-300 text-xs">integracao_instagram</code>
                    </span>
                  </li>
                </ol>
              </div>

              {/* Passo 3: Token de acesso */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">3. Token de Acesso</p>
                <ol className="space-y-2 text-sm text-gray-400 ml-1">
                  <li className="flex items-start gap-2">
                    <Bullet n={1} />
                    <span>Na etapa <strong className="text-gray-200">&quot;Token de acesso&quot;</strong>, selecione:</span>
                  </li>
                </ol>
                <div className="ml-7 space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span><strong>Token de acesso do usuário do sistema</strong></span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Expiração: <strong>Nunca</strong></span>
                  </div>
                </div>
                <TutorialImage src="/images/tutorial/token.png" alt="Configuração de token - usuário do sistema, nunca expira" label="Ver configuração de token" />
              </div>

              {/* Passo 4: Ativos */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">4. Escolher Ativos</p>
                <p className="text-xs text-gray-500">Marque todos os ativos disponíveis:</p>
                <div className="ml-1 space-y-2">
                  {[
                    { name: 'Páginas', required: true },
                    { name: 'Contas de anúncios', required: true },
                    { name: 'Contas do Instagram', required: true },
                    { name: 'Catálogos', required: false },
                    { name: 'Pixels', required: false },
                  ].map((asset) => (
                    <div
                      key={asset.name}
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        asset.required
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-gray-800/30 border border-gray-700/30 text-gray-400'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${asset.required ? 'text-emerald-400' : 'text-gray-500'}`} />
                      <span>{asset.name}</span>
                      {asset.required && <Badge variant="success" className="text-[9px] ml-auto">Obrigatório</Badge>}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">Em <strong className="text-gray-300">Select Asset Task Permissions</strong>, marque:</p>
                <div className="ml-1 grid grid-cols-3 gap-2">
                  {['ADVERTISE', 'ANALYZE', 'MANAGE'].map((perm) => (
                    <div key={perm} className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono">{perm}</span>
                    </div>
                  ))}
                </div>

                <TutorialImage src="/images/tutorial/ativos.png" alt="Escolher ativos - marque páginas, contas de anúncios, contas do Instagram" label="Ver seleção de ativos" />
                <TutorialImage src="/images/tutorial/ativos_permissoes.png" alt="Asset Task Permissions - ADVERTISE, ANALYZE, MANAGE" label="Ver permissões dos ativos" />
              </div>

              {/* Passo 5: Permissões */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-200">5. Permissões</p>
                <p className="text-xs text-gray-500">Marque <strong className="text-gray-300">todas as permissões disponíveis</strong> (posteriormente poderá ajustar):</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'instagram_basic', desc: 'Ler mídia e perfil' },
                    { name: 'instagram_content_publish', desc: 'Publicar fotos e vídeos' },
                    { name: 'instagram_manage_comments', desc: 'Gerenciar comentários' },
                    { name: 'instagram_manage_insights', desc: 'Métricas e analytics' },
                    { name: 'pages_show_list', desc: 'Listar páginas' },
                    { name: 'pages_read_engagement', desc: 'Ler engajamento' },
                    { name: 'pages_manage_posts', desc: 'Gerenciar publicações' },
                    { name: 'business_management', desc: 'Gerenciador de Negócios' },
                    { name: 'ads_management', desc: 'Gerenciar anúncios' },
                    { name: 'ads_read', desc: 'Ler informações de anúncios' },
                    { name: 'catalog_management', desc: 'Gerenciar catálogos' },
                    { name: 'instagram_branded_content_creator', desc: 'Conteúdo patrocinado' },
                  ].map((perm) => (
                    <div key={perm.name} className="flex items-start gap-2 p-2 rounded bg-gray-800/50 border border-gray-700/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <code className="text-xs text-primary-300">{perm.name}</code>
                        <p className="text-[10px] text-gray-500">{perm.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StepWrapper>
        </TabsContent>

        {/* ════════════════════════════════════════════ */}
        {/* TAB 4 — Conectar                            */}
        {/* ════════════════════════════════════════════ */}
        <TabsContent value="connect">
          <StepWrapper step={STEPS[3]} index={3} done={completedSteps['connect']} onToggle={() => toggleStep('connect')}>
            <div className="space-y-4">
              <ol className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Bullet n={1} />
                  <span>Certifique-se de ter salvo as <strong className="text-gray-200">credenciais do App</strong> (Aba 2)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bullet n={2} />
                  <span>Clique no botão <strong className="text-emerald-300">&quot;Conectar com Facebook/Instagram&quot;</strong> no card acima</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bullet n={3} />
                  <span>Faça login no Facebook e autorize o app</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bullet n={4} />
                  <span>O sistema obtém automaticamente:</span>
                </li>
              </ol>
              <div className="ml-7 grid grid-cols-1 gap-2">
                {[
                  'Token da página (nunca expira)',
                  'Instagram Business Account ID',
                  '@username do Instagram',
                  'Facebook Page ID e nome da página',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-300">
                  Após conectar, o status muda para &quot;Conectado / Ativo&quot; e os dados da conta aparecem no card acima.
                </p>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  Se aparecer &quot;URL bloqueada&quot;, adicione a URL de redirecionamento nas configurações do app:{' '}
                  <code className="px-1 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">
                    {SOMA_REDIRECT_URI}
                  </code>
                </p>
              </div>
            </div>
          </StepWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────── */

function Bullet({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">
      {n}
    </span>
  )
}

function StepWrapper({
  step,
  index,
  done,
  onToggle,
  children,
}: {
  step: Step
  index: number
  done: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg border p-4 space-y-4 ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-brand-surface border-brand-border'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500/20' : 'bg-gray-800'}`}>
            {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-xs font-semibold text-gray-400">{index + 1}</span>}
          </div>
          <h4 className={`text-sm font-semibold ${done ? 'text-emerald-300 line-through' : 'text-gray-100'}`}>
            {step.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{done ? 'Concluído' : 'Pendente'}</span>
          <Switch checked={done} onCheckedChange={onToggle} />
        </div>
      </div>
      {children}
    </div>
  )
}
