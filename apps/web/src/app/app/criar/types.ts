import {
  Image as ImageIcon,
  Layers,
  Smartphone,
  LayoutGrid,
  Facebook,
  Flame,
  BookOpen,
  Users,
  DollarSign,
  Check,
} from 'lucide-react'

// ── Tipos ─────────────────────────────────────
export type TipoConteudo = 'imagem' | 'video'
export type ModoGeracao = 'estatica' | 'editavel'
export type Formato =
  | 'post_portrait'
  | 'carrossel_portrait'
  | 'stories_unico'
  | 'stories_carrossel'
  | 'post_facebook'
export type Objetivo = 'engajar' | 'vender'
export type Abordagem =
  | 'viral'
  | 'educativo'
  | 'comunidade'
  | 'oferta'
  | 'storytelling'
  | 'prova_social'
export type FonteIdeia = 'zero' | 'link' | 'inspiracao'
export type StepKey = 'tipo' | 'modo' | 'formato' | 'briefing' | 'criar'

// ── Constantes de custo ──────────────────────
export const CUSTO_SLIDE = 15

// ── Formatos ──────────────────────────────────
export const FORMATOS: {
  key: Formato
  label: string
  subLabel: string
  size: string
  plataforma: 'instagram' | 'facebook'
  icon: any
  ratio: 'portrait' | 'story'
  isCarrossel?: boolean
  badge?: string
  gradient: string
}[] = [
  {
    key: 'post_portrait',
    label: 'Post',
    subLabel: 'Portrait',
    size: '1080 × 1350px',
    plataforma: 'instagram',
    icon: ImageIcon,
    ratio: 'portrait',
    gradient: 'from-fuchsia-400 to-purple-500',
    badge: 'TOP',
  },
  {
    key: 'carrossel_portrait',
    label: 'Carrossel',
    subLabel: 'Portrait',
    size: '1080 × 1350px',
    plataforma: 'instagram',
    icon: LayoutGrid,
    ratio: 'portrait',
    isCarrossel: true,
    gradient: 'from-purple-400 to-pink-500',
    badge: 'TOP',
  },
  {
    key: 'stories_unico',
    label: 'Stories',
    subLabel: 'Único',
    size: '1080 × 1920px',
    plataforma: 'instagram',
    icon: Smartphone,
    ratio: 'story',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    key: 'stories_carrossel',
    label: 'Stories',
    subLabel: 'Carrossel',
    size: '1080 × 1920px',
    plataforma: 'instagram',
    icon: Layers,
    ratio: 'story',
    isCarrossel: true,
    gradient: 'from-rose-400 to-orange-400',
  },
  {
    key: 'post_facebook',
    label: 'Post',
    subLabel: 'Facebook',
    size: '1080 × 1350px',
    plataforma: 'facebook',
    icon: Facebook,
    ratio: 'portrait',
    gradient: 'from-blue-400 to-sky-500',
  },
]

