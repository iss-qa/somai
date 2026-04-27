'use client'

import toast from 'react-hot-toast'
import {
  Sparkles,
  ArrowRight,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Lock,
} from 'lucide-react'
import { BigCard, Footer, Header } from './WizardChrome'
import type { CriarWizardApi } from '../hooks/useCriarWizard'

export function StepTipo({ w }: { w: CriarWizardApi }) {
  return (
    <div className="mt-6 md:mt-10">
      <Header
        titulo="O que você quer criar?"
        subtitulo="Escolha o tipo de conteúdo que deseja gerar com IA."
      />
      <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        <BigCard
          active={w.tipo === 'imagem'}
          onClick={() => w.setTipo('imagem')}
          titulo="Gerar Imagem"
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <Sparkles className="h-3 w-3" />
              IA
            </span>
          }
          subtitulo="Posts, carrosséis e stories estáticos para suas redes sociais."
          price="A partir de 15 créditos"
          icon={<ImageIcon className="h-6 w-6" />}
          footer={
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Instagram className="h-4 w-4" />
              <Facebook className="h-4 w-4" />
              <Linkedin className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
            </div>
          }
        />
        <BigCard
          active={false}
          disabled
          onClick={() => toast('Em breve', { icon: '🚧' })}
          titulo="Gerar Vídeo"
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Lock className="h-3 w-3" />
              Em breve
            </span>
          }
          subtitulo="Vídeos animados com IA. Reels e Shorts."
          price="A partir de 30 créditos"
          icon={<Video className="h-6 w-6" />}
        />
      </div>
      <Footer
        onVoltar={() => w.router.back()}
        onContinuar={() => w.setStep('modo')}
        continuarLabel={
          <>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        }
      />
    </div>
  )
}
