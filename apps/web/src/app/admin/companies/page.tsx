'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/admin/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Ban,
  Bell,
  Pencil,
  Loader2,
  Building2,
  MapPin,
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
  overdue_days: number
  status: 'paid' | 'pending' | 'overdue'
}

interface Company {
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
  status: 'active' | 'blocked' | 'setup_pending' | 'trial' | 'cancelled'
  access_enabled: boolean
  setup_paid: boolean
  setup_amount: number
  billing: CompanyBilling | null
  notes: string
  createdAt: string
  updatedAt: string
}

const planColors: Record<string, 'secondary' | 'default' | 'info'> = {
  starter: 'secondary',
  pro: 'default',
  enterprise: 'info',
}

export default function CompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await api.get<{ companies: Company[] }>('/api/companies')
        setCompanies(data.companies || [])
      } catch {
        setCompanies([])
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [])

  const filteredCompanies = companies.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Parceiros</h2>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie todas as empresas parceiras
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => router.push('/admin/companies/new')}
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="setup_pending">Setup pendente</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Empresa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Plano
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Cidade
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Setup
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Mensal
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Cobranca
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider p-4">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <tr
                      key={company._id}
                      className="hover:bg-brand-surface/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/companies/${company._id}`)}
                    >
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{company.name}</p>
                          <p className="text-xs text-gray-500">{company.niche}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {company.plan_id ? (
                          <Badge variant={planColors[company.plan_id.slug] || 'secondary'}>
                            {company.plan_id.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-600">Sem plano</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={company.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm text-gray-400">
                            {company.city ? `${company.city}/${company.state}` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={company.setup_paid ? 'paid' : 'pending'} />
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-300">
                          {formatCurrency(company.billing?.monthly_amount ?? 0)}
                        </span>
                      </td>
                      <td className="p-4">
                        {company.billing?.status ? (
                          <StatusBadge status={company.billing.status} />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/companies/${company._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Bell className="mr-2 h-4 w-4" />
                              Enviar notificacao
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 focus:text-red-300">
                              <Ban className="mr-2 h-4 w-4" />
                              Bloquear
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Nenhuma empresa encontrada</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Card
              key={company._id}
              className="cursor-pointer hover:border-gray-700 transition-colors"
              onClick={() => router.push(`/admin/companies/${company._id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-200">{company.name}</p>
                    <p className="text-xs text-gray-500">{company.niche}</p>
                  </div>
                  <StatusBadge status={company.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {company.plan_id ? (
                    <Badge variant={planColors[company.plan_id.slug] || 'secondary'} className="text-[10px]">
                      {company.plan_id.name}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-gray-600">Sem plano</span>
                  )}
                  <span>{formatCurrency(company.billing?.monthly_amount ?? 0)}/mes</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{company.city ? `${company.city}/${company.state}` : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma empresa encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