// ── Abordagens ────────────────────────────────
export const ABORDAGENS: {
  key: Abordagem
  label: string
  icon: any
  cor: string
  detalhes: string[]
}[] = [
  {
    key: 'viral',
    label: 'Viral',
    icon: Flame,
    cor: 'text-orange-500',
    detalhes: [
      'Hook polemico, contrario ou surpreendente que quebre o padrao do feed — nunca comece com algo previsivel',
      'Estrutura de curiosidade: prometer um resultado ou revelacao que so se descobre ao consumir o conteudo ate o final',
      'Linguagem direta, provocativa e sem formalidade corporativa — fale como uma pessoa real, nao como uma marca',
      'Visual com contraste extremo e elemento disruptivo que pare o scroll (cor vibrante, tipografia gigante, imagem inesperada)',
      'CTA que incentive compartilhamento ativo: "marca quem precisa ver isso", "manda pra alguem que ainda acredita nisso"',
      'Evitar cliches genericos ("dica valiosa", "voce sabia?") — ser especifico e ousado no tema',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'educativo',
    label: 'Educativo',
    icon: BookOpen,
    cor: 'text-green-500',
    detalhes: [
      'Comecar com a dor ou frustracao mais especifica do publico — nao usar perguntas genericas',
      'Conteudo estruturado em passos numerados ou lista com hierarquia visual clara (negrito, icones, separadores)',
      'Cada ponto deve ser acionavel e pratico — algo que a pessoa possa aplicar imediatamente',
      'Linguagem acessivel e sem jargao tecnico, como se explicasse para um amigo',
      'Incluir um "aha moment" — algo que surpreenda ou mude a perspectiva do leitor',
      'CTA para salvar o post ("salva pra consultar depois") ou compartilhar com quem precisa',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'comunidade',
    label: 'Comunidade',
    icon: Users,
    cor: 'text-blue-500',
    detalhes: [
      'Pergunta aberta e opinativa em destaque que gere conversa real nos comentarios — evitar perguntas de sim/nao',
      'Tom pessoal e vulneravel: compartilhar bastidores, erros, opinioes controversas ou experiencias reais',
      'Criar senso de pertencimento: "quem mais passa por isso?", "so eu que acho que..."',
      'Design que convide a interacao visual: enquete, "isso ou aquilo", escala de concordancia',
      'Elementos visuais acolhedores e humanos — fotos reais, cores quentes, tipografia informal',
      'Evitar tom professoral — o objetivo e conversar, nao ensinar',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'oferta',
    label: 'Oferta',
    icon: DollarSign,
    cor: 'text-amber-500',
    detalhes: [
      'Beneficio principal ou desconto em destaque absoluto — deve ser a primeira coisa que o olho le',
      'Elementos de urgencia reais e visiveis: prazo exato, contagem regressiva, estoque limitado com numero',
      'CTA direto e sem ambiguidade: "compre agora", "garanta o seu", "link na bio" — uma acao clara',
      'Mencionar redutores de risco: garantia, frete gratis, bonus exclusivo, parcelamento',
      'Comparar preco original vs. preco promocional de forma visual impactante',
      'Evitar textos longos — a oferta deve ser compreendida em 3 segundos',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'storytelling',
    label: 'Storytelling',
    icon: BookOpen,
    cor: 'text-purple-500',
    detalhes: [
      'Abrir com gancho emocional: uma cena, um problema real, uma frase que crie empatia imediata',
      'Construir uma mini-narrativa com inicio (problema), meio (descoberta) e fim (transformacao com o produto)',
      'A transicao da historia para a oferta deve ser natural — o produto aparece como solucao, nao como interrupcao',
      'Usar linguagem sensorial e descritiva: faca o leitor sentir, visualizar, se identificar',
      'CTA suave integrado a narrativa: "foi assim que eu resolvi" → "quer experimentar tambem?"',
      'Evitar parecer anuncio — o leitor deve sentir que esta consumindo conteudo, nao sendo vendido',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'prova_social',
    label: 'Prova social',
    icon: Check,
    cor: 'text-emerald-500',
    detalhes: [
      'Depoimento real ou resultado concreto em destaque — com nome, foto ou contexto que gere credibilidade',
      'Numeros especificos e mensuraveis com tipografia impactante: "347 clientes", "em 14 dias", "98% de satisfacao"',
      'Formato antes/depois com contraste visual claro para mostrar a transformacao real',
      'Incluir multiplos sinais de confianca: selos, avaliacoes, capturas de tela de feedback',
      'CTA baseado em confianca social: "veja o que dizem sobre nos", "junte-se a X pessoas que ja..."',
      'Evitar depoimentos genericos ("adorei!") — priorizar resultados especificos e verificaveis',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legivel',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Area de seguranca: evitar texto nos 15% superior e inferior',
    ],
  },
]

export const ABORDAGENS_POR_OBJETIVO: Record<Objetivo, Abordagem[]> = {
  engajar: ['viral', 'educativo', 'comunidade'],
  vender: ['oferta', 'storytelling', 'prova_social'],
}

export const STEPS_ORDER: { key: StepKey; label: string; hint: string }[] = [
  { key: 'tipo', label: 'Tipo', hint: 'Imagem ou Video' },
  { key: 'modo', label: 'Modo', hint: 'Como gerar' },
  { key: 'formato', label: 'Formato', hint: 'Escolha o tipo' },
  { key: 'briefing', label: 'Ideia', hint: 'Objetivo e abordagem' },
  { key: 'criar', label: 'Criar', hint: 'Gere o conteudo' },
]
