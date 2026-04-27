'use client'

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Heart,
  DollarSign,
  Sparkles,
  Link2,
  Lightbulb,
  X,
  MoreHorizontal,
  Lock,
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
  const objetivoSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!w.highlightObjetivo) return
    const t = setTimeout(() => w.setHighlightObjetivo(false), 1500)
    return () => clearTimeout(t)
  }, [w.highlightObjetivo])

  const sinalizarObjetivoFaltando = () => {
    w.setHighlightObjetivo(true)
    objetivoSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    toast.error('Escolha primeiro o objetivo do post')
  }

  const fonteBloqueada = !w.objetivo

  return (
    <div className="mt-6 md:mt-10">
      <Header
        titulo="Defina o Conteúdo da Imagem"
        subtitulo="Esse conteúdo será expandido em um prompt visual para gerar a arte completa com IA."
      />

      <div className="mt-6 space-y-5">
        <div
          ref={objetivoSectionRef}
          className={`rounded-2xl transition ${
            w.highlightObjetivo
              ? 'animate-pulse ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-950'
              : ''
          }`}
        >
          <Section
            label={
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  1
                </span>
                <span className="text-base font-semibold">
                  Qual o objetivo deste post?
                </span>
              </span>
            }
            hint="Comece por aqui — define o tom de toda a criação"
          >
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <ObjetivoCard
                ativo={w.objetivo === 'engajar'}
                onClick={() => {
                  if (w.objetivo !== 'engajar') w.setAbordagem(null)
                  w.setObjetivo('engajar')
                  w.setHighlightObjetivo(false)
                }}
                titulo="Engajar"
                subtitulo="Aumentar interação e comunidade"
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
                  w.setHighlightObjetivo(false)
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
        </div>

        {w.objetivo && (
          <Section
            label={
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  2
                </span>
                <span className="text-base font-semibold">
                  Abordagem{' '}
                  <span className="text-xs font-normal text-gray-500">
                    (opcional)
                  </span>
                </span>
              </span>
            }
            hint="Define a estratégia do conteúdo interno das artes (textos, layout, tom)"
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

        <Section
          label={
            <span className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  fonteBloqueada
                    ? 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-purple-600 text-white'
                }`}
              >
                3
              </span>
              <span
                className={`text-base font-semibold ${
                  fonteBloqueada ? 'text-gray-400' : ''
                }`}
              >
                Como você quer criar?
              </span>
              {fonteBloqueada && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
                  <Lock className="h-3 w-3" />
                  Defina o objetivo primeiro
                </span>
              )}
            </span>
          }
        >
          <div
            className={`grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3 ${
              fonteBloqueada ? 'pointer-events-none opacity-50' : ''
            }`}
            onClickCapture={(e) => {
              if (fonteBloqueada) {
                e.preventDefault()
                e.stopPropagation()
                sinalizarObjetivoFaltando()
              }
            }}
          >
            <FonteCard
              ativo={w.fonte === 'zero'}
              onClick={() => {
                if (fonteBloqueada) return sinalizarObjetivoFaltando()
                w.setFonte('zero')
                w.setIdeiaTemp(w.ideia || '')
                w.setShowIdeiaDialog(true)
              }}
              titulo="Criar do Zero"
              subtitulo="Descreva sua ideia e deixe a IA criar todo o conteúdo"
              icon={<Sparkles className="h-5 w-5" />}
              cor="from-purple-400 to-pink-500"
              tintBg="bg-purple-50 dark:bg-purple-950/40"
              tintIcon="text-purple-600 dark:text-purple-300"
              resumo={w.ideia}
            />
            <FonteCard
              ativo={w.fonte === 'link'}
              onClick={() => {
                if (fonteBloqueada) return sinalizarObjetivoFaltando()
                w.setFonte('link')
              }}
              titulo="A partir de Link"
              subtitulo="Cole um link e a IA extrai e adapta o conteúdo"
              icon={<Link2 className="h-5 w-5" />}
              cor="from-blue-400 to-cyan-500"
              tintBg="bg-blue-50 dark:bg-blue-950/40"
              tintIcon="text-blue-600 dark:text-blue-300"
            />
            <FonteCard
              ativo={w.fonte === 'inspiracao'}
              onClick={() => {
                if (fonteBloqueada) return sinalizarObjetivoFaltando()
                w.setFonte('inspiracao')
                w.setShowInspiracaoModal(true)
              }}
              titulo="Inspirações"
              subtitulo="Escolha de uma biblioteca de ideias prontas"
              icon={<Lightbulb className="h-5 w-5" />}
              cor="from-amber-400 to-orange-500"
              tintBg="bg-amber-50 dark:bg-amber-950/40"
              tintIcon="text-amber-600 dark:text-amber-300"
            />
          </div>
          {!fonteBloqueada && w.fonte === 'link' && (
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
          if (!w.objetivo) {
            sinalizarObjetivoFaltando()
            return
          }
          if (!w.ideia.trim()) return toast.error('Descreva sua ideia')
          w.setStep('criar')
        }}
        continuarDisabled={!w.objetivo || !w.ideia.trim()}
      />
    </div>
  )
}
