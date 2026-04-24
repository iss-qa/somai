'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Settings,
  Users,
  Key,
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSelfSetup: () => void
  onSetupDelegated?: () => void
  initialStep?: 'checklist' | 'method' | 'schedule' | 'credentials'
}

type Step = 'checklist' | 'method' | 'schedule' | 'credentials'

const HORARIOS = ['09h', '10h', '11h', '14h', '15h', '16h', '17h']

function getNextBusinessDays(count: number): Date[] {
  const days: Date[] = []
  const d = new Date()
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(new Date(d))
    }
  }
  return days
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function formatDateISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function maskPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 2) return nums
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

export default function SetupModal({ open, onClose, onSelfSetup, onSetupDelegated, initialStep = 'checklist' }: Props) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState<Step>(initialStep)

  // Step 1 checklist
  const [checks, setChecks] = useState({ facebook: false, igPro: false, igLinked: false })
  const allChecked = checks.facebook && checks.igPro && checks.igLinked

  // Step 3A - schedule
  const businessDays = getNextBusinessDays(7)
  const [schedNome, setSchedNome] = useState(user?.name || '')
  const [schedWpp, setSchedWpp] = useState('')
  const [schedDate, setSchedDate] = useState('')
  const [schedHour, setSchedHour] = useState('')
  const [schedObs, setSchedObs] = useState('')
  const [schedLoading, setSchedLoading] = useState(false)
  const [schedDone, setSchedDone] = useState(false)

  // Step 3B - credentials
  const [credNome, setCredNome] = useState('')
  const [credEmail, setCredEmail] = useState('')
  const [credSenha, setCredSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [credPlataformas, setCredPlataformas] = useState<string[]>([])
  const [credObs, setCredObs] = useState('')
  const [bannerAceito, setBannerAceito] = useState(false)
  const [credLoading, setCredLoading] = useState(false)
  const [credDone, setCredDone] = useState(false)

  function markConfigured() {
    if (user) {
      setUser({ ...user, integracaoConfigurada: true })
    }
  }

  async function handleSelfSetup() {
    try {
      await api.post('/api/setup/self-setup', {})
    } catch {}
    markConfigured()
    onSelfSetup()
  }

  async function handleSchedule() {
    if (!schedNome || !schedWpp || !schedDate || !schedHour) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSchedLoading(true)
    try {
      await api.post('/api/setup/agendamento', {
        nome: schedNome,
        whatsapp: schedWpp,
        data_preferida: schedDate,
        horario_preferido: schedHour,
        observacoes: schedObs,
      })
      markConfigured()
      setSchedDone(true)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao agendar. Tente novamente.')
    } finally {
      setSchedLoading(false)
    }
  }

  async function handleCredentials() {
    if (!credNome || !credEmail || !credSenha || !credPlataformas.length) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setCredLoading(true)
    try {
      await api.post('/api/setup/credenciais', {
        nome_conta: credNome,
        email: credEmail,
        senha: credSenha,
        plataformas: credPlataformas,
        observacoes: credObs,
      })
      markConfigured()
      setCredDone(true)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar credenciais. Tente novamente.')
    } finally {
      setCredLoading(false)
    }
  }

  function togglePlataforma(p: string) {
    setCredPlataformas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg w-full p-0 gap-0 bg-[#0d0d1a] border border-white/10 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ── Step 1: Checklist ─────────────────────── */}
        {step === 'checklist' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Antes de integrar, confirme:</h2>
              <p className="text-gray-400 text-sm mt-1">Marque cada item antes de continuar</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'facebook', label: 'Tenho uma Página criada no Facebook' },
                { key: 'igPro', label: 'Meu Instagram está como conta Comercial ou Criador' },
                { key: 'igLinked', label: 'Meu Instagram está vinculado à minha Página do Facebook' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <Checkbox
                    checked={checks[key as keyof typeof checks]}
                    onCheckedChange={(v) => setChecks((c) => ({ ...c, [key]: !!v }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-200">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="/guia-setup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm hover:bg-white/[0.05] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Não sei como fazer
              </a>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!allChecked}
                onClick={() => setStep('method')}
              >
                Tudo pronto, continuar →
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Choose method ─────────────────── */}
        {step === 'method' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Como prefere configurar?</h2>
              <p className="text-gray-400 text-sm mt-1">Escolha a opção mais conveniente para você</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSelfSetup}
                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">🔧 Integrar eu mesmo</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Você conecta suas redes direto no painel. Rápido, seguro, feito em minutos.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('schedule')}
                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">📅 Agendar com o time Soma.ai</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Nossa equipe faz uma reunião de setup com você. Guiamos cada passo em tempo real.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('credentials')}
                className="w-full text-left p-4 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Key className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">🔑 Delegar para o time Soma.ai</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Você fornece os dados de acesso e a gente configura tudo. Prazo: até 24 horas úteis.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep('checklist')}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        )}

        {/* ── Step 3A: Schedule ─────────────────────── */}
        {step === 'schedule' && !schedDone && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Agendar reunião de setup</h2>
              <p className="text-gray-400 text-sm mt-1">Preencha os dados e nossa equipe confirmará o horário</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Nome completo *</Label>
                <Input
                  value={schedNome}
                  onChange={(e) => setSchedNome(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">WhatsApp *</Label>
                <Input
                  value={schedWpp}
                  onChange={(e) => setSchedWpp(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Data preferida *</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {businessDays.map((d) => (
                    <button
                      key={formatDateISO(d)}
                      onClick={() => setSchedDate(formatDateISO(d))}
                      className={`text-xs px-2 py-2 rounded-lg border transition-colors text-center ${
                        schedDate === formatDateISO(d)
                          ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                          : 'border-white/10 text-gray-400 hover:border-white/25'
                      }`}
                    >
                      {formatDate(d)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Horário preferido *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HORARIOS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setSchedHour(h)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        schedHour === h
                          ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                          : 'border-white/10 text-gray-400 hover:border-white/25'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Observações (opcional)</Label>
                <textarea
                  value={schedObs}
                  onChange={(e) => setSchedObs(e.target.value)}
                  placeholder="Alguma informação adicional..."
                  rows={2}
                  className="w-full rounded-lg bg-white/[0.05] border border-white/10 text-gray-200 text-sm px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('method')}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                ← Voltar
              </button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleSchedule}
                disabled={schedLoading}
              >
                {schedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar agendamento'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3A Done ──────────────────────────── */}
        {step === 'schedule' && schedDone && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Agendamento solicitado!</h2>
              <p className="text-gray-400 text-sm mt-1">
                Nossa equipe entrará em contato pelo WhatsApp para confirmar o horário.
                Você receberá uma mensagem assim que o setup for iniciado.
              </p>
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => { onSetupDelegated?.(); onClose() }}>
              Entendido
            </Button>
          </div>
        )}

        {/* ── Step 3B: Credentials ─────────────────── */}
        {step === 'credentials' && !credDone && (
          <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-white">Fornecer dados de acesso</h2>
              <p className="text-gray-400 text-sm mt-1">Nossa equipe configurará tudo em até 24 horas úteis</p>
            </div>

            {/* Security banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/80 space-y-1">
                <p className="font-medium text-amber-300">Seus dados ficam protegidos</p>
                <p>
                  Seus dados são armazenados de forma criptografada (AES-256) e usados exclusivamente
                  para a configuração inicial. O time Soma.ai assina acordo de confidencialidade.
                  Você pode revogar o acesso a qualquer momento após o setup.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <Checkbox
                    checked={bannerAceito}
                    onCheckedChange={(v) => setBannerAceito(!!v)}
                  />
                  <span className="text-amber-300">Li e concordo com os termos acima</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Nome da conta / rede social *</Label>
                <Input
                  value={credNome}
                  onChange={(e) => setCredNome(e.target.value)}
                  placeholder="@minhaempresa"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">E-mail de acesso *</Label>
                <Input
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Senha *</Label>
                <div className="relative">
                  <Input
                    type={showSenha ? 'text' : 'password'}
                    value={credSenha}
                    onChange={(e) => setCredSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Plataforma(s) *</Label>
                <div className="flex gap-2">
                  {['facebook', 'instagram'].map((p) => (
                    <label
                      key={p}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        credPlataformas.includes(p)
                          ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                          : 'border-white/10 text-gray-400 hover:border-white/25'
                      }`}
                    >
                      <Checkbox
                        checked={credPlataformas.includes(p)}
                        onCheckedChange={() => togglePlataforma(p)}
                      />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Observações adicionais (opcional)</Label>
                <textarea
                  value={credObs}
                  onChange={(e) => setCredObs(e.target.value)}
                  placeholder="Alguma informação adicional..."
                  rows={2}
                  className="w-full rounded-lg bg-white/[0.05] border border-white/10 text-gray-200 text-sm px-3 py-2 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('method')}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                ← Voltar
              </button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleCredentials}
                disabled={credLoading || !bannerAceito}
              >
                {credLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar dados'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3B Done ──────────────────────────── */}
        {step === 'credentials' && credDone && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dados recebidos!</h2>
              <p className="text-gray-400 text-sm mt-1">
                O time Soma.ai iniciará o setup em até 24 horas úteis. Você receberá uma mensagem quando começarmos.
              </p>
            </div>
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => { onSetupDelegated?.(); onClose() }}>
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
