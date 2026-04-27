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
  MessageCircle,
  Link2,
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
  | 'whatsapp_status'
  | 'whatsapp_landscape'
export type Plataforma = 'instagram' | 'facebook' | 'whatsapp'
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
  plataforma: Plataforma
  icon: any
  ratio: 'portrait' | 'story' | 'landscape'
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
  {
    key: 'whatsapp_status',
    label: 'Status',
    subLabel: 'WhatsApp · Portrait',
    size: '1080 × 1920px',
    plataforma: 'whatsapp',
    icon: MessageCircle,
    ratio: 'story',
    gradient: 'from-emerald-400 to-green-500',
  },
  {
    key: 'whatsapp_landscape',
    label: 'Card de Link',
    subLabel: 'WhatsApp · Landscape',
    size: '1200 × 630px',
    plataforma: 'whatsapp',
    icon: Link2,
    ratio: 'landscape',
    gradient: 'from-green-400 to-teal-500',
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
      'Hook polêmico, contrário ou surpreendente que quebre o padrão do feed — nunca comece com algo previsível',
      'Estrutura de curiosidade: prometer um resultado ou revelação que só se descobre ao consumir o conteúdo até o final',
      'Linguagem direta, provocativa e sem formalidade corporativa — fale como uma pessoa real, não como uma marca',
      'Visual com contraste extremo e elemento disruptivo que pare o scroll (cor vibrante, tipografia gigante, imagem inesperada)',
      'CTA que incentive compartilhamento ativo: "marca quem precisa ver isso", "manda pra alguém que ainda acredita nisso"',
      'Evitar clichês genéricos ("dica valiosa", "você sabia?") — ser específico e ousado no tema',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'educativo',
    label: 'Educativo',
    icon: BookOpen,
    cor: 'text-green-500',
    detalhes: [
      'Começar com a dor ou frustração mais específica do público — não usar perguntas genéricas',
      'Conteúdo estruturado em passos numerados ou lista com hierarquia visual clara (negrito, ícones, separadores)',
      'Cada ponto deve ser acionável e prático — algo que a pessoa possa aplicar imediatamente',
      'Linguagem acessível e sem jargão técnico, como se explicasse para um amigo',
      'Incluir um "aha moment" — algo que surpreenda ou mude a perspectiva do leitor',
      'CTA para salvar o post ("salva pra consultar depois") ou compartilhar com quem precisa',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'comunidade',
    label: 'Comunidade',
    icon: Users,
    cor: 'text-blue-500',
    detalhes: [
      'Pergunta aberta e opinativa em destaque que gere conversa real nos comentários — evitar perguntas de sim/não',
      'Tom pessoal e vulnerável: compartilhar bastidores, erros, opiniões controversas ou experiências reais',
      'Criar senso de pertencimento: "quem mais passa por isso?", "só eu que acho que..."',
      'Design que convide à interação visual: enquete, "isso ou aquilo", escala de concordância',
      'Elementos visuais acolhedores e humanos — fotos reais, cores quentes, tipografia informal',
      'Evitar tom professoral — o objetivo é conversar, não ensinar',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'oferta',
    label: 'Oferta',
    icon: DollarSign,
    cor: 'text-amber-500',
    detalhes: [
      'Benefício principal ou desconto em destaque absoluto — deve ser a primeira coisa que o olho lê',
      'Elementos de urgência reais e visíveis: prazo exato, contagem regressiva, estoque limitado com número',
      'CTA direto e sem ambiguidade: "compre agora", "garanta o seu", "link na bio" — uma ação clara',
      'Mencionar redutores de risco: garantia, frete grátis, bônus exclusivo, parcelamento',
      'Comparar preço original vs. preço promocional de forma visual impactante',
      'Evitar textos longos — a oferta deve ser compreendida em 3 segundos',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'storytelling',
    label: 'Storytelling',
    icon: BookOpen,
    cor: 'text-purple-500',
    detalhes: [
      'Abrir com gancho emocional: uma cena, um problema real, uma frase que crie empatia imediata',
      'Construir uma mini-narrativa com início (problema), meio (descoberta) e fim (transformação com o produto)',
      'A transição da história para a oferta deve ser natural — o produto aparece como solução, não como interrupção',
      'Usar linguagem sensorial e descritiva: faça o leitor sentir, visualizar, se identificar',
      'CTA suave integrado à narrativa: "foi assim que eu resolvi" → "quer experimentar também?"',
      'Evitar parecer anúncio — o leitor deve sentir que está consumindo conteúdo, não sendo vendido',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
  {
    key: 'prova_social',
    label: 'Prova social',
    icon: Check,
    cor: 'text-emerald-500',
    detalhes: [
      'Depoimento real ou resultado concreto em destaque — com nome, foto ou contexto que gere credibilidade',
      'Números específicos e mensuráveis com tipografia impactante: "347 clientes", "em 14 dias", "98% de satisfação"',
      'Formato antes/depois com contraste visual claro para mostrar a transformação real',
      'Incluir múltiplos sinais de confiança: selos, avaliações, capturas de tela de feedback',
      'CTA baseado em confiança social: "veja o que dizem sobre nós", "junte-se a X pessoas que já..."',
      'Evitar depoimentos genéricos ("adorei!") — priorizar resultados específicos e verificáveis',
      'Design vertical otimizado para tela cheia do celular',
      'Texto centralizado com fonte grande e legível',
      'Elementos visuais que guiem o olhar de cima para baixo',
      'Área de segurança: evitar texto nos 15% superior e inferior',
    ],
  },
]

export const ABORDAGENS_POR_OBJETIVO: Record<Objetivo, Abordagem[]> = {
  engajar: ['viral', 'educativo', 'comunidade'],
  vender: ['oferta', 'storytelling', 'prova_social'],
}

export const STEPS_ORDER: { key: StepKey; label: string; hint: string }[] = [
  { key: 'tipo', label: 'Tipo', hint: 'Imagem ou Vídeo' },
  { key: 'modo', label: 'Modo', hint: 'Como gerar' },
  { key: 'formato', label: 'Formato', hint: 'Escolha o tipo' },
  { key: 'briefing', label: 'Ideia', hint: 'Objetivo e abordagem' },
  { key: 'criar', label: 'Criar', hint: 'Gere o conteúdo' },
]
