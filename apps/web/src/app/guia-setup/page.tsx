import Link from 'next/link'
import { Metadata } from 'next'
import GuiaSetupContent from './GuiaSetupContent'

export const metadata: Metadata = {
  title: 'Guia de Setup — Soma.ai',
  description: 'Passo a passo para configurar sua Página no Facebook e Instagram Profissional',
}

export default function GuiaSetupPage() {
  return (
    <div className="min-h-screen bg-[#0d0d16]">
      {/* Header */}
      <header className="border-b border-white/10 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Soma.ai</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Acessar o painel →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Preparando suas redes sociais
          </h1>
          <p className="text-gray-400 text-sm">
            Siga os 3 passos abaixo antes de conectar ao Soma.ai
          </p>
        </div>

        <GuiaSetupContent />

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app/settings/integrations"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
          >
            ✅ Já fiz tudo — quero integrar agora
          </Link>
          <Link
            href="/app/settings/integrations?agendar=true"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 text-gray-300 font-medium text-sm transition-colors"
          >
            📅 Prefiro agendar com o time
          </Link>
        </div>
      </main>
    </div>
  )
}
