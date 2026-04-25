'use client'

import { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Instagram,
  Facebook,
  Heart,
  DollarSign,
  Smartphone,
  Layers,
  Lightbulb,
  X,
  Maximize2,
  ImagePlus,
  Coins,
  PenLine,
  Eye,
  FileText,
} from 'lucide-react'
import { Footer, Header, ResumoCardRich } from './WizardChrome'
import { CUSTO_SLIDE } from '../types'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

function PromptPreview({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // **Header:** → purple bold
        const headerMatch = line.match(/^\*\*(.+?)\*\*(.*)$/)
        if (headerMatch) {
          return (
            <p key={i}>
              <span className="font-semibold text-purple-700 dark:text-purple-400">
                {headerMatch[1]}
              </span>
              <span className="text-gray-800 dark:text-gray-200">{headerMatch[2]}</span>
            </p>
          )
        }
        // * bullet
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
              <span className="text-gray-700 dark:text-gray-300">{line.slice(2)}</span>
            </div>
          )
        }
        // empty line
        if (!line.trim()) return <div key={i} className="h-2" />
        return (
          <p key={i} className="text-gray-800 dark:text-gray-200">
            {line}
          </p>
        )
      })}
    </div>
  )
}

export function StepCriar({ w }: { w: CriarWizardApi }) {
  const { formatoAtual, modo, fonte, objetivo } = w
  const [promptView, setPromptView] = useState<'preview' | 'edit'>('preview')

  return (
    <div className="mt-6 md:mt-10">
      <Header
        titulo="Sua Ideia"
        subtitulo="Vamos transformar sua ideia em conteudo profissional"
      />

      {/* Cards de resumo (Formato / Modo / Objetivo) */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <ResumoCardRich
          label="FORMATO"
          labelBg="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
          icon={<Smartphone className="h-5 w-5 text-white" />}
          titulo={
            formatoAtual
              ? `${formatoAtual.label} ${formatoAtual.subLabel}`
              : '—'
          }
          meta={
            formatoAtual ? (
              <span className="flex items-center gap-1">
                {formatoAtual.plataforma === 'instagram' ? (
                  <Instagram className="h-3 w-3" />
                ) : (
                  <Facebook className="h-3 w-3" />
                )}
                {formatoAtual.plataforma === 'instagram'
                  ? 'Instagram'
                  : 'Facebook'}{' '}
                · {formatoAtual.size}
              </span>
            ) : null
          }
        />
        <ResumoCardRich
          label="MODO"
          labelBg="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          iconBg="bg-gradient-to-br from-purple-500 to-pink-500"
          icon={<Sparkles className="h-5 w-5 text-white" />}
          titulo={modo === 'estatica' ? 'Imagem Estatica' : 'Imagem Editavel'}
          meta={
            <span>
              {fonte === 'zero'
                ? 'Criar do Zero'
                : fonte === 'link'
                  ? 'A partir de Link'
                  : 'Inspiracao'}{' '}
              · Criacao livre
            </span>
          }
        />
        <ResumoCardRich
          label="OBJETIVO"
          labelBg="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          iconBg={
            objetivo === 'vender'
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gradient-to-br from-pink-400 to-rose-500'
          }
          icon={
            objetivo === 'vender' ? (
              <DollarSign className="h-5 w-5 text-white" />
            ) : (
              <Heart className="h-5 w-5 text-white" />
            )
          }
          titulo={objetivo === 'vender' ? 'Vender' : 'Engajar'}
          meta={
            <span>
              {objetivo === 'vender'
                ? 'Converter em clientes'
                : 'Gerar interacao'}
            </span>
          }
        />
      </div>

      {/* Badge creditos */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <Layers className="h-3.5 w-3.5 text-gray-500" />
          <span>1 slide</span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <Coins className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-semibold">{CUSTO_SLIDE} creditos</span>
        </div>
      </div>

      {/* Ideia original */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Ideia Original
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {w.ideia || '(sem ideia)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              w.setIdeiaTemp(w.ideia)
              w.setShowIdeiaDialog(true)
            }}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline dark:text-purple-300"
          >
            <PenLine className="h-3.5 w-3.5" />
            Editar
          </button>
        </div>
      </div>

      {/* Separador "Prompt melhorado" */}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ArrowRight className="h-3.5 w-3.5" />
        Prompt melhorado
      </div>

      {/* Prompt adaptado */}
      <div className="mt-3 rounded-2xl border border-purple-200 bg-white p-4 dark:border-purple-900/40 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Prompt adaptado para sua marca
          </div>
          <div className="flex items-center gap-2">
            {/* preview / edit toggle */}
            <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setPromptView('preview')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${
                  promptView === 'preview'
                    ? 'bg-white font-medium text-purple-700 shadow-sm dark:bg-gray-900 dark:text-purple-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Eye className="h-3 w-3" />
                Ver
              </button>
              <button
                type="button"
                onClick={() => setPromptView('edit')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition ${
                  promptView === 'edit'
                    ? 'bg-white font-medium text-purple-700 shadow-sm dark:bg-gray-900 dark:text-purple-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <FileText className="h-3 w-3" />
                Editar
              </button>
            </div>
            <button
              type="button"
              onClick={() => w.setPromptExpandido((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              aria-label="Expandir"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={w.refinar}
              disabled={w.gerando}
              className="flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300"
            >
              {w.gerando ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Refinar com IA
            </button>
          </div>
        </div>

        {w.gerando && !w.promptRefinado ? (
          <div className="flex items-center gap-2 py-10 pl-1 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analisando sua marca e refinando prompt...
          </div>
        ) : (
          <>
            {promptView === 'preview' ? (
              <div
                className={`w-full overflow-y-auto rounded-xl border border-purple-100 bg-purple-50/30 p-3 dark:border-purple-900/30 dark:bg-purple-950/20 ${
                  w.promptExpandido ? 'max-h-[600px]' : 'max-h-72'
                }`}
              >
                {w.promptRefinado ? (
                  <PromptPreview text={w.promptRefinado} />
                ) : (
                  <p className="text-sm italic text-gray-400">Aguardando geracao do prompt...</p>
                )}
              </div>
            ) : (
              <textarea
                value={w.promptRefinado}
                onChange={(e) => w.setPromptRefinado(e.target.value)}
                rows={w.promptExpandido ? 24 : 12}
                className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs leading-relaxed text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                placeholder="Aguardando geracao do prompt..."
              />
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={w.fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={w.handleReferenceUpload}
                />
                {w.referenceImage ? (
                  <div className="flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-xs text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300">
                    <ImagePlus className="h-3 w-3" />
                    Imagem de referencia
                    <button
                      type="button"
                      onClick={() => w.setReferenceImage(null)}
                      className="hover:text-purple-900"
                      aria-label="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => w.fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Adicionar imagem
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {w.promptRefinado.length} caracteres
              </div>
            </div>
          </>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
        <Lightbulb className="h-3.5 w-3.5" />
        Edite o prompt para ajustar o tom, adicionar detalhes ou mudar o foco
      </p>

      <Footer
        onVoltar={() => w.setStep('briefing')}
        onContinuar={w.gerarComIA}
        continuarDisabled={w.gerando || w.gerandoImagem || !w.promptRefinado.trim()}
        continuarLabel={
          w.gerandoImagem ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando imagem...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar com IA
              <span className="ml-2 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                <Coins className="h-3 w-3" />
                {CUSTO_SLIDE}
              </span>
            </>
          )
        }
      />
    </div>
  )
}
