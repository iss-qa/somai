'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LifeBuoy,
  MessageCircle,
  Mail,
  BookOpen,
  Youtube,
  HelpCircle,
  ExternalLink,
  Plus,
  Loader2,
  Inbox,
  CreditCard,
  Bug,
  Sparkles,
  UserCog,
  CircleHelp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const WHATSAPP_NUM = '5541999999999'
const SUPPORT_EMAIL = 'suporte@soma.ai'

type Category = 'billing' | 'bug' | 'feature' | 'account' | 'outros'
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Ticket {
  _id: string
  subject: string
  category: Category
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  last_message_at: string
  last_message_by: 'user' | 'support'
  createdAt: string
}

const CATEGORIAS: { key: Category; label: string; icon: any }[] = [
  { key: 'billing', label: 'Cobrança', icon: CreditCard },
  { key: 'bug', label: 'Bug / Erro', icon: Bug },
  { key: 'feature', label: 'Sugestão', icon: Sparkles },
  { key: 'account', label: 'Conta', icon: UserCog },
  { key: 'outros', label: 'Outros', icon: CircleHelp },
]

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: 'Aberto',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  in_progress: {
    label: 'Em andamento',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  resolved: {
    label: 'Resolvido',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  closed: {
    label: 'Fechado',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
}

const FAQ = [
  {
    q: 'Como os créditos são consumidos?',
    a: 'Cada geração de post estático custa 15 créditos. Refinar prompt é gratuito nos 3 primeiros refinamentos e 1 crédito nos subsequentes.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. O plano pode ser cancelado na tela de Minha Assinatura. Você mantém o acesso até o fim do período já pago.',
  },
  {
    q: 'Os créditos expiram?',
    a: 'Créditos do plano renovam mensalmente. Créditos extras (recargas e bônus) nunca expiram.',
  },
  {
    q: 'Como agendar publicações?',
    a: 'Disponível nos planos Pro e Enterprise. Após gerar um card, use o botão "Agendar" para escolher data e hora.',
  },
]

export default function SuportePage() {
  const user = useAuthStore((s) => s.user)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const waMessage = encodeURIComponent(
    `Olá! Sou ${user?.name || 'usuário da Soma.ai'} e preciso de ajuda com:`,
  )
  const mailSubject = encodeURIComponent('Suporte Soma.ai')
  const mailBody = encodeURIComponent(
    `Olá,\n\nSou ${user?.name || ''} (${user?.email || ''}) e gostaria de ajuda com:\n\n`,
  )

  const fetchTickets = async () => {
    try {
      const res = await api.get<{ tickets: Ticket[] }>('/api/support/tickets')
      setTickets(res.tickets || [])
    } catch {
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoadingTickets(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    fetchTickets()
  }, [user?.id])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Suporte
            </h1>
            <p className="text-sm text-gray-500">
              Nosso time está pronto para ajudar você
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo ticket
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ChannelCard
          href={`https://wa.me/${WHATSAPP_NUM}?text=${waMessage}`}
          icon={<MessageCircle className="h-5 w-5" />}
          title="WhatsApp"
          subtitle="Resposta em minutos · seg-sex 9h-18h"
          badge="Mais rápido"
          gradient="from-emerald-500 to-green-500"
          external
        />
        <ChannelCard
          href={`mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          icon={<Mail className="h-5 w-5" />}
          title="E-mail"
          subtitle={SUPPORT_EMAIL}
          gradient="from-purple-500 to-pink-500"
          external
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Meus tickets
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            {tickets.length} total
          </span>
        </div>

        {loadingTickets ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-gray-500">Nenhum ticket aberto.</p>
            <p className="mt-1 text-xs text-gray-400">
              Abra um ticket quando precisar de ajuda — respondemos em até 24h.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tickets.map((t) => {
              const CategoriaIcon =
                CATEGORIAS.find((c) => c.key === t.category)?.icon || CircleHelp
              const status = STATUS_CONFIG[t.status]
              return (
                <Link
                  key={t._id}
                  href={`/app/suporte/${t._id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    <CategoriaIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {t.subject}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Atualizado em{' '}
                      {new Date(t.last_message_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {t.last_message_by === 'support' && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          Nova resposta
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <HelpCircle className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Perguntas Frequentes
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {FAQ.map((item, i) => (
            <details key={i} className="group px-5 py-3">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-gray-900 dark:text-white">
                {item.q}
                <span className="text-gray-400 transition group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ResourceCard
          href="https://soma.ai/docs"
          icon={<BookOpen className="h-5 w-5" />}
          title="Documentação"
          subtitle="Guias, tutoriais e referências"
        />
        <ResourceCard
          href="https://youtube.com/@somaai"
          icon={<Youtube className="h-5 w-5" />}
          title="Canal no YouTube"
          subtitle="Vídeos rápidos para dominar a plataforma"
        />
      </div>

      {showNew && (
        <NewTicketDialog
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            setLoadingTickets(true)
            fetchTickets()
          }}
        />
      )}
    </div>
  )
}

function NewTicketDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<Category>('outros')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Preencha assunto e mensagem')
      return
    }
    setSaving(true)
    try {
      await api.post('/api/support/tickets', {
        subject: subject.trim(),
        category,
        priority,
        content: content.trim(),
      })
      toast.success('Ticket aberto')
      onCreated()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao abrir ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Abrir ticket
            </div>
            <p className="text-xs text-gray-500">
              Nosso time responde em até 24 horas úteis
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Categoria
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIAS.map((c) => {
                const Icon = c.icon
                const ativo = category === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] transition ${
                      ativo
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                        : 'border-gray-200 text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Assunto *
            </label>
            <Input
              value={subject}
              maxLength={200}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva em uma frase"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Prioridade
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    priority === p
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Mensagem *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Descreva com o máximo de detalhes. Inclua passos para reproduzir se for um bug."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Abrir ticket
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChannelCard({
  href,
  icon,
  title,
  subtitle,
  badge,
  gradient,
  external,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  badge?: string
  gradient: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group relative flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white">
          {title}
        </div>
        <p className="truncate text-xs text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
      <ExternalLink className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400 transition group-hover:text-purple-600" />
    </a>
  )
}

function ResourceCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-purple-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </div>
        <p className="truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <ExternalLink className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
    </a>
  )
}
