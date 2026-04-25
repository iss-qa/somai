'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  Headphones,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Message {
  _id: string
  author_type: 'user' | 'support'
  author_name: string
  content: string
  created_at: string
}

interface TicketDetail {
  _id: string
  subject: string
  category: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  messages: Message[]
  createdAt: string
  last_message_at: string
  resolved_at?: string | null
}

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

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const res = await api.get<{ ticket: TicketDetail }>(
        `/api/support/tickets/${params.id}`,
      )
      setTicket(res.ticket)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao carregar ticket')
      router.push('/app/suporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages.length])

  const send = async () => {
    if (!reply.trim() || !ticket) return
    setSending(true)
    try {
      const res = await api.post<{ ticket: TicketDetail }>(
        `/api/support/tickets/${ticket._id}/messages`,
        { content: reply.trim() },
      )
      setTicket(res.ticket)
      setReply('')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  const changeStatus = async (status: TicketStatus) => {
    if (!ticket) return
    setChangingStatus(true)
    try {
      const res = await api.patch<{ ticket: TicketDetail }>(
        `/api/support/tickets/${ticket._id}/status`,
        { status },
      )
      setTicket(res.ticket)
      toast.success(
        status === 'closed' ? 'Ticket fechado' : 'Status atualizado',
      )
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar status')
    } finally {
      setChangingStatus(false)
    }
  }

  if (loading || !ticket) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[ticket.status]
  const canReply = ticket.status !== 'closed'
  const canClose = ticket.status !== 'closed'

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/suporte"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Suporte
      </Link>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {ticket.subject}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="capitalize">{ticket.category}</span>
                <span>·</span>
                <span>
                  Aberto em{' '}
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {ticket.messages.map((m) => {
            const isUser = m.author_type === 'user'
            return (
              <div
                key={m._id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                    isUser
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Headphones className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-purple-50 text-gray-900 dark:bg-purple-950/40 dark:text-gray-100'
                      : 'bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="font-medium">{m.author_name}</span>
                    <span>
                      {new Date(m.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {canReply ? (
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={3}
              placeholder="Escreva sua resposta... (Ctrl/Cmd+Enter para enviar)"
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {ticket.status === 'resolved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeStatus('open')}
                    disabled={changingStatus}
                  >
                    Reabrir
                  </Button>
                )}
                {canClose && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeStatus('closed')}
                    disabled={changingStatus}
                    className="text-gray-600"
                  >
                    {changingStatus ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <X className="mr-2 h-3 w-3" />
                    )}
                    Fechar ticket
                  </Button>
                )}
              </div>
              <Button
                onClick={send}
                disabled={sending || !reply.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
            <CheckCircle2 className="h-4 w-4" />
            Este ticket está fechado. Abra um novo ticket se precisar de mais ajuda.
          </div>
        )}
      </div>
    </div>
  )
}
