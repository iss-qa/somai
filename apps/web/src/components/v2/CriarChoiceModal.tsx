'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, FileText, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export function CriarChoiceModal({ open, onClose }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const go = (path: string) => {
    onClose()
    router.push(path)
  }

  const content = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-black/30 dark:text-gray-400 dark:hover:bg-black/60 dark:hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Sparkles className="h-6 w-6 text-violet-500 dark:text-violet-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Como deseja criar seu card?
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Escolha um caminho para comecar
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Personalizar */}
          <button
            onClick={() => go('/app/cards/generate?mode=custom')}
            className="group space-y-3 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-purple-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-primary-500/60 dark:hover:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-purple-100 dark:bg-gray-800 dark:group-hover:bg-primary-500/20">
              <FileText className="h-5 w-5 text-gray-500 group-hover:text-purple-600 dark:text-gray-300 dark:group-hover:text-primary-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Personalizar
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                Comece com o formulario vazio e preencha manualmente cada
                campo.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 group-hover:text-purple-600 dark:group-hover:text-primary-300">
              Controle total
            </span>
          </button>

          {/* Gerar com IA */}
          <button
            onClick={() => go('/app/criar')}
            className="group relative space-y-3 overflow-hidden rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-5 text-left transition-all hover:border-violet-400 hover:from-violet-500/20 hover:to-purple-500/20"
          >
            <div className="absolute right-2 top-2 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-300">
              RECOMENDADO
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Gerar com IA
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                A IA cria titulos, textos, CTAs, cores e imagens coerentes com
                o seu nicho.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-300">
              Rapido e automatico
            </span>
          </button>
        </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
