'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Trash2,
  User,
  Mail,
  Briefcase,
  Building2,
  Instagram,
  Globe,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface CompanyProfile {
  name?: string
  logo_url?: string
  niche?: string
  instagramHandle?: string
  website?: string
  marca?: { descricao?: string }
  compartilhaComunidade?: boolean
}

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [niche, setNiche] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [compartilha, setCompartilha] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false)
      return
    }
    let cancelled = false
    api
      .get<CompanyProfile>(`/api/companies/${user.companyId}`)
      .then((c) => {
        if (cancelled) return
        setName(c.name || user?.companyName || user?.name || '')
        setLogoUrl(c.logo_url || user?.logo_url || '')
        setNiche(c.niche || '')
        setBio(c.marca?.descricao || '')
        setInstagram(c.instagramHandle || '')
        setWebsite(c.website || '')
        setCompartilha(c.compartilhaComunidade !== false)
      })
      .catch((err: any) => {
        if (cancelled) return
        // Fallback suave: usa dados do authStore ao invés de quebrar a tela
        setName(user?.companyName || user?.name || '')
        setLogoUrl(user?.logo_url || '')
        console.warn('[perfil] falha ao carregar company:', err?.message || err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.companyId, user?.name, user?.companyName, user?.logo_url])

  const initials = (name || user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleFilePick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.companyId) return
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Imagem muito grande (máx 5MB)')
    }
    setUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await api.post<{ logo_url: string }>(
        `/api/companies/${user.companyId}/logo`,
        { dataUrl },
      )
      setLogoUrl(res.logo_url)
      if (user) setUser({ ...user, logo_url: res.logo_url })
      toast.success('Foto atualizada')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    if (!user?.companyId) return
    setUploading(true)
    try {
      await api.put(`/api/companies/${user.companyId}`, { logo_url: '' })
      setLogoUrl('')
      if (user) setUser({ ...user, logo_url: '' })
      toast.success('Foto removida')
    } catch {
      toast.error('Erro ao remover foto')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.companyId) return
    if (!name.trim()) return toast.error('Nome é obrigatório')
    setSaving(true)
    try {
      await api.put(`/api/companies/${user.companyId}`, {
        name: name.trim(),
        niche: niche.trim(),
        instagramHandle: instagram.replace(/^@/, '').trim(),
        website: website.trim(),
        'marca.nome': name.trim(),
        'marca.descricao': bio.trim(),
        compartilhaComunidade: compartilha,
      })
      if (user) setUser({ ...user, name: name.trim(), companyName: name.trim() })
      toast.success('Perfil atualizado')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meu Perfil
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie as informações da sua marca
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 border-b border-gray-100 pb-5 dark:border-gray-800">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-purple-100 dark:ring-purple-900/40">
              {logoUrl ? <AvatarImage src={logoUrl} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-xl text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFilePick}
              disabled={uploading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Alterar foto
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleRemoveLogo}
                disabled={uploading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-4 pt-5">
          <Field
            icon={<User className="h-4 w-4" />}
            label="Nome / Marca"
            required
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Divas Semijoias"
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4" />} label="E-mail">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
              <span className="flex-1 truncate">{user?.email}</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                verificado
              </span>
            </div>
          </Field>

          <Field
            label="Bio"
            hint={`${bio.length}/160`}
          >
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              rows={3}
              placeholder="Conte um pouco sobre sua marca..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field icon={<Briefcase className="h-4 w-4" />} label="Nicho / Segmento">
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex: Moda e Acessórios"
              />
            </Field>

            <Field icon={<Building2 className="h-4 w-4" />} label="Empresa">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Soma.ai"
              />
            </Field>

            <Field icon={<Instagram className="h-4 w-4" />} label="Instagram">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  @
                </span>
                <Input
                  value={instagram.replace(/^@/, '')}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="seu_usuario"
                  className="pl-7"
                />
              </div>
            </Field>

            <Field icon={<Globe className="h-4 w-4" />} label="Website">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://seusite.com"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
          <div className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Privacidade
          </div>
          <label className="flex cursor-pointer items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-900 dark:text-white">
                Compartilhar criações na comunidade
              </div>
              <p className="text-xs text-gray-500">
                Suas criações podem aparecer em inspirações públicas para outros usuários.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompartilha((v) => !v)}
              className={`relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                compartilha ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
              aria-pressed={compartilha}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  compartilha ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-center border-t border-gray-200 bg-white/80 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="min-w-[240px] bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}

function Field({
  icon,
  label,
  required,
  hint,
  children,
}: {
  icon?: React.ReactNode
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
          {icon && <span className="text-gray-500">{icon}</span>}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
