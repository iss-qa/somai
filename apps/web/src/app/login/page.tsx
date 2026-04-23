'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Loader2,
  Sparkles,
  ArrowRight,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  BarChart3,
  Calendar,
  Instagram,
  MessageCircle,
  FileText,
  LocateFixed,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────

/** Formata telefone: (71) 99999-9999 */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function unformatPhone(value: string): string {
  return value.replace(/\D/g, '')
}

// ─── Types ──────────────────────────────────────

type Panel = 'login' | 'signup' | 'recovery' | 'recovery-verify'

const NICHES = [
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'pet', label: 'Pet Shop' },
  { value: 'moda', label: 'Moda' },
  { value: 'cosmeticos', label: 'Cosméticos' },
  { value: 'mercearia', label: 'Mercearia' },
  { value: 'calcados', label: 'Calçados' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'confeitaria', label: 'Confeitaria e Doceria' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'suplementos', label: 'Suplementos e Vida Saudável' },
  { value: 'estetica', label: 'Clínica de Estética' },
  { value: 'odontologia', label: 'Odontologia' },
  { value: 'academia', label: 'Academia e Fitness' },
  { value: 'salao_beleza', label: 'Salão de Beleza' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'imobiliaria', label: 'Imobiliária' },
  { value: 'educacao', label: 'Educação e Cursos' },
  { value: 'arquitetura', label: 'Arquitetura e Interiores' },
  { value: 'contabilidade', label: 'Contabilidade' },
  { value: 'viagens', label: 'Turismo e Viagens' },
  { value: 'eletronicos', label: 'Eletrônicos e Celulares' },
  { value: 'decoracao', label: 'Móveis e Decoração' },
  { value: 'papelaria', label: 'Papelaria e Presentes' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'construcao', label: 'Material de Construção' },
  { value: 'igreja', label: 'Igreja e Ministério' },
  { value: 'advocacia', label: 'Advocacia' },
  { value: 'saude', label: 'Saúde e Bem-estar' },
  { value: 'tecnologia', label: 'Tecnologia e Software' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'fotografia', label: 'Fotografia e Vídeo' },
  { value: 'joalheria', label: 'Joalheria e Relojoaria' },
  { value: 'floricultura', label: 'Floricultura' },
  { value: 'otica', label: 'Ótica' },
  { value: 'outro', label: 'Outro' },
];

const FEATURES = [
  { icon: Sparkles, text: 'Cards gerados por IA' },
  { icon: Instagram, text: 'Publicação automática' },
  { icon: Zap, text: 'Vídeos com inteligência artificial' },
  { icon: BarChart3, text: 'Campanhas no Meta Ads' },
  { icon: Calendar, text: 'Agendamento inteligente' },
  { icon: MessageCircle, text: 'Alertas via WhatsApp' },
]

const PLANS = [
  { value: 'starter', label: 'Starter', price: 'R$ 29,90/mes', setup: 'R$ 50' },
  { value: 'pro', label: 'Pro', price: 'R$ 50,00/mes', setup: 'R$ 100' },
  { value: 'enterprise', label: 'Enterprise', price: 'R$ 69,90/mes', setup: 'R$ 200' },
]

