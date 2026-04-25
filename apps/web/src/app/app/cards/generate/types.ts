// Types para a tela de geracao de cards

export type Format = 'feed' | 'stories' | 'reels' | 'carousel'
export type CarouselShape = 'square' | 'vertical'
export type PostType =
  | 'promocao'
  | 'dica'
  | 'novidade'
  | 'institucional'
  | 'data_comemorativa'
  | 'nenhum'
export type PaletteId =
  | 'vibrante'
  | 'profissional'
  | 'quente'
  | 'elegante'
  | 'custom'
export type ImageLayout =
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
  | 'external'
export type LogoPosition = 'top-left' | 'top-right' | 'top-center' | 'hidden'
export type TypeBadgePosition =
  | 'inline'
  | 'top-left'
  | 'top-center'
  | 'top-right'
export type FontFamily =
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

export interface ColorPalette {
  id: PaletteId
  label: string
  primary: string
  secondary: string
  bg: string
}

export interface CarouselSlideContent {
  headline: string
  subtext: string
  cta?: string
}

export interface CarouselObjective {
  id: string
  label: string
  slides: CarouselSlideContent[]
}

export interface CardConfig {
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
  display: {
    showLogo: boolean
    showCta: boolean
    showPrice: boolean
    showOriginalPrice: boolean
  }
  includeImage: boolean
  imageUrl: string
  imageUrl2: string // second image for dual-product layout
  imageLayout: ImageLayout
  imageOpacity: number
  imageBlur: number
  // Tipo da midia principal (imageUrl). 'video' e usado no fluxo "Utilizar um Existente" com upload de video.
  mediaType: 'image' | 'video'
  fontFamily: FontFamily
  fontSizes: { title: number; subtitle: number; price: number; cta: number }
  textColor: string
  titleColor: string
  textPosition: {
    vertical: 'top' | 'center' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
  logoPosition: LogoPosition
  typeBadgePosition: TypeBadgePosition
  carouselShape: CarouselShape
  carouselSlides: number
  carouselSlideContents: CarouselSlideContent[]
  slideImageUrls: string[]
  objective: string
  logoUrl: string
  logoSize: number
}

export interface GalleryCard {
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

export interface CardTheme {
  id: string
  label: string
  description: string
  postTypes: PostType[]
  colors: { primary: string; secondary: string; bg: string }
  apply: Partial<CardConfig>
}
