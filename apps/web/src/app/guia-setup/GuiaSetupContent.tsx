'use client'

import { useState } from 'react'

const steps = [
  {
    number: '1️⃣',
    title: 'Criar uma Página no Facebook',
    description: 'Você precisa de uma Página — não pode ser perfil pessoal.',
    items: [
      'Acesse facebook.com e faça login',
      'Clique no menu (☰) no canto superior direito',
      'Selecione "Páginas" e clique em "Criar nova Página"',
      'Preencha o nome da sua empresa',
      'Escolha a categoria do seu negócio',
      'Clique em "Criar Página" e pronto!',
    ],
    link: { text: 'Criar Página no Facebook →', url: 'https://facebook.com/pages/create' },
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    number: '2️⃣',
    title: 'Tornar o Instagram uma conta Profissional',
    description: 'Sua conta precisa ser Comercial ou Criador de Conteúdo.',
    items: [
      'Abra o Instagram e vá até o seu Perfil',
      'Toque no menu (≡) no canto superior direito',
      'Acesse "Configurações e privacidade"',
      'Toque em "Tipo de conta e ferramentas"',
      'Selecione "Mudar para conta Profissional"',
      'Escolha "Comercial" (para empresas) ou "Criador de Conteúdo"',
      'Selecione a categoria do seu negócio e confirme',
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    number: '3️⃣',
    title: 'Vincular o Instagram à sua Página do Facebook',
    description: 'Conecte as duas contas para publicação automática.',
    items: [
      'No Instagram, vá em Configurações → Conta',
      'Toque em "Conta vinculada ao Facebook"',
      'Faça login com o Facebook quando solicitado',
      'Selecione a Página que você criou no Passo 1',
      'Confirme o vínculo',
    ],
    alternative: {
      title: 'Alternativa: vincular pelo Facebook',
      items: [
        'Acesse sua Página no Facebook',
        'Vá em Configurações → Instagram',
        'Clique em "Conectar conta"',
        'Faça login no Instagram e confirme',
      ],
    },
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

export default function GuiaSetupContent() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.03]"
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.04] transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{step.number}</span>
              <div>
                <p className="text-white font-semibold text-sm">{step.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{step.description}</p>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-3 ${open === i ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open === i && (
            <div className="px-5 pb-5 space-y-4 border-t border-white/10">
              <ol className="mt-4 space-y-2">
                {step.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[11px] font-bold mt-0.5">
                      {j + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>

              {'alternative' in step && step.alternative && (
                <div className="rounded-lg bg-white/[0.04] border border-white/10 p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2">{step.alternative.title}</p>
                  <ol className="space-y-1">
                    {step.alternative.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="flex-shrink-0">{j + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {'link' in step && step.link && (
                <a
                  href={step.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {step.link.text}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
