'use client'

import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

export function IdeiaDialog({ w }: { w: CriarWizardApi }) {
  if (!w.showIdeiaDialog) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Descreva sua ideia
            </div>
            <p className="text-xs text-gray-500">
              Conte sobre o que voce quer criar
            </p>
          </div>
          <button
            type="button"
            onClick={() => w.setShowIdeiaDialog(false)}
            className="text-gray-400 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={w.ideiaTemp}
          onChange={(e) => w.setIdeiaTemp(e.target.value)}
          rows={5}
          placeholder="Ex: Quero divulgar uma promoção de Dipirona 500mg com 30% de desconto esta semana. O foco é transmitir alívio rápido e confiança, e engajar o público com uma pergunta no final."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:italic placeholder:text-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <div className="mt-3 rounded-lg bg-purple-50/60 p-3 text-xs text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
          <Sparkles className="mr-1 inline h-3 w-3" />
          Nossa IA vai transformar sua ideia em um conteudo completo e
          profissional!
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => w.setShowIdeiaDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              w.setIdeia(w.ideiaTemp)
              w.setShowIdeiaDialog(false)
            }}
            disabled={!w.ideiaTemp.trim()}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