// ─── Component ──────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  // Panel
  const [panel, setPanel] = useState<Panel>('login')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Signup
  const [companyName, setCompanyName] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupDocument, setSignupDocument] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [niche, setNiche] = useState('')
  const [city, setCity] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [signupState, setSignupState] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  // Recovery
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [maskedWa, setMaskedWa] = useState('')

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Pré-seleciona painel/plano via query params (?signup=1&plan=pro)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('signup') === '1') setPanel('signup')
    const qsPlan = params.get('plan')
    if (qsPlan && ['starter', 'pro', 'enterprise'].includes(qsPlan)) {
      setSelectedPlan(qsPlan)
    }
  }, [])

  const switchPanel = useCallback((to: Panel) => {
    setPanel(to)
  }, [])

  async function detectCity() {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste navegador')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=pt`,
          )
          const data = await res.json()
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            ''
          const detectedState =
            data.address?.['ISO3166-2-lvl4']?.split('-').pop() ||
            data.address?.state_code ||
            ''
          if (detectedCity) setCity(detectedCity)
          if (detectedState) setSignupState(detectedState)
        } catch {
          toast.error('Não foi possível detectar a cidade')
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error('Permissão de localização negada')
        setLocating(false)
      },
      { timeout: 10000 },
    )
  }

  const isSignup = panel === 'signup'

  // ── Login ─────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Preencha todos os campos')
      return
    }
    setLoginLoading(true)
    try {
      const data = await api.post('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      })
      setUser(data.user)
      if (data.token) {
        document.cookie = `soma-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
      }
      toast.success('Bem-vindo de volta!')
      const isAdmin = data.user.role === 'superadmin' || data.user.role === 'support'
      router.push(isAdmin ? '/admin/dashboard' : '/app/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Signup ────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName || !responsibleName || !signupEmail || !whatsapp || !signupPassword) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    const cleanPhone = unformatPhone(whatsapp)
    if (cleanPhone.length < 10) {
      toast.error('Informe um número de WhatsApp válido')
      return
    }
    if (signupPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    setSignupLoading(true)
    try {
      const data = await api.post('/api/auth/partner-signup', {
        company_name: companyName,
        responsible_name: responsibleName,
        email: signupEmail,
        document: signupDocument,
        whatsapp: cleanPhone,
        password: signupPassword,
        niche: niche || 'outro',
        city,
        state: signupState,
        plan: selectedPlan,
        trial_days: 3,
      })
      setUser(data.user)
      if (data.token) {
        document.cookie = `soma-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
      }
      toast.success('Cadastro realizado! Bem-vindo ao Soma.AI!')
      router.push('/app/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar')
    } finally {
      setSignupLoading(false)
    }
  }

  // ── Recovery ──────────────────────────────────
  async function handleRecoveryRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!recoveryEmail) { toast.error('Informe seu e-mail'); return }
    setRecoveryLoading(true)
    try {
      const data = await api.post('/api/auth/recovery/request', { email: recoveryEmail })
      if (data.whatsapp_masked) setMaskedWa(data.whatsapp_masked)
      toast.success('Código enviado via WhatsApp!')
      switchPanel('recovery-verify')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao solicitar recuperação')
    } finally {
      setRecoveryLoading(false)
    }
  }

  async function handleRecoveryVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!recoveryCode || !newPassword) { toast.error('Preencha o código e a nova senha'); return }
    setRecoveryLoading(true)
    try {
      await api.post('/api/auth/recovery/verify', {
        email: recoveryEmail,
        code: recoveryCode,
        new_password: newPassword,
      })
      toast.success('Senha alterada! Faça login.')
      switchPanel('login')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar código')
    } finally {
      setRecoveryLoading(false)
    }
  }

  // ── Render ────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4 overflow-hidden">
      {/* Background */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-600/8 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary-500/6 rounded-full blur-[120px]" style={{ animationDelay: '2s', animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-700/4 rounded-full blur-[150px]" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
      )}

      {/* Main card */}
      <div className={cn(
        'relative z-10 w-full max-w-[960px] rounded-2xl overflow-hidden',
        'border border-brand-border shadow-2xl shadow-primary-500/5',
        'grid grid-cols-1 lg:grid-cols-2',
      )}>
        {/* ─── Brand panel ───────────────────── */}
        <div className={cn(
          'relative flex flex-col justify-between p-8 lg:p-10 min-h-[320px] lg:min-h-[620px] overflow-hidden',
          isSignup ? 'lg:order-2' : 'lg:order-1',
        )}>
          {/* Gradient bg */}
          <div className="absolute inset-0 transition-all duration-700" style={{
            background: isSignup
              ? 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 50%, #2e1065 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
          }} />
          {/* Decorative shapes */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-0 w-32 h-32 rounded-full bg-white/[0.03] translate-x-1/2" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Soma.AI</span>
            </div>

            <div key={`brand-${panel}`} className="animate-form-fade-in">
              {isSignup ? (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                    Já é parceiro?
                  </h2>
                  <p className="text-white/70 text-sm lg:text-base leading-relaxed mb-8">
                    Acesse seu painel para gerenciar postagens, vídeos e campanhas com inteligência artificial.
                  </p>
                  <button
                    onClick={() => switchPanel('login')}
                    className="group/cta relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] active:scale-[0.97]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/30 opacity-0 transition-all duration-500 group-hover/cta:left-[110%] group-hover/cta:opacity-100"
                    />
                    <span className="relative z-10">Fazer login</span>
                    <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                    Quero ser parceiro!
                  </h2>
                  <p className="text-white/70 text-sm lg:text-base leading-relaxed mb-8">
                    Marketing automático para pequenas empresas. Você atende, a Soma.AI cuida das redes com postagens automáticas.
                  </p>
                  <button
                    onClick={() => switchPanel('signup')}
                    className="group/cta relative inline-flex items-center gap-2 overflow-hidden rounded-xl border-2 border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] active:scale-[0.97]"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/30 opacity-0 transition-all duration-500 group-hover/cta:left-[110%] group-hover/cta:opacity-100"
                    />
                    <span className="relative z-10">Cadastrar empresa</span>
                    <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div key={`feat-${panel}`} className="relative z-10 hidden lg:block mt-6">
            <div className="space-y-2.5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="flex items-center gap-3 text-white/60 text-sm animate-form-fade-in" style={{ animationDelay: `${i * 80 + 200}ms` }}>
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{f.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ─── Form panel ────────────────────── */}
        <div className={cn(
          'bg-brand-card p-8 lg:p-10 flex flex-col justify-center',
          isSignup ? 'lg:order-1' : 'lg:order-2',
        )}>
          <div
            key={`form-${panel}`}
            className={cn(
              'max-w-sm mx-auto w-full',
              isSignup ? 'animate-panel-slide-left' : 'animate-panel-slide-right',
            )}
          >

            {/* ── LOGIN ──────────────────────── */}
            {panel === 'login' && (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">Entrar na sua conta</h3>
                  <p className="text-sm text-gray-400 mt-1">Acesse o painel para gerenciar seu marketing</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input id="le" type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" autoComplete="email" disabled={loginLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input id="lp" type={showLoginPw ? 'text' : 'password'} placeholder="Digite sua senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10" autoComplete="current-password" disabled={loginLoading} />
                      <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loginLoading}>
                    {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </form>
                <div className="mt-5 text-center">
                  <button onClick={() => switchPanel('recovery')} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                    Esqueceu a senha? <span className="text-primary-400">Recuperar acesso</span>
                  </button>
                </div>
                <div className="mt-3 text-center lg:hidden">
                  <button onClick={() => switchPanel('signup')} className="text-sm text-gray-500">
                    Não tem conta? <span className="text-primary-400 font-medium">Quero ser parceiro</span>
                  </button>
                </div>
              </>
            )}

            {/* ── SIGNUP ─────────────────────── */}
            {panel === 'signup' && (
              <>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white">Cadastre sua empresa</h3>
                  <p className="text-sm text-gray-400 mt-1">Comece a automatizar suas redes sociais</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="Nome da empresa *" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10" disabled={signupLoading} />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="Seu nome completo *" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} className="pl-10" disabled={signupLoading} />
                  </div>
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input type="email" placeholder="E-mail *" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" autoComplete="email" disabled={signupLoading} />
                  </div>
                  {/* Documento */}
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="CPF ou CNPJ" value={signupDocument} onChange={(e) => setSignupDocument(e.target.value)} className="pl-10" disabled={signupLoading} />
                  </div>
                  {/* Telefone + Senha — grid-cols-1 mobile, grid-cols-2 desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input placeholder="(71) 99999-9999 *" value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} className="pl-10" disabled={signupLoading} maxLength={15} />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input type={showSignupPw ? 'text' : 'password'} placeholder="Crie uma senha (mín. 6) *" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10" autoComplete="new-password" disabled={signupLoading} />
                      <button type="button" onClick={() => setShowSignupPw(!showSignupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Segmento + Cidade — grid-cols-1 mobile, grid-cols-2 desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={niche} onValueChange={setNiche} disabled={signupLoading}>
                      <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
                      <SelectContent>
                        {NICHES.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="pl-10 pr-10" disabled={signupLoading} />
                      <button
                        type="button"
                        onClick={detectCity}
                        disabled={locating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400 transition-colors p-1"
                        title="Detectar minha cidade"
                      >
                        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Plan selector — destaque */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-400 font-medium">Escolha seu plano — 3 dias grátis</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PLANS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setSelectedPlan(p.value)}
                          className={cn(
                            'py-3 px-2 rounded-xl border text-center transition-all relative',
                            selectedPlan === p.value
                              ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                              : 'border-brand-border hover:border-gray-600',
                          )}
                        >
                          {p.value === 'pro' && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-primary-500 text-white px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          <p className="text-sm font-bold text-white">{p.label}</p>
                          <p className="text-xs text-primary-400 font-semibold mt-0.5">{p.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3">
                    <Button type="submit" className="w-full h-11" disabled={signupLoading}>
                      {signupLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cadastrando...</> : <><Sparkles className="mr-2 h-4 w-4" />Começar grátis</>}
                    </Button>
                  </div>
                </form>
                <div className="mt-4 text-center lg:hidden">
                  <button onClick={() => switchPanel('login')} className="text-sm text-gray-500">
                    Já tem conta? <span className="text-primary-400 font-medium">Fazer login</span>
                  </button>
                </div>
              </>
            )}

            {/* ── RECOVERY REQUEST ───────────── */}
            {panel === 'recovery' && (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">Recuperar acesso</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Enviaremos um código de recuperação via <span className="text-green-400 font-medium">WhatsApp</span>
                  </p>
                </div>
                <form onSubmit={handleRecoveryRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Seu e-mail cadastrado</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input type="email" placeholder="seu@email.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className="pl-10" disabled={recoveryLoading} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-300">O código será enviado para o WhatsApp vinculado à sua empresa</p>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={recoveryLoading}>
                    {recoveryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar código via WhatsApp'}
                  </Button>
                </form>
                <div className="mt-5 text-center">
                  <button onClick={() => switchPanel('login')} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Voltar ao login</button>
                </div>
              </>
            )}

            {/* ── RECOVERY VERIFY ────────────── */}
            {panel === 'recovery-verify' && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Verificar código</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Insira o código de 6 dígitos enviado para{' '}
                    {maskedWa && <span className="text-white font-medium">{maskedWa}</span>}
                  </p>
                </div>
                <form onSubmit={handleRecoveryVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Código de recuperação</Label>
                    <Input placeholder="000000" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-[0.3em] font-mono" maxLength={6} disabled={recoveryLoading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10" disabled={recoveryLoading} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={recoveryLoading || recoveryCode.length < 6}>
                    {recoveryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Redefinir senha</>}
                  </Button>
                </form>
                <div className="mt-5 text-center">
                  <button onClick={() => switchPanel('recovery')} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Reenviar código</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-6 text-center text-sm text-white/80 font-medium tracking-wide">
        Soma.AI — Marketing automatizado com IA
      </p>
    </div>
  )
}
