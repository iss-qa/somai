'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Save,
  Loader2,
} from 'lucide-react'

const plans = [
  { value: 'starter', label: 'Starter', price: 'R$ 197/mes' },
  { value: 'pro', label: 'Pro', price: 'R$ 397/mes' },
  { value: 'enterprise', label: 'Enterprise', price: 'R$ 697/mes' },
]

const niches = [
  'Restaurante',
  'Loja de roupas',
  'Barbearia',
  'Clinica',
  'Academia',
  'Pet Shop',
  'Imobiliaria',
  'Advogado',
  'Dentista',
  'Outro',
]

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export default function NewCompanyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    niche: '',
    city: '',
    state: '',
    responsible: '',
    whatsapp: '',
    email: '',
    plan: 'starter',
    setupPaid: false,
    billingDay: '10',
    notes: '',
  })

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && typeof value === 'string'
        ? {
            slug: value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          }
        : {}),
    }))
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.plan) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSaving(true)
    try {
      await api.post('/api/companies', form)
      toast.success('Empresa criada com sucesso!')
      router.push('/admin/companies')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar empresa')
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = plans.find((p) => p.value === form.plan)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/companies')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-white">Nova Empresa</h2>
          <p className="text-sm text-gray-400">Cadastre um novo parceiro</p>
        </div>
      </div>

      {/* Company details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-primary-400" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da empresa *</Label>
              <Input
                placeholder="Ex: Pizzaria do Joao"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                placeholder="pizzaria-do-joao"
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Select value={form.niche} onValueChange={(v) => updateForm('niche', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map((n) => (
                    <SelectItem key={n} value={n.toLowerCase()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="Sao Paulo"
                  value={form.city}
                  onChange={(e) => updateForm('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.state} onValueChange={(v) => updateForm('state', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsavel</Label>
              <Input
                placeholder="Nome do responsavel"
                value={form.responsible}
                onChange={(e) => updateForm('responsible', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                placeholder="11999999999"
                value={form.whatsapp}
                onChange={(e) => updateForm('whatsapp', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input
              type="email"
              placeholder="empresa@email.com"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4 text-primary-400" />
            Plano e Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan selection */}
          <div className="space-y-2">
            <Label>Plano</Label>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.value}
                  onClick={() => updateForm('plan', plan.value)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    form.plan === plan.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-brand-border bg-brand-surface hover:border-gray-700'
                  }`}
                >
                  <p className={`font-medium ${form.plan === plan.value ? 'text-primary-300' : 'text-gray-300'}`}>
                    {plan.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{plan.price}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-surface border border-brand-border">
              <div>
                <p className="text-sm text-gray-300">Setup pago</p>
                <p className="text-xs text-gray-500">R$ 297 de implantacao</p>
              </div>
              <Switch
                checked={form.setupPaid}
                onCheckedChange={(v) => updateForm('setupPaid', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia de cobranca</Label>
              <Select value={form.billingDay} onValueChange={(v) => updateForm('billingDay', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25].map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-gray-800 bg-brand-surface px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none"
              placeholder="Anotacoes sobre o parceiro..."
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/admin/companies')}>
          Cancelar
        </Button>
        <Button className="gap-2" disabled={saving} onClick={handleSave}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar empresa
        </Button>
      </div>
    </div>
  )
}
