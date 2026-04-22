'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { api } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Ban,
  Unlock,
  Bell,
  Pencil,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  QrCode,
  Receipt,
  RefreshCw,
  ExternalLink,
  Copy,
  Repeat,
  Trash2,
  Clock,
  MessageCircle,
  FileText,
} from 'lucide-react'

interface CompanyPlan {
  _id: string
  slug: string
  name: string
  monthly_price: number
  setup_price: number
}

interface CompanyBilling {
  monthly_amount: number
  due_day: number
  last_paid_at: string | null
  next_due_at: string | null
  overdue_days: number
  status: string
}

interface CompanyData {
  _id: string
  name: string
  slug: string
  niche: string
  city: string
  state: string
  responsible_name: string
  document: string
  whatsapp: string
  email: string
  logo_url: string
  brand_colors: { primary: string; secondary: string }
  plan_id: CompanyPlan | null
  status: string
  access_enabled: boolean
  setup_paid: boolean
  setup_paid_at: string | null
  setup_amount: number
  billing: CompanyBilling
  trial_days: number
  trial_expires_at: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  async function loadCompany() {
    try {
      const data = await api.get<CompanyData>(`/api/companies/${params.id}`)
      setCompany(data)
    } catch {
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCompany() }, [params.id])

  async function handleBlock() {
    if (!company) return
    setActing(true)
    try {
      await api.post(`/api/companies/${company._id}/block`)
      toast.success('Empresa bloqueada')
      loadCompany()
    } catch { toast.error('Erro ao bloquear') }
    finally { setActing(false) }
  }

  async function handleUnblock() {
    if (!company) return
    setActing(true)
    try {
      await api.post(`/api/companies/${company._id}/unblock`)
      toast.success('Empresa desbloqueada')
      loadCompany()
    } catch { toast.error('Erro ao desbloquear') }
    finally { setActing(false) }
  }

  // ── Release (bypass setup + mensalidade) ──────
  const [releaseOpen, setReleaseOpen] = useState(false)

  async function handleRelease() {
    if (!company) return
    setActing(true)
    try {
      await api.post(`/api/companies/${company._id}/release`)
      toast.success('Acesso liberado!')
      setReleaseOpen(false)
      loadCompany()
    } catch { toast.error('Erro ao liberar acesso') }
    finally { setActing(false) }
  }

