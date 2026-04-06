'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
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
} from 'lucide-react'

interface CompanyPlan {
  _id: string
  slug: string
  name: string
  monthly_price: number
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
        <h3 className="text-lg font-medium text-gray-300 mb-4">Empresa nao encontrada</h3>
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
          <Button variant="outline" size="sm" className="gap-2">
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
        </div>
      </div>

      {/* Info grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Company info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4 text-primary-400" />
              Informacoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="Responsavel" value={company.responsible_name} />
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
              Plano e Cobranca
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
                {company.setup_paid ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Dia cobranca</span>
              <span className="text-sm text-gray-200">Dia {company.billing?.due_day || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Situacao</span>
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
                <span className="text-xs text-gray-500">Observacoes</span>
                <p className="text-sm text-gray-300 mt-1">{company.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
