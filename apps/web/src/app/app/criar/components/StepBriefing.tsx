'use client'

import toast from 'react-hot-toast'
import {
  Heart,
  DollarSign,
  Sparkles,
  Link2,
  Lightbulb,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Footer,
  FonteCard,
  Header,
  ObjetivoCard,
  Section,
} from './WizardChrome'
import { ABORDAGENS, ABORDAGENS_POR_OBJETIVO } from '../types'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

export function StepBriefing({ w }: { w: CriarWizardApi }) {
  return (
    <div className="mt-6 md:mt-10">
      <Header
        titulo="Defina o Conteudo da Imagem"
        subtitulo="Esse conteudo sera expandido em um prompt visual para gerar a arte completa com IA."
      />

      <div className="mt-6 space-y-5">
        <Section label="Qual o objetivo deste post?">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <ObjetivoCard
              ativo={w.objetivo === 'engajar'}
              onClick={() => {
                if (w.objetivo !== 'engajar') w.setAbordagem(null)
                w.setObjetivo('engajar')
              }}
              titulo="Engajar"
              subtitulo="Aumentar interacao e comunidade"
              icon={<Heart className="h-5 w-5" />}
              gradiente="from-pink-400 to-rose-500"
              tintBg="bg-pink-50 dark:bg-pink-950/40"
              tintIcon="text-pink-600 dark:text-pink-300"
            />
            <ObjetivoCard
              ativo={w.objetivo === 'vender'}
              onClick={() => {
                if (w.objetivo !== 'vender') w.setAbordagem(null)
                w.setObjetivo('vender')
              }}
              titulo="Vender"
              subtitulo="Converter seguidores em clientes"
              icon={<DollarSign className="h-5 w-5" />}
              gradiente="from-green-400 to-emerald-500"
              tintBg="bg-emerald-50 dark:bg-emerald-950/40"
              tintIcon="text-emerald-600 dark:text-emerald-300"
            />
          </div>
        </Section>

        {w.objetivo && (
          <Section
            label={
              <>
                Abordagem{' '}
                <span className="text-xs text-gray-500">(opcional)</span>
              </>
            }
            hint="Define a estrategia do conteudo interno das artes (textos, layout, tom)"
          >
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {(() => {
                const permitidas = ABORDAGENS_POR_OBJETIVO[w.objetivo!]
                const principais = ABORDAGENS.filter((a) =>
                  permitidas.includes(a.key),
                )
                const extras = ABORDAGENS.filter(
                  (a) => !permitidas.includes(a.key),
                )
                const lista = w.verMaisAbordagens
                  ? [...principais, ...extras]
                  : principais
                return lista.map((a) => {
                  const Icon = a.icon
                  const ativo = w.abordagem === a.key
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() =>
                        w.setAbordagem(w.abordagem === a.key ? null : a.key)
                      }
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                        ativo
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 dark:bg-purple-950/30'
                          : 'border-gray-200 bg-white hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${a.cor}`} />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {a.label}
                      </span>
                    </button>
                  )
                })
              })()}
              {!w.verMaisAbordagens && (
                <button
                  type="button"
                  onClick={() => w.setVerMaisAbordagens(true)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white p-3 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    Ver mais
                  </span>
                </button>
              )}
            </div>
            {w.abordagemSelecionada && (
              <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/60 p-3 dark:border-purple-900/40 dark:bg-purple-950/30">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-900 dark:text-purple-200">
                    <w.abordagemSelecionada.icon
                      className={`h-4 w-4 ${w.abordagemSelecionada.cor}`}
                    />
                    {w.abordagemSelecionada.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => w.setAbordagem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {w.abordagemSelecionada.detalhes.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        <Section label="Como voce quer criar?">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
            <FonteCard
              ativo={w.fonte === 'zero'}
              onClick={() => {
                w.setFonte('zero')
                w.setIdeiaTemp(
                  w.ideia ||
                    'Quero divulgar uma promocao de Dipirona 500mg com 30% de desconto esta semana. Queremos destacar que alivia dor de cabeca rapido, gerar confianca e engajamento com uma pergunta ao final.',
                )
                w.setShowIdeiaDialog(true)
              }}
              titulo="Criar do Zero"
              subtitulo="Descreva sua ideia e deixe a IA criar todo o conteudo"
              icon={<Sparkles className="h-5 w-5" />}
              cor="from-purple-400 to-pink-500"
              tintBg="bg-purple-50 dark:bg-purple-950/40"
              tintIcon="text-purple-600 dark:text-purple-300"
              resumo={w.ideia}
            />
            <FonteCard
              ativo={w.fonte === 'link'}
              onClick={() => w.setFonte('link')}
              titulo="A partir de Link"
              subtitulo="Cole um link e a IA extrai e adapta o conteudo"
              icon={<Link2 className="h-5 w-5" />}
              cor="from-blue-400 to-cyan-500"
              tintBg="bg-blue-50 dark:bg-blue-950/40"
              tintIcon="text-blue-600 dark:text-blue-300"
            />
            <FonteCard
              ativo={w.fonte === 'inspiracao'}
              onClick={() => {
                w.setFonte('inspiracao')
                w.setShowInspiracaoModal(true)
              }}
              titulo="Inspiracoes"
              subtitulo="Escolha de uma biblioteca de ideias prontas"
              icon={<Lightbulb className="h-5 w-5" />}
              cor="from-amber-400 to-orange-500"
              tintBg="bg-amber-50 dark:bg-amber-950/40"
              tintIcon="text-amber-600 dark:text-amber-300"
            />
          </div>
          {w.fonte === 'link' && (
            <div className="mt-3">
              <Input
                placeholder="https://..."
                value={w.linkUrl}
                onChange={(e) => w.setLinkUrl(e.target.value)}
              />
            </div>
          )}
        </Section>
      </div>

      <Footer
        onVoltar={() => w.setStep('formato')}
        onContinuar={() => {
          if (!w.objetivo) return toast.error('Escolha um objetivo')
          if (!w.ideia.trim()) return toast.error('Descreva sua ideia')
          w.setPromptRefinado('')
          w.setStep('criar')
        }}
        continuarDisabled={!w.objetivo || !w.ideia.trim()}
      />
    </div>
  )
}