  // ── Edit modal ────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [editSaving, setEditSaving] = useState(false)
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    if (company) {
      setEditData({
        name: company.name,
        responsible_name: company.responsible_name,
        document: company.document || '',
        whatsapp: company.whatsapp,
        email: company.email,
        niche: company.niche,
        city: company.city,
        state: company.state,
        status: company.status,
        plan_slug: company.plan_id?.slug || 'starter',
        plan_id: company.plan_id?._id || '',
        setup_amount: company.setup_amount || company.plan_id?.setup_price || 0,
        monthly_amount: company.billing?.monthly_amount || 0,
        due_day: company.billing?.due_day || 10,
        trial_days: company.trial_days || 3,
        notes: company.notes || '',
      })
    }
  }, [company])

  // Plans — try to load from API, fallback to constants
  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await api.get<any[]>('/api/companies/plans')
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data)
          return
        }
      } catch { /* fallback */ }
      setPlans([
        { _id: '', slug: 'starter', name: 'Starter', setup_price: 297, monthly_price: 39.90 },
        { _id: '', slug: 'pro', name: 'Pro', setup_price: 497, monthly_price: 69.90 },
        { _id: '', slug: 'enterprise', name: 'Enterprise', setup_price: 720, monthly_price: 89.90 },
      ])
    }
    loadPlans()
  }, [])

  async function handleSaveEdit() {
    if (!company) return
    setEditSaving(true)
    try {
      // Find the real plan_id from slug
      const selectedPlan = plans.find((p) => p.slug === editData.plan_slug)

      const update: Record<string, any> = {
        name: editData.name,
        responsible_name: editData.responsible_name,
        document: editData.document,
        whatsapp: editData.whatsapp,
        email: editData.email,
        niche: editData.niche,
        city: editData.city,
        state: editData.state,
        status: editData.status,
        setup_amount: editData.setup_amount,
        trial_days: editData.trial_days,
        notes: editData.notes,
        billing: {
          monthly_amount: selectedPlan?.monthly_price ?? editData.monthly_amount ?? 0,
          due_day: editData.due_day,
          status: company.billing?.status || 'pending',
          last_paid_at: company.billing?.last_paid_at || null,
          next_due_at: company.billing?.next_due_at || null,
          overdue_days: company.billing?.overdue_days || 0,
          setup_charge_id: (company.billing as any)?.setup_charge_id || '',
          subscription_id: (company.billing as any)?.subscription_id || '',
        },
      }
      if (selectedPlan?._id) {
        update.plan_id = selectedPlan._id
      }
      await api.put(`/api/companies/${company._id}`, update)
      toast.success('Empresa atualizada!')
      setEditOpen(false)
      loadCompany()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setEditSaving(false)
    }
  }

  function updateEdit(key: string, value: any) {
    setEditData((prev) => ({ ...prev, [key]: value }))
  }

  function onPlanChange(slug: string) {
    const plan = plans.find((p) => p.slug === slug)
    if (plan) {
      setEditData((prev) => ({
        ...prev,
        plan_slug: slug,
        plan_id: plan._id,
        setup_amount: plan.setup_price,
        monthly_amount: plan.monthly_price,
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-300 mb-4">Empresa não encontrada</h3>
        <Button variant="outline" onClick={() => router.push('/admin/companies')}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  const planName = company.plan_id?.name || 'Sem plano'
  const planSlug = company.plan_id?.slug || 'starter'
  const billingStatus = company.billing?.status || 'pending'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/companies')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">{company.name}</h2>
              <StatusBadge status={company.status} />
            </div>
            <p className="text-sm text-gray-400">{company.niche} — {company.city}/{company.state}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          {company.status === 'blocked' ? (
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleUnblock} disabled={acting}>
              <Unlock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desbloquear</span>
            </Button>
          ) : (
            <Button variant="destructive" size="sm" className="gap-2" onClick={handleBlock} disabled={acting}>
              <Ban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear</span>
            </Button>
          )}
          {company.status !== 'active' && (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setReleaseOpen(true)}
              disabled={acting}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liberar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Company info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary-400" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="Responsável" value={company.responsible_name} />
            {company.document && <InfoRow icon={FileText} label="CPF/CNPJ" value={company.document} />}
            <InfoRow icon={Phone} label="WhatsApp" value={company.whatsapp} />
            <InfoRow icon={Mail} label="Email" value={company.email} />
            <InfoRow icon={MapPin} label="Cidade" value={`${company.city}/${company.state}`} />
            <InfoRow icon={Calendar} label="Cadastro" value={new Date(company.createdAt).toLocaleDateString('pt-BR')} />
          </CardContent>
        </Card>

        {/* Plan & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4 text-primary-400" />
              Plano e Cobrança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Plano</span>
              <Badge variant={planSlug === 'pro' ? 'default' : 'secondary'}>
                {planName}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Mensalidade</span>
              <span className="text-sm font-medium text-gray-200">
                {formatCurrency(company.billing?.monthly_amount ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Setup</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-300">{formatCurrency(company.setup_amount)}</span>
                {company.setup_paid && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Dia cobrança</span>
              <span className="text-sm text-gray-200">Dia {company.billing?.due_day || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Situação</span>
              <StatusBadge status={billingStatus} />
            </div>
            {(company.billing?.overdue_days || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Atraso</span>
                <span className="text-sm font-medium text-red-400">
                  {company.billing.overdue_days} dias
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary-400" />
              Acesso e Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Acesso</span>
              {company.access_enabled ? (
                <Badge variant="success">Liberado</Badge>
              ) : (
                <Badge variant="destructive">Bloqueado</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <StatusBadge status={company.status} />
            </div>
            {/* Trial countdown */}
            {company.trial_expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Trial</span>
                <AdminTrialBadge expiresAt={company.trial_expires_at} days={company.trial_days} />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Slug</span>
              <code className="text-xs text-gray-400 bg-brand-surface px-2 py-0.5 rounded">
                {company.slug}
              </code>
            </div>
            {company.brand_colors && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Cores</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-brand-border"
                    style={{ backgroundColor: company.brand_colors.primary }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-brand-border"
                    style={{ backgroundColor: company.brand_colors.secondary }}
                  />
                </div>
              </div>
            )}
            {company.notes && (
              <div className="pt-2 border-t border-brand-border">
                <span className="text-xs text-gray-500">Observações</span>
                <p className="text-sm text-gray-300 mt-1">{company.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Billing / OpenPix ────────────────── */}
      <BillingSection companyId={company._id} company={company} onRefresh={loadCompany} />

      {/* ─── Edit Modal ──────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="!max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Row 1: Nome + Responsável */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Nome da empresa</Label>
                <Input value={editData.name || ''} onChange={(e) => updateEdit('name', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Responsável</Label>
                <Input value={editData.responsible_name || ''} onChange={(e) => updateEdit('responsible_name', e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Row 2: CPF/CNPJ + WhatsApp + Email */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-400">CPF/CNPJ</Label>
                <Input value={editData.document || ''} onChange={(e) => updateEdit('document', e.target.value)} placeholder="000.000.000-00" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">WhatsApp</Label>
                <Input value={editData.whatsapp || ''} onChange={(e) => updateEdit('whatsapp', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Email</Label>
                <Input value={editData.email || ''} onChange={(e) => updateEdit('email', e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Row 3: Cidade + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Cidade</Label>
                <Input value={editData.city || ''} onChange={(e) => updateEdit('city', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Estado (UF)</Label>
                <Input value={editData.state || ''} onChange={(e) => updateEdit('state', e.target.value)} placeholder="BA" maxLength={2} className="mt-1" />
              </div>
            </div>

            {/* Row 4: Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Status da empresa</Label>
                <Select value={editData.status || 'trial'} onValueChange={(v) => updateEdit('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="setup_pending">Setup Pendente</SelectItem>
                    <SelectItem value="pending_subscription">Aguardando Assinatura</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400">Nicho</Label>
                <Input value={editData.niche || ''} onChange={(e) => updateEdit('niche', e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Plano e Cobrança */}
            <div className="border-t border-brand-border pt-4">
              <p className="text-sm font-medium text-white mb-3">Plano e Cobrança</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">Plano</Label>
                  <Select value={editData.plan_slug || 'starter'} onValueChange={onPlanChange}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.slug} value={p.slug}>
                          {p.name} — {formatCurrency(p.monthly_price)}/mês
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Valor do Setup (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.setup_amount ?? ''}
                    onChange={(e) => updateEdit('setup_amount', Number(e.target.value))}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) updateEdit('setup_amount', parseFloat(v.toFixed(2)))
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Dia da cobrança</Label>
                  <Input type="number" value={editData.due_day || ''} onChange={(e) => updateEdit('due_day', Number(e.target.value))} min={1} max={27} className="mt-1" />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs text-gray-400">Trial gratuito</Label>
                <div className="flex gap-2 mt-1">
                  {[3, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateEdit('trial_days', d)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                        editData.trial_days === d
                          ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                          : 'border-brand-border text-gray-400 hover:border-gray-600',
                      )}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-400">Observações</Label>
              <Input value={editData.notes || ''} onChange={(e) => updateEdit('notes', e.target.value)} className="mt-1" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={editSaving}>
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Release Confirmation ────────────── */}
      <Dialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <DialogContent className="!max-w-md">
          <DialogHeader>
            <DialogTitle>Liberar acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-300">
              Tem certeza que deseja liberar o acesso a essa empresa{' '}
              <span className="font-semibold text-white">{company.name}</span>?
            </p>
            <p className="text-xs text-gray-500">
              A empresa terá acesso total liberado com bypass da cobrança de setup e da assinatura mensal.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReleaseOpen(false)}
                disabled={acting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleRelease}
                disabled={acting}
              >
                {acting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Confirmar liberação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Billing Section ────────────────────────────

function BillingSection({
  companyId,
  company,
  onRefresh,
}: {
  companyId: string
  company: CompanyData
  onRefresh: () => void
}) {
  const [setupLoading, setSetupLoading] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [setupCharge, setSetupCharge] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [showSubForm, setShowSubForm] = useState(false)
  const [subDay, setSubDay] = useState(company.billing?.due_day || 10)
  const [subValue, setSubValue] = useState(company.billing?.monthly_amount || 39.9)
  const [checkingSetup, setCheckingSetup] = useState(false)
  const [checkingSub, setCheckingSub] = useState(false)

  // Load existing charges on mount
  useEffect(() => {
    loadSetupStatus()
    loadSubscriptionStatus()
  }, [companyId])

  async function loadSetupStatus() {
    setCheckingSetup(true)
    try {
      const data = await api.get(`/api/billing/setup-charge/${companyId}`)
      if (data.charge) setSetupCharge(data.charge)
    } catch { /* ignore */ }
    finally { setCheckingSetup(false) }
  }

  async function loadSubscriptionStatus() {
    setCheckingSub(true)
    try {
      const data = await api.get(`/api/billing/subscription/${companyId}`)
      if (data.subscription) setSubscription(data.subscription)
    } catch { /* ignore */ }
    finally { setCheckingSub(false) }
  }

  async function handleCreateSetupCharge() {
    setSetupLoading(true)
    try {
      const data = await api.post('/api/billing/setup-charge', {
        company_id: companyId,
      })
      // Merge top-level fields (brCode, qrCodeImage, paymentLinkUrl) into charge object
      // because OpenPix returns brCode at the response root, not always inside charge
      setSetupCharge({
        ...data.charge,
        brCode: data.brCode || data.charge?.brCode,
        qrCodeImage: data.qrCodeImage || data.charge?.qrCodeImage,
        paymentLinkUrl: data.paymentLinkUrl || data.charge?.paymentLinkUrl,
        value: data.charge?.value ?? (data.value ? data.value * 100 : undefined),
      })
      toast.success('Cobrança PIX de setup gerada!')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar cobrança')
    } finally {
      setSetupLoading(false)
    }
  }

  async function handleCreateSubscription() {
    setSubLoading(true)
    try {
      const data = await api.post('/api/billing/subscription', {
        company_id: companyId,
        value: Math.round(subValue * 100),
        day_generate_charge: subDay,
      })
      setSubscription(data.subscription)
      setShowSubForm(false)
      toast.success('Assinatura recorrente criada!')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar assinatura')
    } finally {
      setSubLoading(false)
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Tem certeza que deseja cancelar a assinatura?')) return
    setSubLoading(true)
    try {
      await api.delete(`/api/billing/subscription/${companyId}`)
      setSubscription(null)
      toast.success('Assinatura cancelada')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar')
    } finally {
      setSubLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* ── Setup Fee (one-time) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="w-4 h-4 text-primary-400" />
            Cobrança de Setup (PIX)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingSetup ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </div>
          ) : setupCharge ? (
            <div className="space-y-4">
              {/* Status banner */}
              {setupCharge.status === 'COMPLETED' ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-300">Pagamento confirmado!</p>
                    <p className="text-xs text-emerald-400/70">Setup pago via PIX</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-yellow-300">Aguardando pagamento</p>
                    <p className="text-xs text-yellow-400/70">Envie o QR Code ao cliente</p>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {setupCharge.qrCodeImage && setupCharge.status !== 'COMPLETED' && (
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <img src={setupCharge.qrCodeImage} alt="QR Code PIX" className="w-52 h-52" />
                </div>
              )}

              {/* Info rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <Badge variant={setupCharge.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {setupCharge.status === 'COMPLETED' ? 'Pago' : 'Aguardando'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Valor</span>
                  <span className="text-sm font-bold text-white">{formatCurrency((setupCharge.value || 0) / 100)}</span>
                </div>
                {setupCharge.identifier && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Identificador</span>
                    <code className="text-xs text-gray-500">{setupCharge.identifier}</code>
                  </div>
                )}
                {setupCharge.correlationID && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Correlation ID</span>
                    <code className="text-xs text-gray-500">{setupCharge.correlationID.slice(0, 20)}...</code>
                  </div>
                )}
              </div>

              {/* PIX Copia e Cola */}
              {setupCharge.brCode && setupCharge.status !== 'COMPLETED' && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium">PIX Copia e Cola</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs text-gray-400 bg-brand-surface p-2.5 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">{setupCharge.brCode}</code>
                    <Button size="icon" variant="outline" className="flex-shrink-0 h-9 w-9" onClick={() => copyToClipboard(setupCharge.brCode)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {setupCharge.status !== 'COMPLETED' && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Copy QR Code link */}
                  {setupCharge.qrCodeImage && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyToClipboard(setupCharge.qrCodeImage)}>
                      <QrCode className="w-3.5 h-3.5" />
                      Copiar QR Code
                    </Button>
                  )}

                  {/* Payment link */}
                  {setupCharge.paymentLinkUrl && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                      <a href={setupCharge.paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Link pagamento
                      </a>
                    </Button>
                  )}

                  {/* Share via WhatsApp */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs col-span-2 text-green-400 border-green-500/30 hover:bg-green-500/10"
                    onClick={() => {
                      const phone = company.whatsapp?.replace(/\D/g, '') || ''
                      const text = encodeURIComponent(
                        `Ola ${company.responsible_name}! Segue o link para pagamento do setup do Soma.ai:\n\n` +
                        `Valor: R$ ${((setupCharge.value || 0) / 100).toFixed(2).replace('.', ',')}\n` +
                        `Link: ${setupCharge.paymentLinkUrl || ''}\n\n` +
                        `Ou copie o codigo PIX:\n${setupCharge.brCode || ''}`
                      )
                      window.open(`https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${text}`, '_blank')
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              )}

              {/* Refresh */}
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={async () => { await loadSetupStatus(); onRefresh() }}>
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar status
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Gere uma cobrança PIX única para a taxa de setup da empresa.
              </p>
              <div className="p-3 rounded-lg bg-brand-surface border border-brand-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Plano</span>
                  <span className="text-sm text-white">{company.plan_id?.name || 'Starter'}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-400">Valor setup</span>
                  <span className="text-lg font-bold text-primary-400">
                    {formatCurrency(company.plan_id?.setup_price || company.setup_amount || 297)}
                  </span>
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handleCreateSetupCharge} disabled={setupLoading}>
                {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Gerar PIX de Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Subscription (recurring) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="w-4 h-4 text-primary-400" />
            Assinatura Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingSub ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </div>
          ) : subscription ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Assinatura ativa</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Valor mensal</span>
                    <span className="text-white font-medium">{formatCurrency((subscription.value || 0) / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Dia da cobrança</span>
                    <span className="text-white">Dia {subscription.dayGenerateCharge || '-'}</span>
                  </div>
                  {subscription.customer && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cliente</span>
                      <span className="text-white">{subscription.customer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ID</span>
                    <code className="text-xs text-gray-500">{subscription.globalID?.slice(0, 20)}...</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={loadSubscriptionStatus}>
                  <RefreshCw className="w-3 h-3" />
                  Atualizar
                </Button>
                <Button variant="destructive" size="sm" className="flex-1 gap-1.5" onClick={handleCancelSubscription} disabled={subLoading}>
                  <Trash2 className="w-3 h-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Ativar assinatura recorrente</p>
                  <p className="text-xs text-gray-500">Cobrança PIX automática todo mês</p>
                </div>
                <Switch checked={showSubForm} onCheckedChange={setShowSubForm} />
              </div>

              {showSubForm && (
                <div className="space-y-3 p-3 rounded-lg bg-brand-surface border border-brand-border animate-form-fade-in">
                  <div>
                    <Label className="text-gray-400 text-xs">Valor mensal (R$)</Label>
                    <Input type="number" value={subValue} onChange={(e) => setSubValue(Number(e.target.value))} min={1} step={0.01} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">Dia da cobrança (1-27)</Label>
                    <Input type="number" value={subDay} onChange={(e) => setSubDay(Number(e.target.value))} min={1} max={27} className="mt-1" />
                  </div>
                  <Button className="w-full gap-2" onClick={handleCreateSubscription} disabled={subLoading}>
                    {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                    Criar Assinatura
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminTrialBadge({ expiresAt, days }: { expiresAt: string; days: number }) {
  const [text, setText] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function update() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setText('Expirado')
        setExpired(true)
        return
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24))
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      setText(d > 0 ? `${d}d ${h}h restantes` : `${h}h restantes`)
      setExpired(false)
    }
    update()
    const i = setInterval(update, 60000)
    return () => clearInterval(i)
  }, [expiresAt])

  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', expired ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/15 text-yellow-400')}>
      {days} dias — {text}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-200 truncate">{value}</span>
    </div>
  )
}
