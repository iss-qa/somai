'use client'

import toast from 'react-hot-toast'
import { Sparkles, PenLine, Lock } from 'lucide-react'
import { BigCard, Footer, Header } from './WizardChrome'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

export function StepModo({ w }: { w: CriarWizardApi }) {
  return (
    <div className="mt-6 md:mt-10">
      <Header
        titulo="Como voce quer gerar a imagem?"
        subtitulo="Escolha o metodo ideal. Ambos usam IA — diferem em custo, controle e flexibilidade."
      />
      <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        <BigCard
          active={false}
          disabled
          onClick={() => toast('Em breve', { icon: '🚧' })}
          titulo="Imagem Editavel"
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Lock className="h-3 w-3" />
              Em breve
            </span>
          }
          subtitulo="Otimo para carrosseis"
          price="0 creditos por slide"
          icon={<PenLine className="h-6 w-6" />}
          details={[
            'Templates pre-prontos preenchidos pela IA',
            '100% editaveis no editor',
            'Texto e fundo gerados por IA',
            'Pronto em segundos',
          ]}
        />
        <BigCard
          active={w.modo === 'estatica'}
          onClick={() => w.setModo('estatica')}
          titulo="Imagem Estatica"
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Sparkles className="h-3 w-3" />
              Mais robusto
            </span>
          }
          subtitulo="Otimo para imagens unicas"
          price="15 creditos por slide"
          icon={<Sparkles className="h-6 w-6" />}
          details={[
            'Composicao totalmente unica',
            'Elementos criados na hora',
            'Edita via chat com IA',
          ]}
          highlight
        />
      </div>
      <Footer
        onVoltar={() => w.setStep('tipo')}
        onContinuar={() => w.setStep('formato')}
      />
    </div>
  )
}
