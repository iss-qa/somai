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
  { value: 'outro', label: 'Outro' }
];

const FEATURES = [
  { icon: Sparkles, text: 'Cards gerados por IA' },
  { icon: Instagram, text: 'Publicacao automatica' },
  { icon: Zap, text: 'Videos com inteligencia artificial' },
  { icon: BarChart3, text: 'Campanhas no Meta Ads' },
  { icon: Calendar, text: 'Agendamento inteligente' },
  { icon: MessageCircle, text: 'Alertas via WhatsApp' },
]

const PLANS = [
  { value: 'starter', label: 'Starter', price: 'R$ 39,90/mes', setup: 'R$ 297' },
  { value: 'pro', label: 'Pro', price: 'R$ 69,90/mes', setup: 'R$ 497' },
  { value: 'enterprise', label: 'Enterprise', price: 'R$ 89,90/mes', setup: 'R$ 720' },
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
  const [whatsapp, setWhatsapp] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [showSignupPw, setShowSignupPw] = useState(false)
  const [niche, setNiche] = useState('')
  const [city, setCity] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('starter')
  const [signupLoading, setSignupLoading] = useState(false)

  // Recovery
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [maskedWa, setMaskedWa] = useState('')

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const switchPanel = useCallback((to: Panel) => {
    setPanel(to)
  }, [])

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
      toast.error(err.message || 'Credenciais invalidas')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Signup ────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName || !responsibleName || !signupEmail || !whatsapp || !signupPassword) {
      toast.error('Preencha todos os campos obrigatorios')
      return
    }
    const cleanPhone = unformatPhone(whatsapp)
    if (cleanPhone.length < 10) {
      toast.error('Informe um numero de WhatsApp valido')
      return
    }
    if (signupPassword.length < 6) {
      toast.error('Senha deve ter no minimo 6 caracteres')
      return
    }
    setSignupLoading(true)
    try {
      const data = await api.post('/api/auth/partner-signup', {
        company_name: companyName,
        responsible_name: responsibleName,
        email: signupEmail,
        whatsapp: cleanPhone,
        password: signupPassword,
        niche: niche || 'outro',
        city,
        state: '',
        plan: selectedPlan,
        trial_days: 3,
      })
      setUser(data.user)
      if (data.token) {
        document.cookie = `soma-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
      }
      toast.success('Cadastro realizado! Bem-vindo ao Soma.ai!')
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
    if (!recoveryEmail) { toast.error('Informe seu email'); return }
    setRecoveryLoading(true)
    try {
      const data = await api.post('/api/auth/recovery/request', { email: recoveryEmail })
      if (data.whatsapp_masked) setMaskedWa(data.whatsapp_masked)
      toast.success('Codigo enviado via WhatsApp!')
      switchPanel('recovery-verify')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao solicitar recuperacao')
    } finally {
      setRecoveryLoading(false)
    }
  }

  async function handleRecoveryVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!recoveryCode || !newPassword) { toast.error('Preencha o codigo e a nova senha'); return }
    setRecoveryLoading(true)
    try {
      await api.post('/api/auth/recovery/verify', {
        email: recoveryEmail,
        code: recoveryCode,
        new_password: newPassword,
      })
      toast.success('Senha alterada! Faca login.')
      switchPanel('login')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar codigo')
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
              <span className="text-xl font-bold text-white">Soma.ai</span>
            </div>

            <div key={`brand-${panel}`} className="animate-form-fade-in">
              {isSignup ? (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                    Ja e parceiro?
                  </h2>
                  <p className="text-white/70 text-sm lg:text-base leading-relaxed mb-8">
                    Acesse seu painel para gerenciar postagens, videos e campanhas com inteligencia artificial.
                  </p>
                  <button onClick={() => switchPanel('login')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-medium text-sm hover:bg-white/10 active:scale-[0.97] transition-all duration-300">
                    Fazer login
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                    Quero ser parceiro!
                  </h2>
                  <p className="text-white/70 text-sm lg:text-base leading-relaxed mb-8">
                    Marketing automatico para pequenas empresas. Voce atende, a Soma AI cuida das redes com postagens automaticas.
                  </p>
                  <button onClick={() => switchPanel('signup')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-medium text-sm hover:bg-white/10 active:scale-[0.97] transition-all duration-300">
                    Cadastrar empresa
                    <ArrowRight className="w-4 h-4" />
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
                    Nao tem conta? <span className="text-primary-400 font-medium">Quero ser parceiro</span>
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input type="email" placeholder="E-mail *" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" autoComplete="email" disabled={signupLoading} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input placeholder="(71) 99999-9999 *" value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} className="pl-10" disabled={signupLoading} maxLength={15} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input type={showSignupPw ? 'text' : 'password'} placeholder="Crie uma senha (min. 6) *" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10" autoComplete="new-password" disabled={signupLoading} />
                    <button type="button" onClick={() => setShowSignupPw(!showSignupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showSignupPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={niche} onValueChange={setNiche} disabled={signupLoading}>
                      <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
                      <SelectContent>
                        {NICHES.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} className="pl-10" disabled={signupLoading} />
                    </div>
                  </div>
                  {/* Plan selector */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-medium">Escolha seu plano — 3 dias gratis</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PLANS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setSelectedPlan(p.value)}
                          className={cn(
                            'p-2 rounded-lg border text-center transition-all',
                            selectedPlan === p.value
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-brand-border hover:border-gray-600',
                          )}
                        >
                          <p className="text-xs font-semibold text-white">{p.label}</p>
                          <p className="text-[10px] text-gray-500">{p.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 mt-1" disabled={signupLoading}>
                    {signupLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cadastrando...</> : <><Sparkles className="mr-2 h-4 w-4" />Comecar gratis</>}
                  </Button>
                </form>
                <div className="mt-4 text-center lg:hidden">
                  <button onClick={() => switchPanel('login')} className="text-sm text-gray-500">
                    Ja tem conta? <span className="text-primary-400 font-medium">Fazer login</span>
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
                    Enviaremos um codigo de recuperacao via <span className="text-green-400 font-medium">WhatsApp</span>
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
                    <p className="text-xs text-green-300">O codigo sera enviado para o WhatsApp vinculado a sua empresa</p>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={recoveryLoading}>
                    {recoveryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar codigo via WhatsApp'}
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
                  <h3 className="text-xl font-bold text-white">Verificar codigo</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Insira o codigo de 6 digitos enviado para{' '}
                    {maskedWa && <span className="text-white font-medium">{maskedWa}</span>}
                  </p>
                </div>
                <form onSubmit={handleRecoveryVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Codigo de recuperacao</Label>
                    <Input placeholder="000000" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl tracking-[0.3em] font-mono" maxLength={6} disabled={recoveryLoading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input type="password" placeholder="Minimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10" disabled={recoveryLoading} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={recoveryLoading || recoveryCode.length < 6}>
                    {recoveryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Redefinir senha</>}
                  </Button>
                </form>
                <div className="mt-5 text-center">
                  <button onClick={() => switchPanel('recovery')} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Reenviar codigo</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-6 text-center text-sm text-white/80 font-medium tracking-wide">
        Soma.ai — Marketing automatizado com IA
      </p>
    </div>
  )
}
