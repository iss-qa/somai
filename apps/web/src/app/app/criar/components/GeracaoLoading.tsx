'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const ETAPAS = [
  {
    titulo: 'Analisando sua marca',
    descricao: 'Coletando identidade, paleta e tom de voz para personalizar a peça',
  },
  {
    titulo: 'Refinando o conceito visual',
    descricao: 'Combinando briefing, objetivo e abordagem em uma direção criativa',
  },
  {
    titulo: 'Gerando imagem com IA',
    descricao: 'Renderizando composição, tipografia e elementos com qualidade premium',
  },
  {
    titulo: 'Finalizando sua peça',
    descricao: 'Otimizando resolução e preparando o editor para você refinar',
  },
]

export function GeracaoLoading({ visible }: { visible: boolean }) {
  const [etapa, setEtapa] = useState(0)
  const [progresso, setProgresso] = useState(0)

  useEffect(() => {
    if (!visible) {
      setEtapa(0)
      setProgresso(0)
      return
    }
    const tick = setInterval(() => {
      setProgresso((p) => {
        if (p >= 95) return p
        return p + Math.random() * 1.5
      })
    }, 250)
    const stepTick = setInterval(() => {
      setEtapa((s) => Math.min(ETAPAS.length - 1, s + 1))
    }, 4000)
    return () => {
      clearInterval(tick)
      clearInterval(stepTick)
    }
  }, [visible])

  if (!visible) return null

  const atual = ETAPAS[etapa]

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 px-6 dark:from-purple-950/40 dark:via-gray-950 dark:to-pink-950/40">
      <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Gerando conteúdo...
      </div>

      <div className="relative mt-12 flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-purple-300/30 [animation-duration:2s]" />
        <div className="absolute inset-4 animate-pulse rounded-full bg-purple-400/40" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-2xl shadow-purple-500/40">
          <Mascote />
        </div>
      </div>

      <div className="mt-12 max-w-md text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {atual.titulo}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {atual.descricao}
        </p>
      </div>

      <div className="mt-8 w-full max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${Math.min(95, progresso)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>
            Etapa {etapa + 1} de {ETAPAS.length}
          </span>
          <span>Pode levar até 30s</span>
        </div>
      </div>
    </div>
  )
}

function Mascote() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-20 w-20 animate-[bounce_1.6s_ease-in-out_infinite]"
      aria-hidden
    >
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="105" rx="28" ry="4" fill="rgba(0,0,0,0.15)" />
      <path
        d="M30 60 Q30 25 60 25 Q90 25 90 60 L90 80 Q90 100 60 100 Q30 100 30 80 Z"
        fill="url(#bodyGrad)"
      />
      <path
        d="M58 18 L65 8 L72 22 Z"
        fill="#22d3ee"
        stroke="#0e7490"
        strokeWidth="1"
      />
      <circle cx="50" cy="55" r="8" fill="white" />
      <circle cx="70" cy="55" r="8" fill="white" />
      <circle cx="51" cy="56" r="4" fill="#1e1b4b" />
      <circle cx="71" cy="56" r="4" fill="#1e1b4b" />
      <circle cx="52" cy="55" r="1.4" fill="white" />
      <circle cx="72" cy="55" r="1.4" fill="white" />
      <path
        d="M50 70 Q60 80 70 70"
        stroke="#1e1b4b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="78" cy="68" r="3" fill="#34d399" opacity="0.85" />
    </svg>
  )
}
