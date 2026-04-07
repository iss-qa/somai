'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/api/auth/login', { email, password })
      setUser(data.user)

      // Garante que o cookie é setado no browser (fallback caso Set-Cookie do servidor falhe)
      if (data.token) {
        document.cookie = `soma-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`
      }

      toast.success('Login realizado com sucesso!')

      const isAdmin = data.user.role === 'superadmin' || data.user.role === 'support'
      router.push(isAdmin ? '/admin/dashboard' : '/app/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slideIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Soma.ai
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Marketing automatizado com IA
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Entrar na sua conta</h2>
            <p className="text-sm text-gray-400 mt-1">
              Acesse o painel para gerenciar seu marketing
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Esqueceu a senha?{' '}
              <button className="text-primary-400 hover:text-primary-300 transition-colors">
                Recuperar acesso
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Soma.ai - Plataforma de marketing automatizado
        </p>
      </div>
    </div>
  )
}
