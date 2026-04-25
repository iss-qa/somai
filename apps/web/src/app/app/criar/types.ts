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
      'Gancho forte nos primeiros 3 segundos',
      'Formato que gera compartilhamentos',
      'Curiosidade ou surpresa',
    ],
  },
  {
    key: 'educativo',
    label: 'Educativo',
    icon: BookOpen,
    cor: 'text-green-500',
    detalhes: [
      'Ensina algo de valor rapido',
      'Estrutura dica 1, dica 2, dica 3',
      'Autoridade no assunto',
    ],
  },
  {
    key: 'comunidade',
    label: 'Comunidade',
    icon: Users,
    cor: 'text-blue-500',
    detalhes: [
      'Convida o publico a interagir',
      'Perguntas, enquetes',
      'Fortalece relacao com seguidores',
    ],
  },
  {
    key: 'oferta',
    label: 'Oferta',
    icon: DollarSign,
    cor: 'text-amber-500',
    detalhes: [
      'Beneficio principal ou desconto em destaque',
      'Urgencia real: prazo, estoque',
      'CTA direto: compre agora',
      'Redutores de risco: garantia, frete gratis',
      'Preco original vs promocional',
    ],
  },
  {
    key: 'storytelling',
    label: 'Storytelling',
    icon: BookOpen,
    cor: 'text-purple-500',
    detalhes: [
      'Conta uma historia real ou hipotetica',
      'Inicio, conflito, desfecho',
      'Gera identificacao e emocao',
    ],
  },
  {
    key: 'prova_social',
    label: 'Prova social',
    icon: Check,
    cor: 'text-emerald-500',
    detalhes: [
      'Usa depoimentos ou numeros reais',
      'Antes e depois',
      'Reforca credibilidade',
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
