'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMediaStore } from '@/store/mediaStore'
import { toPng } from 'html-to-image'
import toast from 'react-hot-toast'
import {
  Sparkles,
  Square,
  Smartphone,
  Layers,
  Loader2,
  Check,
  Calendar,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Upload,
  Type,
  Eye,
  Palette,
  Move,
  FileText,
  ExternalLink,
  FolderOpen,
  X,
  Send,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Format = 'feed' | 'stories' | 'reels' | 'carousel'
type CarouselShape = 'square' | 'vertical'
type PostType = 'promocao' | 'dica' | 'novidade' | 'institucional' | 'data_comemorativa'
type PaletteId = 'vibrante' | 'profissional' | 'quente' | 'elegante' | 'custom'
type ImageLayout =
  | 'background'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'big-sale'
  | 'super-sale'
  | 'frame'
  | 'dual-product'
  | 'side-by-side'
  | 'side-frame'
type LogoPosition = 'top-left' | 'top-right' | 'top-center' | 'hidden'
type TypeBadgePosition = 'inline' | 'top-left' | 'top-center' | 'top-right'
type FontFamily =
  | 'Inter'
  | 'Roboto'
  | 'Montserrat'
  | 'Playfair Display'
  | 'Oswald'
  | 'Poppins'
  | 'Bebas Neue'
  | 'Raleway'
  | 'Lato'
  | 'Open Sans'

interface ColorPalette {
  id: PaletteId
  label: string
  primary: string
  secondary: string
  bg: string
}

interface CardConfig {
  format: Format
  postType: PostType
  productName: string
  headline: string
  originalPrice: string
  promoPrice: string
  extraText: string
  cta: string
  ctaUrl: string
  cardName: string
  palette: PaletteId
  customColors: { primary: string; secondary: string; bg: string }
  display: { showLogo: boolean; showCta: boolean; showPrice: boolean; showOriginalPrice: boolean }
  includeImage: boolean
  imageUrl: string
  imageUrl2: string  // second image for dual-product layout
  imageLayout: ImageLayout
  imageOpacity: number
  imageBlur: number
  fontFamily: FontFamily
  fontSizes: { title: number; subtitle: number; price: number; cta: number }
  textColor: string
  titleColor: string
  textPosition: { vertical: 'top' | 'center' | 'bottom'; horizontal: 'left' | 'center' | 'right' }
  logoPosition: LogoPosition
  typeBadgePosition: TypeBadgePosition
  carouselShape: CarouselShape
  carouselSlides: number
  objective: string
}

interface GalleryCard {
  _id: string
  id?: string
  card_name?: string
  format: Format
  post_type: PostType
  product_name: string
  headline?: string
  status: 'draft' | 'approved' | 'scheduled' | 'published'
  created_at?: string
  createdAt?: string
  generated_image_url?: string
  preview_url?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_PALETTES: ColorPalette[] = [
  { id: 'vibrante', label: 'Vibrante', primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' },
  { id: 'profissional', label: 'Profissional', primary: '#3B82F6', secondary: '#10B981', bg: '#0f172a' },
  { id: 'quente', label: 'Quente', primary: '#F59E0B', secondary: '#EF4444', bg: '#1c1917' },
  { id: 'elegante', label: 'Elegante', primary: '#A855F7', secondary: '#6366F1', bg: '#0c0a1a' },
]

const FORMAT_OPTIONS: { id: Format; label: string; icon: typeof Square; hint: string }[] = [
  { id: 'feed', label: 'Feed Quadrado', icon: Square, hint: 'Post quadrado 1:1 no feed do Instagram. Ideal para imagens de produtos, promocoes e conteudo informativo. Permanece no perfil permanentemente.' },
  { id: 'stories', label: 'Stories', icon: Smartphone, hint: 'Fotos ou videos curtos verticais (9:16) para engajamento diario. Desaparecem em 24h. Ideal para bastidores, enquetes e conexao com seguidores existentes.' },
  { id: 'carousel', label: 'Carrossel', icon: Layers, hint: 'Ate 10 imagens em um unico post deslizavel no formato quadrado (1:1) ou vertical (9:16). Ideal para tutoriais, antes/depois e multiplos produtos.' },
]

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'promocao', label: 'Promocao' },
  { value: 'dica', label: 'Dica' },
  { value: 'novidade', label: 'Novidade' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'data_comemorativa', label: 'Data Comemorativa' },
]

// ── Carousel objectives (Tema/Objetivo) by niche ──

interface CarouselSlideContent {
  headline: string
  subtext: string
  cta?: string
}

interface CarouselObjective {
  id: string
  label: string
  slides: CarouselSlideContent[]
}

const NICHE_OBJECTIVES: Record<string, CarouselObjective[]> = {
  farmacia: [
    { id: 'promo_semana', label: 'Promocoes da semana', slides: [
      { headline: 'Ofertas imperdíveis!', subtext: 'Confira as promocoes desta semana' },
      { headline: 'Ate 40% OFF', subtext: 'Medicamentos selecionados com desconto' },
      { headline: 'Dermocosmeticos', subtext: 'Cuidados com a pele por menos' },
      { headline: 'Vitaminas e suplementos', subtext: 'Cuide da sua saude todo dia' },
      { headline: 'Higiene e beleza', subtext: 'Produtos essenciais com preco baixo' },
      { headline: 'Nao perca!', subtext: 'Ofertas validas por tempo limitado', cta: 'Venha conferir' },
      { headline: 'Farmacia sempre perto', subtext: 'Atendimento de qualidade pra voce', cta: 'Chame no WhatsApp' },
    ]},
    { id: 'dica_saude', label: 'Dica de Saude', slides: [
      { headline: 'Voce sabia?', subtext: 'Dicas de saude para o seu dia a dia' },
      { headline: 'Hidratacao', subtext: 'Beba pelo menos 2 litros de agua por dia' },
      { headline: 'Alimentacao', subtext: 'Inclua frutas e verduras nas refeicoes' },
      { headline: 'Sono de qualidade', subtext: 'Durma de 7 a 8 horas por noite' },
      { headline: 'Exercicios', subtext: 'Pratique atividade fisica regularmente' },
      { headline: 'Check-up em dia', subtext: 'Faca exames periodicos', cta: 'Cuide-se!' },
      { headline: 'Conte com a gente', subtext: 'Estamos aqui para ajudar', cta: 'Fale conosco' },
    ]},
    { id: 'novo_produto', label: 'Lancamento de produto', slides: [
      { headline: 'Novidade!', subtext: 'Chegou na farmacia' },
      { headline: 'Conheca o produto', subtext: 'Qualidade e eficacia comprovada' },
      { headline: 'Beneficios', subtext: 'Resultados que voce vai sentir' },
      { headline: 'Como usar', subtext: 'Modo de uso simples e pratico' },
      { headline: 'Preco especial', subtext: 'Oferta de lancamento', cta: 'Aproveite' },
      { headline: 'Disponivel agora', subtext: 'Venha buscar o seu' },
      { headline: 'Garanta o seu', subtext: 'Estoque limitado', cta: 'Compre agora' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  pet: [
    { id: 'apresentacao', label: 'O que e o Petshop?', slides: [
      { headline: 'Conheca nosso petshop!', subtext: 'Cuidados completos para seu pet' },
      { headline: 'Banho e Tosa', subtext: 'Seu pet limpinho e cheiroso' },
      { headline: 'Racao Premium', subtext: 'As melhores marcas do mercado' },
      { headline: 'Acessorios', subtext: 'Brinquedos, camas e coleiras' },
      { headline: 'Veterinario', subtext: 'Atendimento com amor e carinho' },
      { headline: 'Delivery', subtext: 'Entregamos na sua porta', cta: 'Peca agora' },
      { headline: 'Venha nos visitar!', subtext: 'Seu pet merece o melhor', cta: 'Chame no WhatsApp' },
    ]},
    { id: 'promo_racao', label: 'Promocao de Racao', slides: [
      { headline: 'Super Oferta!', subtext: 'Racao com preco especial' },
      { headline: 'Caes', subtext: 'Racao premium a partir de R$ XX' },
      { headline: 'Gatos', subtext: 'As melhores marcas com desconto' },
      { headline: 'Filhotes', subtext: 'Nutricao ideal para crescimento' },
      { headline: 'Frete gratis*', subtext: 'Acima de R$ 100 em compras', cta: 'Peca ja' },
      { headline: 'Entrega rapida', subtext: 'Receba no mesmo dia' },
      { headline: 'Aproveite!', subtext: 'Estoque limitado', cta: 'Compre agora' },
    ]},
    { id: 'cuidados', label: 'Dicas de cuidados com pets', slides: [
      { headline: 'Dicas para seu pet', subtext: 'Cuidados essenciais' },
      { headline: 'Vacinacao em dia', subtext: 'Proteja seu amigo' },
      { headline: 'Higiene bucal', subtext: 'Escove os dentes do pet regularmente' },
      { headline: 'Passeios diarios', subtext: 'Exercicio e fundamental' },
      { headline: 'Alimentacao correta', subtext: 'Consulte o veterinario' },
      { headline: 'Carinho sempre!', subtext: 'Amor e o melhor remedio' },
      { headline: 'Conte com a gente', subtext: 'Cuidamos do seu pet', cta: 'Agende agora' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  moda: [
    { id: 'nova_colecao', label: 'Lancamento de colecao', slides: [
      { headline: 'Nova Colecao!', subtext: 'Chegou o que voce esperava' },
      { headline: 'Tendencia', subtext: 'As pecas mais desejadas da estacao' },
      { headline: 'Looks exclusivos', subtext: 'Estilo unico para voce' },
      { headline: 'Conforto + estilo', subtext: 'Qualidade que voce sente' },
      { headline: 'Tamanhos P ao GG', subtext: 'Moda para todos os corpos' },
      { headline: 'Preco especial', subtext: 'Lancamento com desconto', cta: 'Confira' },
      { headline: 'Garanta o seu', subtext: 'Estoque limitado!', cta: 'Compre agora' },
    ]},
    { id: 'liquidacao', label: 'Liquidacao', slides: [
      { headline: 'LIQUIDACAO!', subtext: 'Ate 70% de desconto' },
      { headline: 'Blusas', subtext: 'A partir de R$ XX' },
      { headline: 'Calcas', subtext: 'Com ate 50% OFF' },
      { headline: 'Vestidos', subtext: 'Pecas selecionadas' },
      { headline: 'Acessorios', subtext: 'Complemente seu look' },
      { headline: 'So ate acabar!', subtext: 'Corre que ta acabando', cta: 'Vem pra loja' },
      { headline: 'Frete gratis', subtext: 'Compras acima de R$ 150', cta: 'Compre online' },
    ]},
    { id: 'depoimento', label: 'Depoimento / Prova social', slides: [
      { headline: 'O que dizem de nos', subtext: 'Clientes reais, resultados reais' },
      { headline: '"Amei a qualidade!"', subtext: '- Maria S.' },
      { headline: '"Entrega super rapida"', subtext: '- Joao P.' },
      { headline: '"Virei cliente fiel"', subtext: '- Ana L.' },
      { headline: '"Melhor loja da cidade"', subtext: '- Carlos M.' },
      { headline: 'Junte-se a eles!', subtext: 'Milhares de clientes satisfeitos' },
      { headline: 'Experimente voce tambem', subtext: 'Qualidade garantida', cta: 'Visite a loja' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  cosmeticos: [
    { id: 'lancamento', label: 'Lancamento de produto', slides: [
      { headline: 'Novidade!', subtext: 'Conheca nosso lancamento' },
      { headline: 'Ingredientes', subtext: 'Formula exclusiva e natural' },
      { headline: 'Resultados', subtext: 'Pele renovada em 7 dias' },
      { headline: 'Como aplicar', subtext: 'Passo a passo simples' },
      { headline: 'Antes e depois', subtext: 'Resultados comprovados' },
      { headline: 'Oferta especial', subtext: 'Preco de lancamento', cta: 'Garanta o seu' },
      { headline: 'Disponivel agora', subtext: 'Na loja e online', cta: 'Compre ja' },
    ]},
    { id: 'tutorial', label: 'Tutorial / Passo a passo', slides: [
      { headline: 'Tutorial', subtext: 'Aprenda uma tecnica nova' },
      { headline: 'Passo 1', subtext: 'Prepare a pele' },
      { headline: 'Passo 2', subtext: 'Aplique a base' },
      { headline: 'Passo 3', subtext: 'Finalize com po' },
      { headline: 'Resultado', subtext: 'Make perfeita e natural' },
      { headline: 'Produtos usados', subtext: 'Todos disponiveis na loja' },
      { headline: 'Gostou? Salve!', subtext: 'Compartilhe com as amigas', cta: 'Compre os produtos' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  mercearia: [
    { id: 'ofertas', label: 'Ofertas da semana', slides: [
      { headline: 'Ofertas da Semana', subtext: 'Precos que cabem no bolso' },
      { headline: 'Hortifruti', subtext: 'Fresquinho todo dia' },
      { headline: 'Acougue', subtext: 'Carnes selecionadas' },
      { headline: 'Padaria', subtext: 'Pao quentinho toda manha' },
      { headline: 'Bebidas', subtext: 'Geladas e com desconto' },
      { headline: 'Frios e laticinios', subtext: 'Qualidade garantida' },
      { headline: 'Venha conferir!', subtext: 'Valido ate sabado', cta: 'Veja o encarte' },
    ]},
    { id: 'receita', label: 'Receita do dia', slides: [
      { headline: 'Receita do Dia', subtext: 'Facil, rapido e delicioso' },
      { headline: 'Ingredientes', subtext: 'Voce encontra tudo aqui' },
      { headline: 'Modo de preparo', subtext: 'Passo 1: Prepare os ingredientes' },
      { headline: 'Passo 2', subtext: 'Misture e leve ao fogo' },
      { headline: 'Passo 3', subtext: 'Sirva e aproveite!' },
      { headline: 'Dica extra', subtext: 'Combine com um suco natural' },
      { headline: 'Ingredientes aqui!', subtext: 'Tudo na nossa mercearia', cta: 'Faca sua lista' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  calcados: [
    { id: 'colecao', label: 'Nova colecao', slides: [
      { headline: 'Nova Colecao!', subtext: 'Os lancamentos chegaram' },
      { headline: 'Tenis', subtext: 'Conforto para o dia a dia' },
      { headline: 'Sandalia', subtext: 'Estilo para o verao' },
      { headline: 'Social', subtext: 'Elegancia para ocasioes especiais' },
      { headline: 'Infantil', subtext: 'Calcados para os pequenos' },
      { headline: 'Preco especial', subtext: 'Lancamento com desconto', cta: 'Confira' },
      { headline: 'Visite a loja', subtext: 'Ou peca pelo WhatsApp', cta: 'Chame a gente' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  outro: [
    { id: 'apresentacao', label: 'O que e o negocio?', slides: [
      { headline: 'Conheca nosso negocio', subtext: 'Solucoes feitas pra voce' },
      { headline: 'Nossos servicos', subtext: 'Qualidade e compromisso' },
      { headline: 'Diferenciais', subtext: 'O que nos torna unicos' },
      { headline: 'Depoimentos', subtext: 'Clientes satisfeitos' },
      { headline: 'Como funciona', subtext: 'Simples e pratico' },
      { headline: 'Fale conosco', subtext: 'Atendimento personalizado', cta: 'Chame no WhatsApp' },
      { headline: 'Venha conhecer', subtext: 'Estamos te esperando', cta: 'Saiba mais' },
    ]},
    { id: 'prova_social', label: 'Depoimento / Prova social', slides: [
      { headline: 'O que dizem de nos', subtext: 'Clientes reais' },
      { headline: '"Excelente servico!"', subtext: '- Cliente 1' },
      { headline: '"Super recomendo"', subtext: '- Cliente 2' },
      { headline: '"Melhor custo-beneficio"', subtext: '- Cliente 3' },
      { headline: '"Atendimento top"', subtext: '- Cliente 4' },
      { headline: 'Junte-se a eles!', subtext: 'Centenas de clientes satisfeitos' },
      { headline: 'Experimente!', subtext: 'Garantia de satisfacao', cta: 'Fale conosco' },
    ]},
    { id: 'cta', label: 'Chamada para acao (CTA)', slides: [
      { headline: 'Oferta especial!', subtext: 'So por tempo limitado' },
      { headline: 'O que voce ganha', subtext: 'Beneficios exclusivos' },
      { headline: 'Como funciona', subtext: 'Simples e rapido' },
      { headline: 'Resultados reais', subtext: 'Comprovado por clientes' },
      { headline: 'Preco acessivel', subtext: 'Cabe no seu bolso' },
      { headline: 'Nao perca!', subtext: 'Vagas limitadas', cta: 'Garanta o seu' },
      { headline: 'Comece agora!', subtext: 'Chame no WhatsApp', cta: 'Falar com atendente' },
    ]},
    { id: 'passo_a_passo', label: 'Passo a passo: como funciona', slides: [
      { headline: 'Como funciona?', subtext: 'Veja o passo a passo' },
      { headline: 'Passo 1', subtext: 'Entre em contato conosco' },
      { headline: 'Passo 2', subtext: 'Escolha seu plano ou produto' },
      { headline: 'Passo 3', subtext: 'Receba em casa ou retire' },
      { headline: 'Pronto!', subtext: 'Simples assim' },
      { headline: 'Duvidas?', subtext: 'Estamos aqui pra ajudar' },
      { headline: 'Comece agora', subtext: 'E facil e rapido', cta: 'Fale conosco' },
    ]},
    { id: 'seguranca', label: 'Seguranca e confianca', slides: [
      { headline: 'Por que confiar?', subtext: 'Transparencia e seguranca' },
      { headline: '+X anos no mercado', subtext: 'Experiencia comprovada' },
      { headline: 'Certificacoes', subtext: 'Qualidade reconhecida' },
      { headline: 'Politica de troca', subtext: 'Satisfacao garantida' },
      { headline: 'Pagamento seguro', subtext: 'Suas compras protegidas' },
      { headline: 'Atendimento humano', subtext: 'Pessoas reais cuidando de voce' },
      { headline: 'Conte com a gente', subtext: 'Estamos aqui', cta: 'Saiba mais' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
}

function getObjectivesForNiche(niche?: string): CarouselObjective[] {
  return NICHE_OBJECTIVES[niche || 'outro'] || NICHE_OBJECTIVES.outro
}

function getSlideContent(objective: CarouselObjective | undefined, slideIndex: number, config: CardConfig): CarouselSlideContent {
  if (!objective || objective.id === 'personalizado' || !objective.slides.length) {
    return { headline: config.headline || 'Seu titulo aqui', subtext: config.extraText || 'Seu texto aqui', cta: config.cta }
  }
  const slide = objective.slides[slideIndex % objective.slides.length]
  return slide
}

const FONT_FAMILIES: FontFamily[] = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Poppins',
  'Bebas Neue',
  'Playfair Display',
  'Oswald',
  'Raleway',
  'Lato',
  'Open Sans',
]

const IMAGE_LAYOUTS: { id: ImageLayout; label: string }[] = [
  { id: 'background', label: 'Fundo' },
  { id: 'top', label: 'Img Topo' },
  { id: 'bottom', label: 'Img Baixo' },
  { id: 'left', label: 'Img Esquerda' },
  { id: 'right', label: 'Img Direita' },
  { id: 'big-sale', label: 'Big Sale' },
  { id: 'super-sale', label: 'Super Sale' },
  { id: 'frame', label: 'Moldura' },
  { id: 'dual-product', label: '2 Produtos' },
  { id: 'side-by-side', label: 'Lado a Lado' },
  { id: 'side-frame', label: 'Lado Moldura' },
]

// ---------------------------------------------------------------------------
// RANDOM smart content pool per niche (each click picks a different combo)
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const RANDOM_HEADLINES: Record<string, string[]> = {
  farmacia: ['Oferta da semana', 'Super desconto', 'Imperdivel', 'So hoje!', 'Queima de estoque', 'Preco imbativel', 'Economize agora', 'Aproveite'],
  pet: ['Seu pet merece', 'Super oferta', 'Promo pet', 'Cuide com amor', 'Imperdivel', 'Novidade pet', 'Preco especial', 'Vem conferir'],
  moda: ['Liquidacao total', 'Colecao nova', 'Tendencia 2026', 'Look perfeito', 'Pecas exclusivas', 'Desconto especial', 'Estilo unico'],
  cosmeticos: ['Cuide-se', 'Beleza real', 'Glow up', 'Promo beauty', 'Sua pele agradece', 'Beauty week', 'Transforme-se'],
  mercearia: ['Oferta do dia', 'Precos baixos', 'Fresquinho', 'Economia real', 'So aqui', 'Cesta cheia', 'Tem de tudo'],
  calcados: ['Mega sale', 'Conforto + estilo', 'Nova colecao', 'Imperdivel', 'Ande com estilo', 'Lancamento', 'Preco quente'],
  outro: ['Oferta imperdivel', 'Novidade', 'So hoje', 'Desconto especial', 'Aproveite', 'Lancamento', 'Confira'],
}

const RANDOM_PRODUCTS: Record<string, string[]> = {
  farmacia: ['Vitamina C 1000mg', 'Dipirona 500mg', 'Protetor Solar FPS 50', 'Epocler', 'Neosoro', 'Dorflex', 'Benegrip', 'Shampoo Anticaspa', 'Hidratante Corporal', 'Colgate Total 12', 'Desodorante Rexona', 'Band-Aid', 'Omega 3', 'Melatonina 5mg', 'Dermocosmetico La Roche'],
  pet: ['Racao Pedigree 15kg', 'Racao Golden 10kg', 'Antipulgas Frontline', 'Brinquedo Kong', 'Coleira Antipulgas', 'Racao Royal Canin', 'Petisco DentaStix', 'Cama para Gatos', 'Shampoo Pet Clean', 'Areia Sanitaria', 'Comedouro Automatico', 'Racao Whiskas', 'Osso Natural', 'Guia Retratil'],
  moda: ['Vestido Floral', 'Jaqueta Jeans', 'Tenis Casual', 'Bolsa Couro', 'Camisa Social Slim', 'Saia Midi', 'Short Jeans', 'Blazer Feminino', 'Camiseta Basica', 'Macacao Longo', 'Calca Skinny', 'Top Cropped'],
  cosmeticos: ['Serum Vitamina C', 'Kit Skincare', 'Base MAC', 'Batom Matte', 'Mascara Cilios', 'Protetor Facial', 'Hidratante Nivea', 'Perfume Importado', 'Po Compacto', 'Primer', 'Paleta Sombras', 'Esmalte Risque'],
  mercearia: ['Arroz 5kg', 'Feijao Carioca 1kg', 'Oleo de Soja', 'Acucar Cristal', 'Cafe Pilao 500g', 'Macarrao Barilla', 'Molho de Tomate', 'Leite Integral', 'Farinha de Trigo', 'Cesta Basica', 'Frutas da Estacao', 'Ovos caipira'],
  calcados: ['Tenis Nike Air Max', 'Sandalia Havaianas', 'Bota Chelsea', 'Sapato Social', 'Tenis Adidas Ultraboost', 'Chinelo Rider', 'Sapatenis Reserva', 'Tenis New Balance', 'Rasteirinha', 'Mocassim Couro'],
  outro: ['Produto Premium', 'Kit Especial', 'Combo Exclusivo', 'Lancamento', 'Edicao Limitada', 'Best Seller', 'Destaque'],
}

const RANDOM_CTAS = ['Compre agora', 'Aproveite', 'Garanta o seu', 'Confira', 'Saiba mais', 'Veja mais', 'Quero o meu', 'Visite a loja', 'Peca ja', 'Nao perca', 'Experimente', 'Reserve agora', 'Adquira ja']

const RANDOM_EXTRAS: Record<string, string[]> = {
  farmacia: ['Valido ate sexta! Consulte disponibilidade.', 'Entrega gratis para compras acima de R$50.', 'Seus cuidados com saude pelo melhor preco.', 'Qualidade e economia para voce e sua familia.', 'Consulte nosso farmaceutico.'],
  pet: ['Seu melhor amigo merece o melhor!', 'Frete gratis para pedidos acima de R$100.', 'Qualidade premium para pets felizes.', 'Veterinario recomenda!', 'Entrega rapida na sua regiao.'],
  moda: ['Pecas com estilo e conforto.', 'Vista-se com personalidade.', 'Envio para todo o Brasil.', 'Troca gratis em ate 30 dias.', 'Tendencias que voce vai amar.'],
  cosmeticos: ['Sua beleza natural realcada.', 'Dermatologicamente testado.', 'Pele radiante em poucos dias.', 'Cruelty free e vegano.', 'Resultados visiveis desde a primeira aplicacao.'],
  mercearia: ['Produtos frescos todo dia.', 'Qualidade e economia na sua mesa.', 'Delivery pelo WhatsApp!', 'Ofertas validas enquanto durar o estoque.', 'Produtos selecionados da regiao.'],
  calcados: ['Conforto que voce merece.', 'Frete gratis acima de R$199.', 'Design moderno e duravel.', 'Troca facilitada.', 'Do 34 ao 44, todos os tamanhos.'],
  outro: ['Oferta por tempo limitado.', 'Nao perca essa oportunidade!', 'Qualidade garantida.', 'Atendimento personalizado.', 'Melhor custo-beneficio.'],
}

function getSmartDefaults(niche: string | undefined, postType: PostType): Partial<CardConfig> {
  const n = niche || 'outro'

  const products = RANDOM_PRODUCTS[n] || RANDOM_PRODUCTS.outro
  const headlines = RANDOM_HEADLINES[n] || RANDOM_HEADLINES.outro
  const extras = RANDOM_EXTRAS[n] || RANDOM_EXTRAS.outro

  const product = pick(products)
  const base: Partial<CardConfig> = {
    productName: product,
    headline: pick(headlines),
    extraText: pick(extras),
    cta: pick(RANDOM_CTAS),
    palette: pick(['vibrante', 'profissional', 'quente', 'elegante'] as PaletteId[]),
    fontFamily: pick(FONT_FAMILIES),
    postType,
  }

  if (postType === 'promocao') {
    const original = (Math.floor(Math.random() * 200) + 20)
    const discount = Math.floor(Math.random() * 40) + 15 // 15-55% off
    const promo = Math.round(original * (1 - discount / 100) * 100) / 100
    base.originalPrice = `${original},90`
    base.promoPrice = `${Math.floor(promo)},90`
  }

  if (postType === 'dica') {
    base.headline = pick(['Voce sabia?', 'Dica do especialista', 'Fique ligado', 'Dica do dia', 'Cuide-se bem'])
    base.cta = pick(['Saiba mais', 'Confira', 'Leia mais', 'Descubra'])
  }

  if (postType === 'institucional') {
    base.productName = pick(['Comunicado importante', 'Horario especial', 'Atendimento', 'Novos horarios', 'Aviso aos clientes'])
    base.headline = pick(['Comunicado', 'Informativo', 'Atenção', 'Aviso'])
    base.cta = pick(['Saiba mais', 'Entenda', 'Confira', 'Veja detalhes'])
  }

  if (postType === 'novidade') {
    base.headline = pick(['Novidade na loja', 'Chegou!', 'Lancamento', 'Recem chegado', 'Exclusivo'])
    base.cta = pick(['Confira', 'Veja mais', 'Conheca', 'Descubra'])
  }

  if (postType === 'data_comemorativa') {
    const datas = ['Dia das Maes', 'Black Friday', 'Natal', 'Dia dos Namorados', 'Dia do Cliente', 'Aniversario da Loja', 'Semana do Consumidor']
    base.productName = pick(datas)
    base.headline = pick(['Celebre conosco', 'Data especial', 'Comemore', 'Festeje'])
    base.cta = pick(['Aproveite', 'Celebre', 'Comemore', 'Presenteie'])
  }

  return base
}

const DEFAULT_CONFIG: CardConfig = {
  format: 'feed',
  postType: 'promocao',
  productName: '',
  headline: '',
  originalPrice: '',
  promoPrice: '',
  extraText: '',
  cta: 'Compre agora',
  ctaUrl: '',
  cardName: '',
  palette: 'vibrante',
  customColors: { primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' },
  display: { showLogo: true, showCta: true, showPrice: true, showOriginalPrice: true },
  includeImage: false,
  imageUrl: '',
  imageUrl2: '',
  imageLayout: 'background',
  imageOpacity: 40,
  imageBlur: 4,
  fontFamily: 'Inter',
  fontSizes: { title: 28, subtitle: 16, price: 36, cta: 14 },
  textColor: '#ffffff',
  titleColor: '#ffffff',
  textPosition: { vertical: 'center', horizontal: 'center' },
  logoPosition: 'top-left',
  typeBadgePosition: 'inline',
  carouselShape: 'square',
  carouselSlides: 3,
  objective: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Real Instagram dimensions (2026)
const REAL_DIMENSIONS: Record<Format, { w: number; h: number }> = {
  feed: { w: 1080, h: 1080 },
  stories: { w: 1080, h: 1920 },
  reels: { w: 1080, h: 1920 },
  carousel: { w: 1080, h: 1080 },
}

function getCarouselDimensions(shape: CarouselShape): { w: number; h: number } {
  return shape === 'vertical' ? { w: 1080, h: 1350 } : { w: 1080, h: 1080 }
}

// Preview dimensions (scaled down to fit UI, maintain exact ratio)
function getPreviewDimensions(format: Format, carouselShape?: CarouselShape): { w: number; h: number } {
  const real = format === 'carousel' && carouselShape
    ? getCarouselDimensions(carouselShape)
    : REAL_DIMENSIONS[format]
  const scale = 400 / real.w
  return { w: Math.round(real.w * scale), h: Math.round(real.h * scale) }
}

function getDimensionLabel(format: Format, carouselShape?: CarouselShape): string {
  const d = format === 'carousel' && carouselShape
    ? getCarouselDimensions(carouselShape)
    : REAL_DIMENSIONS[format]
  return `${d.w}x${d.h}`
}

function getActivePalette(config: CardConfig): { primary: string; secondary: string; bg: string } {
  if (config.palette === 'custom') return config.customColors
  const found = COLOR_PALETTES.find((p) => p.id === config.palette)
  return found
    ? { primary: found.primary, secondary: found.secondary, bg: found.bg }
    : { primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' }
}

function getFontStack(fontFamily: FontFamily): string {
  const fallbacks: Record<FontFamily, string> = {
    Inter: "'Inter', 'Segoe UI', Arial, sans-serif",
    Roboto: "'Roboto', 'Segoe UI', Arial, sans-serif",
    Montserrat: "'Montserrat', 'Segoe UI', Arial, sans-serif",
    'Playfair Display': "'Playfair Display', Georgia, 'Times New Roman', serif",
    Oswald: "'Oswald', 'Impact', Arial Narrow, sans-serif",
    Poppins: "'Poppins', 'Segoe UI', Arial, sans-serif",
    'Bebas Neue': "'Bebas Neue', 'Impact', Arial Narrow, sans-serif",
    Raleway: "'Raleway', 'Segoe UI', Arial, sans-serif",
    Lato: "'Lato', 'Segoe UI', Arial, sans-serif",
    'Open Sans': "'Open Sans', 'Segoe UI', Arial, sans-serif",
  }
  return fallbacks[fontFamily] || fallbacks.Inter
}

function generateCardName(format: Format, postType: PostType, productName: string): string {
  const formatLabel = FORMAT_OPTIONS.find((f) => f.id === format)?.label || format
  const typeLabel = POST_TYPES.find((t) => t.value === postType)?.label || postType
  const name = productName.trim() || 'Sem nome'
  return `${formatLabel} - ${typeLabel} - ${name}`
}

function getTextPositionStyles(tp: CardConfig['textPosition']): {
  justifyContent: string
  alignItems: string
  textAlign: React.CSSProperties['textAlign']
} {
  const vMap: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' }
  const hMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' }
  const tMap: Record<string, React.CSSProperties['textAlign']> = { left: 'left', center: 'center', right: 'right' }
  return {
    justifyContent: vMap[tp.vertical],
    alignItems: hMap[tp.horizontal],
    textAlign: tMap[tp.horizontal],
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'approved': return 'success'
    case 'scheduled': return 'warning'
    case 'published': return 'default'
    default: return 'secondary'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Rascunho'
    case 'approved': return 'Aprovado'
    case 'scheduled': return 'Agendado'
    case 'published': return 'Publicado'
    default: return status
  }
}

// ---------------------------------------------------------------------------
// Section Component (Collapsible Accordion)
// ---------------------------------------------------------------------------

function Section({
  title,
  icon: Icon,
  defaultOpen = false,
  onToggle,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => { const next = !open; setOpen(next); onToggle?.(next) }}
        className="w-full flex items-center justify-between p-4 hover:bg-brand-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Image Layout Thumbnail Component
// ---------------------------------------------------------------------------

function LayoutThumbnail({
  layout,
  isStories,
  selected,
  primaryColor,
  onClick,
}: {
  layout: { id: ImageLayout; label: string }
  isStories: boolean
  selected: boolean
  primaryColor: string
  onClick: () => void
}) {
  const w = isStories ? 50 : 50
  const h = isStories ? 70 : 50
  const imgColor = '#6b7280'
  const txtColor = hexToRgba(primaryColor, 0.6)

  function renderLayout() {
    switch (layout.id) {
      case 'background':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} rx="3" fill={imgColor} opacity="0.5" />
            <rect x="8" y={h * 0.3} width={w - 16} height={h * 0.4} rx="2" fill={txtColor} />
          </>
        )
      case 'top':
        return (
          <>
            <rect x="0" y="0" width={w} height={h * 0.45} rx="3" fill={imgColor} />
            <rect x="6" y={h * 0.52} width={w - 12} height={3} rx="1" fill={txtColor} />
            <rect x="10" y={h * 0.62} width={w - 20} height={2} rx="1" fill={txtColor} opacity="0.6" />
            <rect x="12" y={h * 0.72} width={w - 24} height={h * 0.12} rx="2" fill={txtColor} />
          </>
        )
      case 'bottom':
        return (
          <>
            <rect x="6" y={h * 0.08} width={w - 12} height={3} rx="1" fill={txtColor} />
            <rect x="10" y={h * 0.2} width={w - 20} height={2} rx="1" fill={txtColor} opacity="0.6" />
            <rect x="0" y={h * 0.5} width={w} height={h * 0.5} rx="3" fill={imgColor} />
          </>
        )
      case 'left':
        return (
          <>
            <rect x="0" y="0" width={w * 0.45} height={h} rx="3" fill={imgColor} />
            <rect x={w * 0.52} y={h * 0.3} width={w * 0.4} height={3} rx="1" fill={txtColor} />
            <rect x={w * 0.52} y={h * 0.45} width={w * 0.35} height={2} rx="1" fill={txtColor} opacity="0.6" />
            <rect x={w * 0.52} y={h * 0.6} width={w * 0.3} height={h * 0.12} rx="2" fill={txtColor} />
          </>
        )
      case 'right':
        return (
          <>
            <rect x={w * 0.55} y="0" width={w * 0.45} height={h} rx="3" fill={imgColor} />
            <rect x="4" y={h * 0.3} width={w * 0.4} height={3} rx="1" fill={txtColor} />
            <rect x="4" y={h * 0.45} width={w * 0.35} height={2} rx="1" fill={txtColor} opacity="0.6" />
            <rect x="4" y={h * 0.6} width={w * 0.3} height={h * 0.12} rx="2" fill={txtColor} />
          </>
        )
      case 'big-sale':
        return (
          <>
            <rect x="4" y="4" width={w * 0.5} height={3} rx="1" fill={txtColor} />
            <rect x="4" y="10" width={w * 0.4} height={5} rx="1" fill={txtColor} opacity="0.8" />
            <rect x="4" y="18" width={w * 0.35} height={2} rx="1" fill={txtColor} opacity="0.5" />
            <polygon
              points={`${w * 0.4},${h} ${w},${h * 0.35} ${w},${h}`}
              fill={imgColor}
              opacity="0.7"
            />
            <rect x={w * 0.45} y={h * 0.5} width={w * 0.5} height={h * 0.45} rx="3" fill={imgColor} />
          </>
        )
      case 'super-sale':
        return (
          <>
            <rect x="8" y="4" width={w - 16} height={3} rx="1" fill={txtColor} />
            <rect x="12" y="10" width={w - 24} height={2} rx="1" fill={txtColor} opacity="0.6" />
            <circle cx={w / 2} cy={h * 0.5} r={Math.min(w, h) * 0.22} fill={imgColor} />
            <rect x="10" y={h * 0.78} width={w - 20} height={h * 0.1} rx="2" fill={txtColor} />
          </>
        )
      case 'frame':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} rx="3" fill={txtColor} opacity="0.4" />
            <rect x="4" y="4" width={w - 8} height={h - 8} rx="2" fill={imgColor} opacity="0.6" />
            <rect x="10" y={h * 0.35} width={w - 20} height={h * 0.3} rx="2" fill={txtColor} opacity="0.8" />
          </>
        )
      case 'dual-product':
        return (
          <>
            <rect x="0" y="0" width={w} height={h * 0.47} rx="2" fill={imgColor} />
            <rect x="0" y={h * 0.48} width={w} height={h * 0.04} fill={primaryColor} />
            <rect x="0" y={h * 0.53} width={w} height={h * 0.47} rx="2" fill={imgColor} />
          </>
        )
      case 'side-by-side':
        return (
          <>
            <rect x="0" y="0" width={w * 0.48} height={h * 0.55} rx="2" fill={imgColor} />
            <rect x={w * 0.52} y="0" width={w * 0.48} height={h * 0.55} rx="2" fill={imgColor} />
            <rect x="0" y={h * 0.6} width={w} height={h * 0.4} rx="2" fill={primaryColor} opacity="0.3" />
            <rect x={w * 0.15} y={h * 0.78} width={w * 0.7} height={3} rx="1" fill={primaryColor} opacity="0.5" />
          </>
        )
      case 'side-frame':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} rx="2" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.6" />
            <rect x={w * 0.05} y={h * 0.08} width={w * 0.42} height={h * 0.55} rx="2" fill={imgColor} />
            <rect x={w * 0.53} y={h * 0.08} width={w * 0.42} height={h * 0.55} rx="2" fill={imgColor} />
            <rect x={w * 0.15} y={h * 0.82} width={w * 0.7} height={3} rx="1" fill={primaryColor} opacity="0.5" />
          </>
        )
      default:
        return <rect x="0" y="0" width={w} height={h} rx="3" fill={imgColor} opacity="0.3" />
    }
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all duration-150 hover:bg-brand-surface',
        selected ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'
      )}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="rounded bg-brand-dark"
      >
        {renderLayout()}
      </svg>
      <span className="text-[10px] text-gray-400 leading-tight">{layout.label}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Card Preview Component
// ---------------------------------------------------------------------------

function CardPreview({
  config,
  previewRef,
  companyName,
}: {
  config: CardConfig
  previewRef: React.Ref<HTMLDivElement>
  companyName: string
}) {
  const { w, h } = getPreviewDimensions(config.format, config.carouselShape)
  const pal = getActivePalette(config)
  const fontStack = getFontStack(config.fontFamily)
  const posStyles = getTextPositionStyles(config.textPosition)
  const initials = companyName
    ? companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SA'

  // Post type styling
  const postTypeConfig: Record<PostType, { badge: string; gradient: string; icon: string; accentGradient: string }> = {
    promocao: {
      badge: 'PROMOCAO',
      gradient: `linear-gradient(135deg, ${pal.bg} 0%, ${pal.primary}22 50%, ${pal.secondary}33 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`,
    },
    dica: {
      badge: 'DICA',
      gradient: `linear-gradient(135deg, ${pal.bg} 0%, ${pal.primary}15 60%, ${pal.secondary}20 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.primary}cc, ${pal.secondary}cc)`,
    },
    novidade: {
      badge: 'NOVIDADE',
      gradient: `linear-gradient(135deg, ${pal.bg} 0%, ${pal.secondary}25 40%, ${pal.primary}30 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.secondary}, ${pal.primary})`,
    },
    institucional: {
      badge: 'INSTITUCIONAL',
      gradient: `linear-gradient(180deg, ${pal.primary}30 0%, ${pal.bg} 40%, ${pal.bg} 60%, ${pal.primary}20 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`,
    },
    data_comemorativa: {
      badge: 'DATA COMEMORATIVA',
      gradient: `linear-gradient(135deg, ${pal.secondary}20 0%, ${pal.bg} 30%, ${pal.primary}25 70%, ${pal.secondary}30 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.secondary}, ${pal.primary}, ${pal.secondary})`,
    },
  }

  const ptConfig = postTypeConfig[config.postType]

  // Effective image URL: real image or placeholder gradient when layout is selected
  const placeholderBg = `linear-gradient(135deg, ${pal.primary}40 0%, ${pal.secondary}30 50%, ${pal.primary}20 100%)`
  const hasRealImage = config.includeImage && !!config.imageUrl
  const hasImageLayout = config.includeImage // layout should show even without URL (with placeholder)
  const effectiveImageUrl = config.imageUrl || ''
  const effectiveImageUrl2 = config.imageUrl2 || config.imageUrl || ''

  function getImageBg(url?: string): React.CSSProperties {
    if (url) {
      return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    }
    return { background: placeholderBg }
  }

  // Image rendering helpers
  function renderImageBackground() {
    if (!hasImageLayout) return null
    const layout = config.imageLayout
    const baseImageStyle: React.CSSProperties = hasRealImage
      ? { ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
      : { background: placeholderBg }

    if (layout === 'background') {
      return (
        <div
          style={{
            ...baseImageStyle,
            position: 'absolute',
            inset: 0,
            opacity: config.imageOpacity / 100,
            filter: `blur(${config.imageBlur}px)`,
          }}
        />
      )
    }
    if (layout === 'frame') {
      return (
        <div
          style={{
            ...baseImageStyle,
            position: 'absolute',
            inset: 10,
            borderRadius: 8,
            opacity: config.imageOpacity / 100,
            filter: `blur(${config.imageBlur}px)`,
          }}
        />
      )
    }
    return null
  }

  function renderImageSection() {
    if (!hasImageLayout) return null
    const layout = config.imageLayout
    const baseStyle: React.CSSProperties = {
      ...(hasRealImage
        ? { ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
        : { background: placeholderBg }),
      opacity: config.imageOpacity / 100,
    }

    if (layout === 'top') {
      return <div style={{ ...baseStyle, width: '100%', height: '45%', flexShrink: 0 }} />
    }
    if (layout === 'bottom') {
      return <div style={{ ...baseStyle, width: '100%', height: '45%', flexShrink: 0, marginTop: 'auto' }} />
    }
    if (layout === 'left' || layout === 'right') {
      return <div style={{ ...baseStyle, width: '42%', height: '100%', flexShrink: 0 }} />
    }
    if (layout === 'super-sale') {
      return (
        <div
          style={{
            width: Math.min(w, h) * 0.45,
            height: Math.min(w, h) * 0.45,
            borderRadius: '50%',
            ...baseStyle,
            flexShrink: 0,
            border: `3px solid ${pal.primary}`,
          }}
        />
      )
    }
    return null
  }

  // Determine flex direction for layout
  function getLayoutDirection(): React.CSSProperties['flexDirection'] {
    const layout = config.imageLayout
    if (!hasImageLayout) return 'column'
    if (layout === 'left') return 'row'
    if (layout === 'right') return 'row-reverse'
    if (layout === 'top') return 'column'
    if (layout === 'bottom') return 'column'
    return 'column'
  }

  // Does image go as side panel
  function isSideLayout() {
    return hasImageLayout && (config.imageLayout === 'left' || config.imageLayout === 'right')
  }

  // Big Sale layout
  function isBigSale() {
    return hasImageLayout && config.imageLayout === 'big-sale'
  }

  // Super Sale layout
  function isSuperSale() {
    return hasImageLayout && config.imageLayout === 'super-sale'
  }

  // Frame layout
  function isFrameLayout() {
    return hasImageLayout && config.imageLayout === 'frame'
  }

  // Dual Product layout
  function isDualProduct() {
    return hasImageLayout && config.imageLayout === 'dual-product'
  }

  // Background layout
  function isBgLayout() {
    return hasImageLayout && config.imageLayout === 'background'
  }

  // Logo
  function renderLogo() {
    if (!config.display.showLogo || config.logoPosition === 'hidden') return null
    const posMap: Record<string, React.CSSProperties> = {
      'top-left': { top: 12, left: 12 },
      'top-right': { top: 12, right: 12 },
      'top-center': { top: 12, left: '50%', transform: 'translateX(-50%)' },
    }
    return (
      <div
        style={{
          position: 'absolute',
          ...posMap[config.logoPosition],
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: ptConfig.accentGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          fontFamily: fontStack,
          zIndex: 10,
          boxShadow: `0 2px 8px ${pal.primary}40`,
        }}
      >
        {initials}
      </div>
    )
  }

  // Post type badge (inline – rendered inside text flow)
  function renderTypeBadge() {
    if (config.typeBadgePosition !== 'inline') return null
    if (!config.productName && !config.headline && !config.extraText) return null
    return (
      <div
        style={{
          display: 'inline-block',
          background: ptConfig.accentGradient,
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontFamily: fontStack,
          marginBottom: 8,
        }}
      >
        {ptConfig.badge}
      </div>
    )
  }

  // Post type badge (floating – absolutely positioned like logo)
  function renderFloatingTypeBadge() {
    if (config.typeBadgePosition === 'inline') return null
    if (!config.productName && !config.headline && !config.extraText) return null
    const posMap: Record<string, React.CSSProperties> = {
      'top-left': { top: config.display.showLogo && config.logoPosition === 'top-left' ? 52 : 12, left: 12 },
      'top-right': { top: config.display.showLogo && config.logoPosition === 'top-right' ? 52 : 12, right: 12 },
      'top-center': { top: config.display.showLogo && config.logoPosition === 'top-center' ? 52 : 12, left: '50%', transform: 'translateX(-50%)' },
    }
    return (
      <div
        style={{
          position: 'absolute',
          ...posMap[config.typeBadgePosition],
          display: 'inline-block',
          background: ptConfig.accentGradient,
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 20,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontFamily: fontStack,
          zIndex: 10,
        }}
      >
        {ptConfig.badge}
      </div>
    )
  }

  // Text content block
  function renderTextContent(maxWidth?: string) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: posStyles.alignItems,
          textAlign: posStyles.textAlign,
          gap: 6,
          maxWidth: maxWidth || '100%',
          zIndex: 5,
        }}
      >
        {renderTypeBadge()}

        {config.headline && (
          <div
            style={{
              fontSize: config.fontSizes.subtitle * 0.75,
              fontWeight: 600,
              color: hexToRgba(config.titleColor, 0.7),
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontFamily: fontStack,
            }}
          >
            {config.headline}
          </div>
        )}

        <div
          style={{
            fontSize: config.fontSizes.title,
            fontWeight: 900,
            color: config.titleColor,
            lineHeight: 1.1,
            fontFamily: fontStack,
          }}
        >
          {config.productName}
        </div>

        {config.extraText && (
          <div
            style={{
              fontSize: config.fontSizes.subtitle,
              color: config.textColor,
              opacity: 0.85,
              lineHeight: 1.4,
              fontFamily: fontStack,
              marginTop: 4,
            }}
          >
            {config.extraText}
          </div>
        )}

        {config.postType === 'promocao' && config.display.showPrice && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: posStyles.textAlign === 'center' ? 'center' : posStyles.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
            {config.display.showOriginalPrice && config.originalPrice && (
              <span
                style={{
                  fontSize: config.fontSizes.price * 0.5,
                  color: config.textColor,
                  opacity: 0.5,
                  textDecoration: 'line-through',
                  fontFamily: fontStack,
                }}
              >
                R$ {config.originalPrice}
              </span>
            )}
            {config.promoPrice && (
              <span
                style={{
                  fontSize: config.fontSizes.price,
                  fontWeight: 900,
                  color: pal.secondary,
                  fontFamily: fontStack,
                  textShadow: `0 2px 10px ${pal.secondary}40`,
                }}
              >
                R$ {config.promoPrice}
              </span>
            )}
          </div>
        )}

        {config.display.showCta && config.cta && (
          <div
            style={{
              marginTop: 12,
              background: ptConfig.accentGradient,
              color: '#fff',
              fontSize: config.fontSizes.cta,
              fontWeight: 700,
              padding: '10px 28px',
              borderRadius: 30,
              fontFamily: fontStack,
              boxShadow: `0 4px 15px ${pal.primary}50`,
              display: 'inline-block',
              letterSpacing: 0.5,
            }}
          >
            {config.cta}
          </div>
        )}
      </div>
    )
  }

  // Decorative shapes
  function renderDecorations() {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -w * 0.15,
            right: -w * 0.1,
            width: w * 0.5,
            height: w * 0.5,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${pal.primary}20, transparent 70%)`,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -h * 0.1,
            left: -w * 0.15,
            width: w * 0.6,
            height: w * 0.6,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${pal.secondary}15, transparent 70%)`,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: w * 0.8,
            height: h * 0.8,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${pal.primary}08, transparent 60%)`,
            zIndex: 1,
          }}
        />
      </>
    )
  }

  // ---- Big Sale Layout ----
  if (isBigSale()) {
    return (
      <div
        ref={previewRef}
        id="card-preview"
        style={{
          width: w,
          height: h,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          background: ptConfig.gradient,
          fontFamily: fontStack,
        }}
      >
        {renderDecorations()}
        {renderLogo()}
        {renderFloatingTypeBadge()}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '55%',
            height: '55%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: posStyles.justifyContent,
            alignItems: 'flex-start',
            padding: 24,
            zIndex: 5,
          }}
        >
          {renderTypeBadge()}
          {config.headline && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.75, fontWeight: 600, color: hexToRgba(config.titleColor, 0.7), textTransform: 'uppercase', letterSpacing: 2, fontFamily: fontStack, marginBottom: 4 }}>
              {config.headline}
            </div>
          )}
          <div style={{ fontSize: config.fontSizes.title * 1.1, fontWeight: 900, color: config.titleColor, lineHeight: 1.05, fontFamily: fontStack }}>
            {config.productName}
          </div>
          {config.postType === 'promocao' && config.display.showPrice && config.promoPrice && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {config.display.showOriginalPrice && config.originalPrice && (
                <span style={{ fontSize: config.fontSizes.price * 0.45, color: config.textColor, opacity: 0.5, textDecoration: 'line-through', fontFamily: fontStack }}>R$ {config.originalPrice}</span>
              )}
              <span style={{ fontSize: config.fontSizes.price * 0.9, fontWeight: 900, color: pal.secondary, fontFamily: fontStack }}>R$ {config.promoPrice}</span>
            </div>
          )}
        </div>
        {/* Diagonal image */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '65%',
            height: '65%',
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />
        {/* CTA bottom left */}
        {config.display.showCta && config.cta && (
          <div style={{ position: 'absolute', bottom: 20, left: 24, zIndex: 10 }}>
            <div style={{ background: ptConfig.accentGradient, color: '#fff', fontSize: config.fontSizes.cta, fontWeight: 700, padding: '8px 22px', borderRadius: 30, fontFamily: fontStack, boxShadow: `0 4px 15px ${pal.primary}50` }}>
              {config.cta}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- Super Sale Layout ----
  if (isSuperSale()) {
    return (
      <div
        ref={previewRef}
        id="card-preview"
        style={{
          width: w,
          height: h,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          background: ptConfig.gradient,
          fontFamily: fontStack,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 24,
        }}
      >
        {renderDecorations()}
        {renderLogo()}
        {renderFloatingTypeBadge()}
        <div style={{ zIndex: 5, textAlign: 'center', marginTop: config.display.showLogo ? 40 : 8 }}>
          {renderTypeBadge()}
          {config.headline && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.75, fontWeight: 600, color: hexToRgba(config.titleColor, 0.7), textTransform: 'uppercase', letterSpacing: 2, fontFamily: fontStack, marginBottom: 4 }}>
              {config.headline}
            </div>
          )}
          <div style={{ fontSize: config.fontSizes.title, fontWeight: 900, color: config.titleColor, lineHeight: 1.1, fontFamily: fontStack }}>
            {config.productName}
          </div>
          {config.extraText && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.85, color: config.textColor, opacity: 0.8, marginTop: 4, fontFamily: fontStack }}>{config.extraText}</div>
          )}
        </div>
        {/* Circle image */}
        <div
          style={{
            width: Math.min(w, h) * 0.42,
            height: Math.min(w, h) * 0.42,
            borderRadius: '50%',
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            border: `4px solid ${pal.primary}`,
            boxShadow: `0 8px 30px ${pal.primary}30`,
            flexShrink: 0,
            zIndex: 5,
          }}
        />
        <div style={{ zIndex: 5, textAlign: 'center' }}>
          {config.postType === 'promocao' && config.display.showPrice && config.promoPrice && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              {config.display.showOriginalPrice && config.originalPrice && (
                <span style={{ fontSize: config.fontSizes.price * 0.45, color: config.textColor, opacity: 0.5, textDecoration: 'line-through', fontFamily: fontStack }}>R$ {config.originalPrice}</span>
              )}
              <span style={{ fontSize: config.fontSizes.price, fontWeight: 900, color: pal.secondary, fontFamily: fontStack }}>R$ {config.promoPrice}</span>
            </div>
          )}
          {config.display.showCta && config.cta && (
            <div style={{ background: ptConfig.accentGradient, color: '#fff', fontSize: config.fontSizes.cta, fontWeight: 700, padding: '10px 28px', borderRadius: 30, fontFamily: fontStack, boxShadow: `0 4px 15px ${pal.primary}50`, display: 'inline-block' }}>
              {config.cta}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- Frame Layout ----
  if (isFrameLayout()) {
    return (
      <div
        ref={previewRef}
        id="card-preview"
        style={{
          width: w,
          height: h,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          background: ptConfig.accentGradient,
          fontFamily: fontStack,
        }}
      >
        {renderLogo()}
        {renderFloatingTypeBadge()}
        {/* Full image with frame */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: 8,
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            filter: `blur(${config.imageBlur}px)`,
          }}
        />
        {/* Overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: 8,
            background: `${pal.bg}88`,
            zIndex: 3,
          }}
        />
        {/* Text content centered */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: posStyles.justifyContent,
            alignItems: posStyles.alignItems,
            padding: 28,
            zIndex: 5,
          }}
        >
          {renderTextContent()}
        </div>
      </div>
    )
  }

  // ---- Dual Product Layout ----
  if (isDualProduct()) {
    const img1 = config.imageUrl
    const img2 = config.imageUrl2 || config.imageUrl
    return (
      <div ref={previewRef} id="card-preview" style={{ width: w, height: h, position: 'relative', overflow: 'hidden', borderRadius: 12, background: pal.bg, fontFamily: fontStack, display: 'flex', flexDirection: 'column' }}>
        {renderLogo()}
        {renderFloatingTypeBadge()}
        {/* Product 1 - Top */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, ...(img1 ? { backgroundImage: `url(${img1})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 5 }}>
            <div style={{ fontSize: config.fontSizes.title * 0.8, fontWeight: 900, color: '#fff', fontFamily: fontStack }}>{config.productName}</div>
            {config.postType === 'promocao' && config.display.showPrice && config.originalPrice && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: config.fontSizes.price * 0.4, color: '#fff', opacity: 0.6, textDecoration: 'line-through', fontFamily: fontStack }}>R$ {config.originalPrice}</span>
                <span style={{ fontSize: config.fontSizes.price * 0.7, fontWeight: 900, color: pal.secondary, fontFamily: fontStack }}>R$ {config.promoPrice}</span>
              </div>
            )}
          </div>
        </div>
        {/* Separator */}
        <div style={{ height: 4, background: ptConfig.accentGradient, flexShrink: 0 }} />
        {/* Product 2 - Bottom */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, ...(img2 ? { backgroundImage: `url(${img2})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 5 }}>
            <div style={{ fontSize: config.fontSizes.title * 0.8, fontWeight: 900, color: '#fff', fontFamily: fontStack }}>{config.headline || 'Produto 2'}</div>
            {config.display.showCta && config.cta && (
              <div style={{ marginTop: 8, background: ptConfig.accentGradient, color: '#fff', fontSize: config.fontSizes.cta, fontWeight: 700, padding: '6px 18px', borderRadius: 20, display: 'inline-block', fontFamily: fontStack }}>{config.cta}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---- Side by Side Layout ----
  if (hasImageLayout && config.imageLayout === 'side-by-side') {
    const img1 = config.imageUrl
    const img2 = config.imageUrl2 || config.imageUrl
    return (
      <div ref={previewRef} id="card-preview" style={{ width: w, height: h, position: 'relative', overflow: 'hidden', borderRadius: 12, background: ptConfig.gradient, fontFamily: fontStack, display: 'flex', flexDirection: 'column' }}>
        {renderLogo()}
        {renderFloatingTypeBadge()}
        {renderDecorations()}
        {/* Two images side by side */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 12px 0', flex: '0 0 50%' }}>
          <div style={{ flex: 1, borderRadius: 8, ...(img1 ? { backgroundImage: `url(${img1})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100 }} />
          <div style={{ flex: 1, borderRadius: 8, ...(img2 ? { backgroundImage: `url(${img2})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100 }} />
        </div>
        {/* Text content below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: posStyles.justifyContent, alignItems: posStyles.alignItems, textAlign: posStyles.textAlign as any, padding: '12px 16px 16px', zIndex: 5 }}>
          {renderTypeBadge()}
          {config.headline && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.75, fontWeight: 600, color: hexToRgba(config.titleColor, 0.7), textTransform: 'uppercase', letterSpacing: 2, fontFamily: fontStack, marginBottom: 2 }}>{config.headline}</div>
          )}
          <div style={{ fontSize: config.fontSizes.title * 0.9, fontWeight: 900, color: config.titleColor, lineHeight: 1.1, fontFamily: fontStack }}>{config.productName}</div>
          {config.extraText && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.85, color: config.textColor, opacity: 0.8, marginTop: 4, fontFamily: fontStack, lineHeight: 1.3 }}>{config.extraText}</div>
          )}
          {config.postType === 'promocao' && config.display.showPrice && config.promoPrice && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap', justifyContent: posStyles.textAlign === 'center' ? 'center' : posStyles.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
              {config.display.showOriginalPrice && config.originalPrice && (
                <span style={{ fontSize: config.fontSizes.price * 0.45, color: config.textColor, opacity: 0.5, textDecoration: 'line-through', fontFamily: fontStack }}>R$ {config.originalPrice}</span>
              )}
              <span style={{ fontSize: config.fontSizes.price * 0.8, fontWeight: 900, color: pal.secondary, fontFamily: fontStack }}>R$ {config.promoPrice}</span>
            </div>
          )}
          {config.display.showCta && config.cta && (
            <div style={{ marginTop: 10, background: ptConfig.accentGradient, color: '#fff', fontSize: config.fontSizes.cta, fontWeight: 700, padding: '8px 22px', borderRadius: 30, display: 'inline-block', fontFamily: fontStack, boxShadow: `0 4px 15px ${pal.primary}50` }}>{config.cta}</div>
          )}
        </div>
      </div>
    )
  }

  // ---- Side Frame Layout ----
  if (hasImageLayout && config.imageLayout === 'side-frame') {
    const img1 = config.imageUrl
    const img2 = config.imageUrl2 || config.imageUrl
    return (
      <div ref={previewRef} id="card-preview" style={{ width: w, height: h, position: 'relative', overflow: 'hidden', borderRadius: 12, background: pal.bg, fontFamily: fontStack }}>
        {renderLogo()}
        {renderFloatingTypeBadge()}
        {/* Colored frame border */}
        <div style={{ position: 'absolute', inset: 0, border: `6px solid ${pal.primary}`, borderRadius: 12, zIndex: 8, pointerEvents: 'none' }} />
        {/* Inner accent line */}
        <div style={{ position: 'absolute', inset: 10, border: `2px solid ${pal.secondary}40`, borderRadius: 8, zIndex: 8, pointerEvents: 'none' }} />
        {/* Two images side by side with frame */}
        <div style={{ display: 'flex', gap: 6, padding: '20px 18px', height: '55%' }}>
          <div style={{ flex: 1, borderRadius: 8, ...(img1 ? { backgroundImage: `url(${img1})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100, border: `2px solid ${pal.primary}30` }} />
          <div style={{ flex: 1, borderRadius: 8, ...(img2 ? { backgroundImage: `url(${img2})` } : { background: placeholderBg }), backgroundSize: 'cover', backgroundPosition: 'center', opacity: config.imageOpacity / 100, border: `2px solid ${pal.primary}30` }} />
        </div>
        {/* Text below images */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: posStyles.justifyContent, alignItems: posStyles.alignItems, textAlign: posStyles.textAlign as any, flex: 1, zIndex: 5 }}>
          {renderTypeBadge()}
          <div style={{ fontSize: config.fontSizes.title * 0.85, fontWeight: 900, color: config.titleColor, lineHeight: 1.1, fontFamily: fontStack }}>{config.productName}</div>
          {config.extraText && (
            <div style={{ fontSize: config.fontSizes.subtitle * 0.85, color: config.textColor, opacity: 0.8, marginTop: 6, fontFamily: fontStack, lineHeight: 1.3 }}>{config.extraText}</div>
          )}
          {config.postType === 'promocao' && config.display.showPrice && config.promoPrice && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap', justifyContent: posStyles.textAlign === 'center' ? 'center' : 'flex-start' }}>
              {config.display.showOriginalPrice && config.originalPrice && (
                <span style={{ fontSize: config.fontSizes.price * 0.45, color: config.textColor, opacity: 0.5, textDecoration: 'line-through', fontFamily: fontStack }}>R$ {config.originalPrice}</span>
              )}
              <span style={{ fontSize: config.fontSizes.price * 0.75, fontWeight: 900, color: pal.secondary, fontFamily: fontStack }}>R$ {config.promoPrice}</span>
            </div>
          )}
          {config.display.showCta && config.cta && (
            <div style={{ marginTop: 10, background: ptConfig.accentGradient, color: '#fff', fontSize: config.fontSizes.cta, fontWeight: 700, padding: '8px 20px', borderRadius: 30, display: 'inline-block', fontFamily: fontStack }}>{config.cta}</div>
          )}
        </div>
      </div>
    )
  }

  // ---- Side Layouts (left/right) ----
  if (isSideLayout()) {
    const isLeft = config.imageLayout === 'left'
    return (
      <div
        ref={previewRef}
        id="card-preview"
        style={{
          width: w,
          height: h,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          background: ptConfig.gradient,
          fontFamily: fontStack,
          display: 'flex',
          flexDirection: isLeft ? 'row' : 'row-reverse',
        }}
      >
        {renderDecorations()}
        {renderLogo()}
        {renderFloatingTypeBadge()}
        {/* Image side */}
        <div
          style={{
            width: '45%',
            height: '100%',
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            flexShrink: 0,
          }}
        />
        {/* Text side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: posStyles.justifyContent,
            alignItems: posStyles.alignItems,
            padding: 20,
            zIndex: 5,
          }}
        >
          {renderTextContent()}
        </div>
      </div>
    )
  }

  // ---- Default & Background Layout ----
  const isTopImgLayout = config.includeImage && config.imageUrl && config.imageLayout === 'top'
  const isBottomImgLayout = config.includeImage && config.imageUrl && config.imageLayout === 'bottom'

  return (
    <div
      ref={previewRef}
      id="card-preview"
      style={{
        width: w,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: ptConfig.gradient,
        fontFamily: fontStack,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {renderDecorations()}
      {isBgLayout() && renderImageBackground()}
      {isBgLayout() && (
        <div style={{ position: 'absolute', inset: 0, background: `${pal.bg}99`, zIndex: 2 }} />
      )}
      {renderLogo()}
        {renderFloatingTypeBadge()}

      {isTopImgLayout && (
        <div
          style={{
            width: '100%',
            height: '45%',
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            flexShrink: 0,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: posStyles.justifyContent,
          alignItems: posStyles.alignItems,
          padding: 28,
          zIndex: 5,
        }}
      >
        {renderTextContent()}
      </div>

      {isBottomImgLayout && (
        <div
          style={{
            width: '100%',
            height: '45%',
            ...(config.imageUrl ? { backgroundImage: `url(${config.imageUrl})` } : { background: placeholderBg }),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.imageOpacity / 100,
            flexShrink: 0,
          }}
        />
      )}
    </div>
  )
}

// ===========================================================================
// PAGE COMPONENT
// ===========================================================================

export default function GenerateCardPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>}>
      <GenerateCardPage />
    </Suspense>
  )
}

function GenerateCardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const previewRef = useRef<HTMLDivElement>(null)

  // ---------- State ----------
  const [config, setConfig] = useState<CardConfig>({ ...DEFAULT_CONFIG })
  const [generating, setGenerating] = useState(false)
  const [savedCardId, setSavedCardId] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [dirtyAfterApprove, setDirtyAfterApprove] = useState(false)
  const [editLoaded, setEditLoaded] = useState(false)
  const [approving, setApproving] = useState(false)
  const [galleryCards, setGalleryCards] = useState<GalleryCard[]>([])
  const [loadingGallery, setLoadingGallery] = useState(true)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveCardName, setApproveCardName] = useState('')
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiReferenceImage, setAiReferenceImage] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const aiFileInputRef = useRef<HTMLInputElement>(null)

  // ---------- Load card for editing (from ?edit=ID) ----------
  const searchParams = useSearchParams()
  const editCardId = searchParams.get('edit')

  useEffect(() => {
    if (!editCardId || editLoaded) return
    setEditLoaded(true)
    async function loadCardForEdit() {
      try {
        const data = await api.get<any>(`/api/cards/${editCardId}`)
        const card = data.card || data
        setConfig((prev) => ({
          ...prev,
          format: card.format || prev.format,
          postType: card.post_type || prev.postType,
          productName: card.product_name || '',
          headline: card.headline || '',
          originalPrice: card.price_original ? String(card.price_original) : '',
          promoPrice: card.price_promo ? String(card.price_promo) : '',
          extraText: card.subtext || '',
          cta: card.cta || prev.cta,
          cardName: card.headline || generateCardName(card.format, card.post_type, card.product_name || ''),
        }))
        setSavedCardId(card._id || editCardId)
        setApproved(card.status === 'approved')
        toast.success('Card carregado para edicao')
      } catch {
        toast.error('Erro ao carregar card para edicao')
      }
    }
    loadCardForEdit()
  }, [editCardId, editLoaded])

  // ---------- Media library ----------
  const { items: mediaItems, folders: mediaFolders } = useMediaStore()
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'image1' | 'image2'>('image1')
  const [mediaFolderFilter, setMediaFolderFilter] = useState<string | null>(null)

  // ---------- Config updater ----------
  const updateConfig = useCallback(<K extends keyof CardConfig>(key: K, value: CardConfig[K]) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-generate card name when relevant fields change
      if (key === 'format' || key === 'postType' || key === 'productName') {
        const f = key === 'format' ? (value as Format) : prev.format
        const pt = key === 'postType' ? (value as PostType) : prev.postType
        const pn = key === 'productName' ? (value as string) : prev.productName
        if (!prev.cardName || prev.cardName === generateCardName(prev.format, prev.postType, prev.productName)) {
          next.cardName = generateCardName(f, pt, pn)
        }
      }
      return next
    })
    setDirtyAfterApprove(true)
  }, [])

  const updateDisplay = useCallback((key: keyof CardConfig['display'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      display: { ...prev.display, [key]: value },
    }))
    setDirtyAfterApprove(true)
  }, [])

  const updateFontSize = useCallback((key: keyof CardConfig['fontSizes'], value: number) => {
    setConfig((prev) => ({
      ...prev,
      fontSizes: { ...prev.fontSizes, [key]: value },
    }))
  }, [])

  const updateTextPosition = useCallback((key: keyof CardConfig['textPosition'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      textPosition: { ...prev.textPosition, [key]: value },
    }))
  }, [])

  const updateCustomColor = useCallback((key: keyof CardConfig['customColors'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      customColors: { ...prev.customColors, [key]: value },
    }))
  }, [])

  // ---------- Auto-fill defaults on mount (when not editing) ----------
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)
  useEffect(() => {
    if (editCardId || defaultsLoaded) return
    setDefaultsLoaded(true)
    const defaults = getSmartDefaults(user?.niche, config.postType)
    setConfig((prev) => ({
      ...prev,
      ...defaults,
      cardName: generateCardName(prev.format, prev.postType, defaults.productName || ''),
    }))
  }, [editCardId, defaultsLoaded, user?.niche, config.postType])

  // ---------- Refresh defaults when format changes (if not editing) ----------
  const prevFormatRef = useRef(config.format)
  useEffect(() => {
    if (editCardId) return
    if (prevFormatRef.current === config.format) return
    prevFormatRef.current = config.format
    const defaults = getSmartDefaults(user?.niche, config.postType)
    setConfig((prev) => ({
      ...prev,
      ...defaults,
      format: prev.format,
      cardName: generateCardName(prev.format, prev.postType, defaults.productName || ''),
    }))
  }, [config.format, editCardId, user?.niche, config.postType])

  // ---------- Fetch gallery ----------
  useEffect(() => {
    async function fetchGallery() {
      try {
        const data = await api.get<{ cards: GalleryCard[] }>('/api/cards?limit=8')
        setGalleryCards(data.cards || [])
      } catch {
        // silent - gallery is non-critical
      } finally {
        setLoadingGallery(false)
      }
    }
    fetchGallery()
  }, [savedCardId])

  // ---------- Open AI modal ----------
  const handleOpenAiModal = useCallback(() => {
    const dimensions = config.format === 'stories' ? '1080x1920 (vertical, story)' :
                       config.format === 'carousel' ? '1080x1080 (quadrado, carrossel)' :
                       '1080x1080 (quadrado, feed)'
    const defaultPrompt = `Crie uma imagem profissional para post de ${config.format === 'stories' ? 'story do Instagram' : 'feed do Instagram'}.
Dimensoes: ${dimensions}
Produto: ${config.productName || 'produto'}
Estilo: moderno, clean, com cores vibrantes
${config.headline ? `Titulo: ${config.headline}` : ''}
${config.extraText ? `Texto: ${config.extraText}` : ''}

A imagem deve ser visualmente atrativa para redes sociais.`
    setAiPrompt(defaultPrompt)
    setAiReferenceImage(null)
    setShowAiModal(true)
  }, [config])

  // ---------- Handle AI reference image upload ----------
  const handleAiImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (max 10MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAiReferenceImage(reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  // ---------- Generate image with Gemini ----------
  const handleGenerateImage = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite um prompt')
      return
    }

    setGeneratingImage(true)
    try {
      const payload: { prompt: string; referenceImage?: string } = { prompt: aiPrompt }
      if (aiReferenceImage) {
        payload.referenceImage = aiReferenceImage
      }

      const result = await api.post<{ image: string }>('/api/cards/generate-image', payload)

      if (result.image) {
        setConfig((prev) => ({
          ...prev,
          includeImage: true,
          imageUrl: result.image,
          imageLayout: 'background',
          imageOpacity: 100,
          imageBlur: 0,
        }))
        toast.success('Imagem gerada com sucesso!')
        setShowAiModal(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar imagem')
    } finally {
      setGeneratingImage(false)
    }
  }, [aiPrompt, aiReferenceImage])

  // ---------- Save card to API (draft) ----------
  const handleSaveDraft = useCallback(async () => {
    setGenerating(true)
    setSavedCardId(null)
    setApproved(false)
    try {
      const result = await api.post<any>('/api/cards/generate', {
        format: config.format,
        post_type: config.postType,
        product_name: config.productName,
        headline: config.headline,
        price_original: config.originalPrice ? Number(String(config.originalPrice).replace(',', '.')) : undefined,
        price_promo: config.promoPrice ? Number(String(config.promoPrice).replace(',', '.')) : undefined,
        subtext: config.extraText,
        cta: config.cta,
      })
      const cardId = result._id || result.card?._id || result.card?.id || result.id
      if (cardId) setSavedCardId(cardId)
    } catch (err: any) {
      console.error('[cards] Erro ao salvar draft:', err)
      toast.error(err.message || 'Erro ao salvar card. Verifique sua conexao.')
    } finally {
      setGenerating(false)
    }
  }, [config])

  // ---------- Approve ----------
  const handleApprove = useCallback(async (cardName: string) => {
    setApproving(true)
    setShowApproveModal(false)
    try {
      // Save card first if not saved yet
      let cardId = savedCardId
      if (!cardId) {
        const result = await api.post<any>('/api/cards/generate', {
          format: config.format,
          post_type: config.postType,
          product_name: config.productName,
          headline: cardName || config.headline,
          price_original: config.originalPrice ? Number(String(config.originalPrice).replace(',', '.')) : undefined,
          price_promo: config.promoPrice ? Number(String(config.promoPrice).replace(',', '.')) : undefined,
          subtext: config.extraText,
          cta: config.cta,
        })
        cardId = result._id || result.card?._id || result.id
        if (cardId) setSavedCardId(cardId)
      }
      if (!cardId) {
        toast.error('Erro ao salvar card')
        return
      }

      // Capture preview image as data URL
      let imageDataUrl: string | undefined
      if (previewRef.current) {
        try {
          imageDataUrl = await toPng(previewRef.current, { pixelRatio: 1, cacheBust: true })
        } catch { /* ignore capture errors */ }
      }

      await api.patch(`/api/cards/${cardId}/approve`, {
        generated_image_url: imageDataUrl,
        headline: cardName,
      })
      setApproved(true)
      setDirtyAfterApprove(false)
      toast.success(`Card "${cardName}" aprovado!`)
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch'
        ? 'Erro ao salvar. Verifique se a API esta rodando.'
        : (err.message || 'Erro ao aprovar. Verifique se a API esta rodando.')
      toast.error(msg)
    } finally {
      setApproving(false)
    }
  }, [savedCardId, config])

  // ---------- Update (after editing an approved card) ----------
  const handleUpdate = useCallback(async () => {
    if (!savedCardId) return
    setApproving(true)
    try {
      // Capture updated preview image
      let imageDataUrl: string | undefined
      if (previewRef.current) {
        try {
          imageDataUrl = await toPng(previewRef.current, { pixelRatio: 1, cacheBust: true })
        } catch { /* ignore capture errors */ }
      }

      await api.patch(`/api/cards/${savedCardId}`, {
        format: config.format,
        post_type: config.postType,
        product_name: config.productName,
        headline: config.headline,
        price_original: config.originalPrice ? Number(String(config.originalPrice).replace(',', '.')) : 0,
        price_promo: config.promoPrice ? Number(String(config.promoPrice).replace(',', '.')) : 0,
        subtext: config.extraText,
        cta: config.cta,
        generated_image_url: imageDataUrl || undefined,
      })
      setDirtyAfterApprove(false)
      toast.success('Card atualizado!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar card')
    } finally {
      setApproving(false)
    }
  }, [savedCardId, config])

  // ---------- Download PNG ----------
  const handleDownloadPng = useCallback(async () => {
    if (!previewRef.current) return
    try {
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `${config.cardName || 'card'}.png`
      link.href = dataUrl
      link.click()
      toast.success('PNG baixado!')
    } catch {
      toast.error('Erro ao gerar PNG')
    }
  }, [config.cardName])

  // ---------- Copy caption ----------
  const handleCopyCaption = useCallback(() => {
    const parts: string[] = []
    if (config.headline) parts.push(config.headline)
    if (config.productName) parts.push(config.productName)
    if (config.extraText) parts.push(config.extraText)
    if (config.postType === 'promocao' && config.promoPrice) {
      if (config.originalPrice) parts.push(`De R$ ${config.originalPrice} por R$ ${config.promoPrice}`)
      else parts.push(`R$ ${config.promoPrice}`)
    }
    if (config.cta) parts.push(config.cta)
    const caption = parts.join('\n\n')
    navigator.clipboard.writeText(caption)
    toast.success('Legenda copiada!')
  }, [config])

  // ---------- Schedule ----------
  const handleSchedule = useCallback(() => {
    if (savedCardId) {
      router.push(`/app/calendar?card=${savedCardId}`)
    } else {
      toast.error('Gere o card primeiro para poder agendar')
    }
  }, [savedCardId, router])

  // ---------- Load gallery card into editor ----------
  const loadGalleryCard = useCallback((card: GalleryCard) => {
    setConfig((prev) => ({
      ...prev,
      format: card.format || prev.format,
      postType: card.post_type || prev.postType,
      productName: card.product_name || '',
      headline: card.headline || '',
      cardName: card.card_name || '',
    }))
    setSavedCardId(card._id || card.id || null)
    setApproved(card.status === 'approved')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ---------- Derived ----------
  const pal = getActivePalette(config)
  const companyName = user?.companyName || user?.name || 'Soma AI'
  const isStories = config.format === 'stories'
  const isCarousel = config.format === 'carousel'
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Roboto:wght@400;500;700;900&family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@400;700;900&family=Oswald:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Bebas+Neue&family=Raleway:wght@400;600;700;900&family=Lato:wght@400;700;900&family=Open+Sans:wght@400;600;700&display=swap');
      `}</style>

      <div className="min-h-screen bg-brand-dark">
        {/* ================================================================= */}
        {/* TOP BAR */}
        {/* ================================================================= */}
        <div className="sticky top-0 z-30 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Generate button */}
              <Button
                onClick={handleOpenAiModal}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/25 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Gerar com IA
              </Button>

              {/* Divider */}
              <div className="h-8 w-px bg-brand-border hidden sm:block" />

              {/* Format pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 mr-1 hidden sm:inline">Formato:</span>
                {FORMAT_OPTIONS.map((f) => {
                  const Icon = f.icon
                  return (
                    <button
                      key={f.id}
                      onClick={() => updateConfig('format', f.id)}
                      title={f.hint}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                        config.format === f.id
                          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                          : 'bg-brand-surface text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-brand-border'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{f.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-brand-border hidden sm:block" />

              {/* Post type select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">Tipo:</span>
                <Select
                  value={config.postType}
                  onValueChange={(v) => updateConfig('postType', v as PostType)}
                >
                  <SelectTrigger className="w-[170px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800 gap-1.5 h-8 text-xs"
                onClick={() => {
                  setConfig((prev) => ({
                    ...DEFAULT_CONFIG,
                    format: prev.format,
                    postType: prev.postType,
                    productName: '',
                    headline: '',
                    originalPrice: '',
                    promoPrice: '',
                    extraText: '',
                    cta: '',
                    ctaUrl: '',
                    cardName: '',
                    display: { showLogo: false, showCta: false, showPrice: false, showOriginalPrice: false },
                    includeImage: prev.includeImage,
                    imageUrl: prev.imageUrl,
                    imageUrl2: prev.imageUrl2,
                    imageLayout: prev.imageLayout,
                    imageOpacity: prev.imageOpacity,
                    imageBlur: prev.imageBlur,
                  }))
                  setSavedCardId(null)
                  setApproved(false)
                  setDirtyAfterApprove(false)
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CAROUSEL TOP PREVIEW (only in carousel mode) */}
        {/* ================================================================= */}
        {isCarousel && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-300">
                  Preview do Carrossel ({config.carouselSlides} slides)
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {config.carouselShape === 'vertical' ? 'Vertical 4:5' : 'Quadrado 1:1'} - {getDimensionLabel(config.format, config.carouselShape)}
                </Badge>
              </div>

              {/* Slides row */}
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {Array.from({ length: config.carouselSlides }).map((_, i) => {
                  const objectives = getObjectivesForNiche(user?.niche)
                  const objective = objectives.find((o) => o.id === config.objective)
                  const slideContent = getSlideContent(objective, i, config)
                  const slideConfig: CardConfig = {
                    ...config,
                    headline: slideContent.headline,
                    extraText: slideContent.subtext,
                    cta: slideContent.cta || config.cta,
                  }
                  const dims = getPreviewDimensions(config.format, config.carouselShape)
                  const scale = 0.5
                  return (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => setActiveSlide(i)}
                        className={cn(
                          'relative rounded-xl overflow-hidden shadow-xl transition-all',
                          activeSlide === i
                            ? 'ring-2 ring-primary-500 shadow-primary-500/20'
                            : 'ring-1 ring-brand-border opacity-60 hover:opacity-90'
                        )}
                        style={{ width: dims.w * scale, height: dims.h * scale }}
                      >
                        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                          <CardPreview
                            config={slideConfig}
                            previewRef={activeSlide === i ? previewRef : null}
                            companyName={companyName}
                          />
                        </div>
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center justify-center z-10">
                          {i + 1}
                        </div>
                      </button>
                      <span className={cn('text-[10px] font-medium', activeSlide === i ? 'text-primary-400' : 'text-gray-600')}>
                        Slide {i + 1}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Dot nav + action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: config.carouselSlides }).map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)} className={cn('w-2 h-2 rounded-full transition-all', activeSlide === i ? 'bg-primary-500 w-4' : 'bg-gray-600 hover:bg-gray-400')} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (approved && dirtyAfterApprove) { handleUpdate(); return }
                      if (approved) return
                      setApproveCardName(generateCardName(config.format, config.postType, config.productName))
                      setShowApproveModal(true)
                    }}
                    disabled={(approved && !dirtyAfterApprove) || approving}
                    className={cn('gap-1.5', approved && !dirtyAfterApprove ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : approved && dirtyAfterApprove ? 'bg-blue-600 hover:bg-blue-500 text-white' : '')}
                  >
                    {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {approved && dirtyAfterApprove ? 'Atualizar' : approved ? 'Aprovado' : 'Aprovar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSchedule} className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Agendar</Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadPng} className="gap-1.5"><Download className="w-3.5 h-3.5" /> Baixar PNG</Button>
                  <Button size="sm" variant="outline" onClick={handleCopyCaption} className="gap-1.5"><Copy className="w-3.5 h-3.5" /> Copiar legenda</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN 2-COLUMN LAYOUT */}
        {/* ================================================================= */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
          <div className={cn('flex flex-col lg:flex-row gap-6', isCarousel && 'lg:flex-col')}>
            {/* ============================================================= */}
            {/* LEFT COLUMN - Configuration */}
            {/* ============================================================= */}
            <div className={cn('w-full space-y-4', !isCarousel && 'lg:w-[55%]')}>

              {/* ----------------------------------------------------------- */}
              {/* Section 1: Conteudo do card */}
              {/* ----------------------------------------------------------- */}
              <Section title="Conteudo do card" icon={FileText} defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="productName">
                      Nome do produto <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="productName"
                      placeholder="Ex: Smartphone Galaxy S24"
                      value={config.productName}
                      onChange={(e) => updateConfig('productName', e.target.value)}
                    />
                  </div>

                  {/* Tema / Objetivo */}
                  <div className="space-y-1.5">
                    <Label>Tema / Objetivo</Label>
                    <Select
                      value={config.objective}
                      onValueChange={(v) => updateConfig('objective', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tema do conteudo" />
                      </SelectTrigger>
                      <SelectContent>
                        {getObjectivesForNiche(user?.niche).map((obj) => (
                          <SelectItem key={obj.id} value={obj.id}>{obj.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Headline */}
                  <div className="space-y-1.5">
                    <Label htmlFor="headline">Headline (opcional)</Label>
                    <Input
                      id="headline"
                      placeholder="Texto acima do titulo (eyebrow)"
                      value={config.headline}
                      onChange={(e) => updateConfig('headline', e.target.value)}
                    />
                  </div>

                  {/* Prices - only for promocao */}
                  {config.postType === 'promocao' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="originalPrice">Preco original</Label>
                        <Input
                          id="originalPrice"
                          placeholder="199,90"
                          value={config.originalPrice}
                          onChange={(e) => updateConfig('originalPrice', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="promoPrice">Preco promocional</Label>
                        <Input
                          id="promoPrice"
                          placeholder="149,90"
                          value={config.promoPrice}
                          onChange={(e) => updateConfig('promoPrice', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Extra text */}
                  <div className="space-y-1.5">
                    <Label htmlFor="extraText">Texto adicional</Label>
                    <Input
                      id="extraText"
                      placeholder="Descricao breve do produto ou servico..."
                      value={config.extraText}
                      onChange={(e) => updateConfig('extraText', e.target.value)}
                    />
                  </div>

                  {/* CTA */}
                  <div className="space-y-1.5">
                    <Label>Destino do CTA</Label>
                    <Select value={config.cta} onValueChange={(v) => updateConfig('cta', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CTA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Compre agora">Compre agora</SelectItem>
                        <SelectItem value="Saiba mais">Saiba mais</SelectItem>
                        <SelectItem value="Visite nosso site">Visite nosso site</SelectItem>
                        <SelectItem value="Chame no WhatsApp">Chame no WhatsApp</SelectItem>
                        <SelectItem value="Ligue agora">Ligue agora</SelectItem>
                        <SelectItem value="Siga no Instagram">Siga no Instagram</SelectItem>
                        <SelectItem value="Confira">Confira</SelectItem>
                        <SelectItem value="Aproveite">Aproveite</SelectItem>
                        <SelectItem value="Garanta o seu">Garanta o seu</SelectItem>
                        <SelectItem value="Agende agora">Agende agora</SelectItem>
                        <SelectItem value="Acesse o link">Acesse o link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CTA Destination URL */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="ctaUrl">
                      {config.cta === 'Chame no WhatsApp' ? 'WhatsApp (com DDD)' :
                       config.cta === 'Ligue agora' ? 'Telefone (com DDD)' :
                       config.cta === 'Siga no Instagram' ? 'Perfil do Instagram' :
                       'Link de destino'}
                    </Label>
                    <Input
                      id="ctaUrl"
                      placeholder={
                        config.cta === 'Chame no WhatsApp' ? 'Ex: 71996838735' :
                        config.cta === 'Ligue agora' ? 'Ex: 71996838735' :
                        config.cta === 'Siga no Instagram' ? 'Ex: @seuperfil' :
                        'Ex: https://seusite.com.br'
                      }
                      value={config.ctaUrl}
                      onChange={(e) => updateConfig('ctaUrl', e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Carousel options (only when carousel selected) */}
              {/* ----------------------------------------------------------- */}
              {isCarousel && (
                <Section title="Opcoes do Carrossel" icon={Layers} defaultOpen>
                  <div className="space-y-4">
                    {/* Shape */}
                    <div className="space-y-2">
                      <Label>Formato dos slides</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'square' as const, label: 'Quadrado (1:1)', desc: '1080x1080' },
                          { id: 'vertical' as const, label: 'Vertical (4:5)', desc: '1080x1350' },
                        ]).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => updateConfig('carouselShape', s.id)}
                            className={cn(
                              'p-3 rounded-lg border text-left transition-all',
                              config.carouselShape === s.id
                                ? 'border-primary-500 bg-primary-500/10 text-white'
                                : 'border-brand-border bg-brand-surface text-gray-400 hover:text-gray-200'
                            )}
                          >
                            <div className="text-xs font-medium">{s.label}</div>
                            <div className="text-[10px] text-gray-500">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slide count */}
                    <div className="space-y-2">
                      <Label>Quantidade de slides</Label>
                      <div className="flex items-center gap-2">
                        {[3, 5, 7].map((n) => (
                          <button
                            key={n}
                            onClick={() => {
                              updateConfig('carouselSlides', n)
                              setActiveSlide(0)
                            }}
                            className={cn(
                              'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                              config.carouselSlides === n
                                ? 'border-primary-500 bg-primary-500/10 text-white'
                                : 'border-brand-border bg-brand-surface text-gray-400 hover:text-gray-200'
                            )}
                          >
                            {n} slides
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Current slide indicator */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-brand-surface border border-brand-border">
                      <span className="text-xs text-gray-400">Editando slide</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: config.carouselSlides }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveSlide(i)}
                            className={cn(
                              'w-7 h-7 rounded-md text-xs font-medium transition-all',
                              activeSlide === i
                                ? 'bg-primary-500 text-white'
                                : 'bg-brand-dark text-gray-500 hover:text-gray-300'
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              {/* ----------------------------------------------------------- */}
              {/* Section 2: Paleta de cores */}
              {/* ----------------------------------------------------------- */}
              <Section title="Paleta de cores" icon={Palette} defaultOpen>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateConfig('palette', p.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 hover:bg-brand-surface',
                        config.palette === p.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-brand-border bg-brand-card'
                      )}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                      </div>
                      <span className="text-xs font-medium text-gray-200">{p.label}</span>
                    </button>
                  ))}

                  {/* Custom palette */}
                  <button
                    onClick={() => updateConfig('palette', 'custom')}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 hover:bg-brand-surface sm:col-span-1 col-span-2',
                      config.palette === 'custom'
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-brand-border bg-brand-card'
                    )}
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-500" />
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-200">Personalizado</span>
                  </button>
                </div>

                {/* Custom color pickers */}
                {config.palette === 'custom' && (
                  <div className="grid grid-cols-3 gap-3 mt-3 p-3 rounded-lg bg-brand-surface border border-brand-border">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Primaria</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customColors.primary}
                          onChange={(e) => updateCustomColor('primary', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-gray-400">{config.customColors.primary}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Secundaria</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customColors.secondary}
                          onChange={(e) => updateCustomColor('secondary', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-gray-400">{config.customColors.secondary}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fundo</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customColors.bg}
                          onChange={(e) => updateCustomColor('bg', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-gray-400">{config.customColors.bg}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Section: Imagem */}
              {/* ----------------------------------------------------------- */}
              <Section title="Imagem" icon={ImageIcon} onToggle={(open) => updateConfig('includeImage', open)}>
                <div className="space-y-4">
                      {/* Image URL + Library side by side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">URL da imagem</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="https://exemplo.com/imagem.jpg"
                              value={config.imageUrl}
                              onChange={(e) => updateConfig('imageUrl', e.target.value)}
                              className="flex-1"
                            />
                            <label className="flex items-center justify-center h-10 px-3 rounded-lg border border-brand-border bg-brand-surface text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      updateConfig('imageUrl', reader.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ou da biblioteca</Label>
                          <Button
                            variant="outline"
                            className="w-full gap-2 h-10"
                            onClick={() => { setMediaPickerTarget('image1'); setShowMediaPicker(true) }}
                          >
                            <FolderOpen className="w-4 h-4" />
                            Escolher da biblioteca ({mediaItems.length})
                          </Button>
                        </div>
                      </div>

                      {/* Drag-drop zone */}
                      <div
                        className="border-2 border-dashed border-brand-border rounded-lg p-4 text-center hover:border-primary-500/40 transition-colors cursor-pointer"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const file = e.dataTransfer.files[0]
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader()
                            reader.onload = () => updateConfig('imageUrl', reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                      >
                        <Upload className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Arraste uma imagem aqui</p>
                      </div>

                      {/* Image preview thumbnail */}
                      {config.imageUrl && (
                        <div className="relative inline-block">
                          <img src={config.imageUrl} alt="Preview" className="h-20 rounded-lg border border-brand-border" />
                          <button onClick={() => updateConfig('imageUrl', '')} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">&times;</button>
                        </div>
                      )}

                      {/* Image 2 URL (dual-product only) */}
                      {(config.imageLayout === 'dual-product' || config.imageLayout === 'side-by-side' || config.imageLayout === 'side-frame') && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Imagem 2 (produto inferior)</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="https://exemplo.com/imagem2.jpg"
                              value={config.imageUrl2}
                              onChange={(e) => updateConfig('imageUrl2', e.target.value)}
                              className="flex-1"
                            />
                            <label className="flex items-center justify-center h-10 px-3 rounded-lg border border-brand-border bg-brand-surface text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      updateConfig('imageUrl2', reader.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 mt-2"
                            onClick={() => { setMediaPickerTarget('image2'); setShowMediaPicker(true) }}
                          >
                            <FolderOpen className="w-4 h-4" />
                            Escolher 2a imagem da biblioteca
                          </Button>
                        </div>
                      )}

                      {/* Layout thumbnails */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-400">Layout da imagem</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {IMAGE_LAYOUTS.map((layout) => (
                            <LayoutThumbnail
                              key={layout.id}
                              layout={layout}
                              isStories={isStories}
                              selected={config.imageLayout === layout.id}
                              primaryColor={pal.primary}
                              onClick={() => updateConfig('imageLayout', layout.id)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Opacity slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Opacidade</Label>
                          <span className="text-xs text-gray-500">{config.imageOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.imageOpacity}
                          onChange={(e) => updateConfig('imageOpacity', Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                      </div>

                      {/* Blur slider - only for bg/frame */}
                      {(config.imageLayout === 'background' || config.imageLayout === 'frame') && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Desfoque</Label>
                            <span className="text-xs text-gray-500">{config.imageBlur}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={config.imageBlur}
                            onChange={(e) => updateConfig('imageBlur', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                        </div>
                      )}
                </div>
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Section: Opcoes de exibicao */}
              {/* ----------------------------------------------------------- */}
              <Section title="Opcoes de exibicao" icon={Eye}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Incluir logo</Label>
                    <Switch
                      checked={config.display.showLogo}
                      onCheckedChange={(v) => updateDisplay('showLogo', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Incluir CTA</Label>
                    <Switch
                      checked={config.display.showCta}
                      onCheckedChange={(v) => updateDisplay('showCta', v)}
                    />
                  </div>
                  {config.postType === 'promocao' && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Incluir preco</Label>
                        <Switch
                          checked={config.display.showPrice}
                          onCheckedChange={(v) => updateDisplay('showPrice', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Mostrar preco original riscado</Label>
                        <Switch
                          checked={config.display.showOriginalPrice}
                          onCheckedChange={(v) => updateDisplay('showOriginalPrice', v)}
                        />
                      </div>
                    </>
                  )}
                  {/* Type badge position */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Posicao do tipo</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(['inline', 'top-left', 'top-center', 'top-right'] as TypeBadgePosition[]).map((pos) => {
                        const labels: Record<TypeBadgePosition, string> = {
                          inline: 'Inline',
                          'top-left': 'Esquerda',
                          'top-center': 'Centro',
                          'top-right': 'Direita',
                        }
                        return (
                          <button
                            key={pos}
                            onClick={() => updateConfig('typeBadgePosition', pos)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              config.typeBadgePosition === pos
                                ? 'bg-primary-500 text-white'
                                : 'bg-brand-surface text-gray-400 hover:text-gray-200 border border-brand-border'
                            )}
                          >
                            {labels[pos]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Logo position */}
                  {config.display.showLogo && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Posicao do logo</Label>
                      <div className="flex gap-2 flex-wrap">
                        {(['top-left', 'top-center', 'top-right', 'hidden'] as LogoPosition[]).map((pos) => {
                          const labels: Record<LogoPosition, string> = {
                            'top-left': 'Esquerda',
                            'top-center': 'Centro',
                            'top-right': 'Direita',
                            hidden: 'Oculto',
                          }
                          return (
                            <button
                              key={pos}
                              onClick={() => updateConfig('logoPosition', pos)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                config.logoPosition === pos
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-brand-surface text-gray-400 hover:text-gray-200 border border-brand-border'
                              )}
                            >
                              {labels[pos]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Section 4: Tipografia e cores do texto */}
              {/* ----------------------------------------------------------- */}
              <Section title="Tipografia e cores do texto" icon={Type}>
                <div className="space-y-4">
                  {/* Font family grid */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Fonte</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {FONT_FAMILIES.map((ff) => (
                        <button
                          key={ff}
                          onClick={() => updateConfig('fontFamily', ff)}
                          className={cn(
                            'px-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 truncate',
                            config.fontFamily === ff
                              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                              : 'bg-brand-surface text-gray-400 hover:text-gray-200 border border-brand-border hover:bg-gray-800'
                          )}
                          style={{ fontFamily: getFontStack(ff) }}
                        >
                          {ff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font size sliders */}
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: 'title' as const, label: 'Titulo', min: 16, max: 52 },
                      { key: 'subtitle' as const, label: 'Subtitulo', min: 10, max: 28 },
                      { key: 'price' as const, label: 'Preco', min: 18, max: 56 },
                      { key: 'cta' as const, label: 'CTA', min: 10, max: 24 },
                    ]).map((item) => (
                      <div key={item.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">{item.label}</Label>
                          <span className="text-xs text-gray-500">{config.fontSizes[item.key]}px</span>
                        </div>
                        <input
                          type="range"
                          min={item.min}
                          max={item.max}
                          value={config.fontSizes[item.key]}
                          onChange={(e) => updateFontSize(item.key, Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Text colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cor do titulo</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.titleColor}
                          onChange={(e) => updateConfig('titleColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <Input
                          value={config.titleColor}
                          onChange={(e) => updateConfig('titleColor', e.target.value)}
                          className="flex-1 text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cor do texto</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.textColor}
                          onChange={(e) => updateConfig('textColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <Input
                          value={config.textColor}
                          onChange={(e) => updateConfig('textColor', e.target.value)}
                          className="flex-1 text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Section 6: Posicao do texto */}
              {/* ----------------------------------------------------------- */}
              <Section title="Posicao do texto" icon={Move}>
                <div className="space-y-4">
                  {/* Vertical */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Vertical</Label>
                    <div className="flex rounded-lg overflow-hidden border border-brand-border">
                      {(['top', 'center', 'bottom'] as const).map((pos) => {
                        const labels = { top: 'Topo', center: 'Centro', bottom: 'Baixo' }
                        return (
                          <button
                            key={pos}
                            onClick={() => updateTextPosition('vertical', pos)}
                            className={cn(
                              'flex-1 py-2 text-xs font-medium transition-all',
                              config.textPosition.vertical === pos
                                ? 'bg-primary-500 text-white'
                                : 'bg-brand-surface text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            )}
                          >
                            {labels[pos]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Horizontal */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Horizontal</Label>
                    <div className="flex rounded-lg overflow-hidden border border-brand-border">
                      {(['left', 'center', 'right'] as const).map((pos) => {
                        const labels = { left: 'Esquerda', center: 'Centro', right: 'Direita' }
                        return (
                          <button
                            key={pos}
                            onClick={() => updateTextPosition('horizontal', pos)}
                            className={cn(
                              'flex-1 py-2 text-xs font-medium transition-all',
                              config.textPosition.horizontal === pos
                                ? 'bg-primary-500 text-white'
                                : 'bg-brand-surface text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            )}
                          >
                            {labels[pos]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* ============================================================= */}
            {/* RIGHT COLUMN - Preview (only non-carousel) */}
            {/* ============================================================= */}
            {!isCarousel && (
            <div className="w-full lg:w-[45%]">
              <div className="lg:sticky lg:top-[76px] space-y-4">

                {/* ── Single preview (feed / stories) ────────────────── */}
                {!isCarousel && (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-gray-300">Preview</h2>
                      <Badge variant="secondary" className="text-xs">
                        {FORMAT_OPTIONS.find((f) => f.id === config.format)?.label} - {getDimensionLabel(config.format, config.carouselShape)}
                      </Badge>
                    </div>
                    <div className="flex justify-center">
                      <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/40" style={{ maxWidth: '100%' }}>
                        <CardPreview config={config} previewRef={previewRef} companyName={companyName} />
                      </div>
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      if (approved && dirtyAfterApprove) { handleUpdate(); return }
                      if (approved) return
                      setApproveCardName(generateCardName(config.format, config.postType, config.productName))
                      setShowApproveModal(true)
                    }}
                    disabled={(approved && !dirtyAfterApprove) || approving}
                    className={cn('gap-2', approved && !dirtyAfterApprove ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : approved && dirtyAfterApprove ? 'bg-blue-600 hover:bg-blue-500 text-white' : '')}
                  >
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {approved && dirtyAfterApprove ? 'Atualizar' : approved ? 'Aprovado' : 'Aprovar'}
                  </Button>
                  <Button onClick={handleSchedule} variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Agendar</Button>
                  <Button onClick={handleDownloadPng} variant="outline" className="gap-2"><Download className="w-4 h-4" /> Baixar PNG</Button>
                  <Button onClick={handleCopyCaption} variant="outline" className="gap-2"><Copy className="w-4 h-4" /> Copiar legenda</Button>
                </div>

              </div>
            </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM SECTION - Gallery (only for non-carousel) */}
        {/* ================================================================= */}
        {!isCarousel && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-12">
          <div className="border-t border-brand-border pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-100">Cards recentes</h2>
                  <button
                    onClick={() => router.push('/app/cards/library')}
                    className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Ver todos
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                {loadingGallery ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                ) : galleryCards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-sm">Nenhum card gerado ainda</div>
                    <div className="text-gray-600 text-xs mt-1">
                      Preencha os campos acima e clique em &quot;Gerar com IA&quot;
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {galleryCards.map((card) => {
                      const cardId = card._id || card.id
                      const thumbUrl = card.generated_image_url || card.preview_url
                      return (
                        <div key={cardId} className="flex-shrink-0 w-48 group relative">
                          <button onClick={() => loadGalleryCard(card)} className="w-full text-left">
                            <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-lg', card.status === 'approved' ? 'border-emerald-500/40 hover:border-emerald-500/60 hover:shadow-emerald-500/10' : 'hover:border-primary-500/50 hover:shadow-primary-500/10')}>
                              <div className="h-32 bg-gradient-to-br from-brand-surface to-brand-dark flex items-center justify-center relative overflow-hidden">
                                {thumbUrl ? <img src={thumbUrl} alt={card.product_name} className="w-full h-full object-cover" /> : <div className="text-2xl font-bold text-gray-600">{(card.product_name || 'C')[0].toUpperCase()}</div>}
                                {card.status === 'approved' && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                              </div>
                              <CardContent className="p-3 pt-3 space-y-2">
                                <div className="text-xs font-medium text-gray-200 truncate">{card.product_name || card.card_name}</div>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{card.format}</Badge>
                                  <Badge variant={getStatusBadgeVariant(card.status)} className="text-[10px] px-1.5 py-0">{getStatusLabel(card.status)}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </button>
                          <button
                            onClick={async (e) => { e.stopPropagation(); try { await api.delete(`/api/cards/${cardId}`); setGalleryCards((prev) => prev.filter((c) => (c._id || c.id) !== cardId)); toast.success('Card removido') } catch { toast.error('Erro ao remover') } }}
                            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 text-gray-400 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          ><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )
                    })}
                  </div>
                )}
          </div>
        </div>
        )}
      </div>
      {/* AI Image Generation Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="sm:max-w-2xl bg-brand-card border-brand-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Gerar imagem com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-gray-300">Descreva a imagem que deseja gerar</Label>
              <textarea
                className="w-full min-h-[160px] rounded-lg border border-brand-border bg-brand-surface p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y"
                placeholder="Descreva o que deseja na imagem..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerateImage()
                  }
                }}
              />
            </div>

            {/* Reference image upload */}
            <div className="space-y-2">
              <Label className="text-gray-300">Imagem de referencia (opcional)</Label>
              <input
                ref={aiFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAiImageUpload}
              />
              {aiReferenceImage ? (
                <div className="relative inline-block">
                  <img
                    src={aiReferenceImage}
                    alt="Referencia"
                    className="h-28 rounded-lg border border-brand-border object-cover"
                  />
                  <button
                    onClick={() => setAiReferenceImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => aiFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-brand-border bg-brand-surface/50 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Anexar imagem de referencia
                </button>
              )}
              <p className="text-xs text-gray-500">A IA usara a imagem como base para gerar o resultado. Cmd+Enter para enviar.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAiModal(false)}
                disabled={generatingImage}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
                onClick={handleGenerateImage}
                disabled={generatingImage}
              >
                {generatingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {generatingImage ? 'Gerando...' : 'Gerar imagem'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowApproveModal(false)}>
          <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Aprovar Card</h3>
            <p className="text-sm text-gray-400 mb-4">De um nome para identificar este card no agendamento</p>
            <div className="space-y-2 mb-6">
              <Label>Nome do card</Label>
              <Input
                value={approveCardName}
                onChange={(e) => setApproveCardName(e.target.value)}
                placeholder="Ex: Stories - Promocao - Vitamina C"
                autoFocus
              />
              <p className="text-xs text-gray-500">Esse nome aparecera na lista de agendamento</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowApproveModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                onClick={() => handleApprove(approveCardName)}
                disabled={approving}
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Aprovar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Dialog */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMediaPicker(false)}>
          <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-gray-200">
                Escolher imagem {mediaPickerTarget === 'image2' ? '(2o produto)' : ''}
              </h3>
              <button onClick={() => setShowMediaPicker(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder tabs */}
            <div className="flex items-center gap-2 p-3 border-b border-brand-border overflow-x-auto">
              <button
                onClick={() => setMediaFolderFilter(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  mediaFolderFilter === null ? 'bg-primary-500 text-white' : 'bg-brand-surface text-gray-400 hover:text-gray-200'
                )}
              >
                Todas ({mediaItems.length})
              </button>
              {mediaFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setMediaFolderFilter(folder.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                    mediaFolderFilter === folder.id ? 'bg-primary-500 text-white' : 'bg-brand-surface text-gray-400 hover:text-gray-200'
                  )}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: folder.color }} />
                  {folder.name} ({mediaItems.filter((i) => i.folderId === folder.id).length})
                </button>
              ))}
            </div>

            {/* Image grid */}
            <div className="p-4 overflow-y-auto max-h-[55vh]">
              {(() => {
                const filtered = mediaFolderFilter
                  ? mediaItems.filter((i) => i.folderId === mediaFolderFilter)
                  : mediaItems

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma imagem encontrada</p>
                      <p className="text-xs text-gray-600 mt-1">Adicione imagens na biblioteca primeiro</p>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {filtered.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (mediaPickerTarget === 'image2') {
                            updateConfig('imageUrl2', item.url)
                          } else {
                            updateConfig('imageUrl', item.url)
                            if (!config.includeImage) updateConfig('includeImage', true)
                          }
                          setShowMediaPicker(false)
                          toast.success('Imagem selecionada!')
                        }}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-brand-border hover:border-primary-500 transition-colors"
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Selecionar</span>
                        </div>
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/60 rounded px-1 truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
