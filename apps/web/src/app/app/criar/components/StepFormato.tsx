'use client'

import toast from 'react-hot-toast'
import { Sparkles, Instagram, Facebook } from 'lucide-react'
import { Footer, FormatoCard, Header } from './WizardChrome'
import { WhatsAppIcon } from './WhatsAppIcon'
import { FORMATOS } from '../types'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

export function StepFormato({ w }: { w: CriarWizardApi }) {
  return (
    <div className="mt-6 md:mt-10">
      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        Você está escolhendo o formato de uma imagem que será gerada do zero
        pela IA.
      </div>
      <Header
        titulo="Escolha o Formato da Imagem"
        subtitulo="Agora escolha o formato da arte que será criada do zero pela IA."
      />

      <div className="mt-6 flex items-center justify-center gap-2">
        {(
          [
            { key: 'todos', label: 'Todos', icon: null },
            { key: 'instagram', label: 'Instagram', icon: Instagram },
            { key: 'facebook', label: 'Facebook', icon: Facebook },
            { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
          ] as const
        ).map((tab) => {
          const TabIcon = tab.icon
          const ativo = w.filtroPlataforma === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => w.setFiltroPlataforma(tab.key)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                ativo
                  ? 'border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {TabIcon && <TabIcon className="h-3.5 w-3.5" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {FORMATOS.filter(
          (f) =>
            w.filtroPlataforma === 'todos' || f.plataforma === w.filtroPlataforma,
        ).map((f) => (
          <FormatoCard
            key={f.key}
            formato={f}
            selected={w.formato === f.key}
            onClick={() => w.setFormato(f.key)}
          />
        ))}
      </div>

      <Footer
        onVoltar={() => w.setStep('modo')}
        onContinuar={() => {
          if (!w.formato) return toast.error('Escolha um formato')
          w.setStep('briefing')
        }}
        continuarDisabled={!w.formato}
      />
    </div>
  )
}
