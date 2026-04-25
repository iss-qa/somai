import type React from 'react'
import {
  FORMAT_OPTIONS,
  POST_TYPES,
  REAL_DIMENSIONS,
  NICHE_OBJECTIVES,
  CARD_THEMES,
} from '../constants'
import type {
  CardConfig,
  CardTheme,
  CarouselObjective,
  CarouselShape,
  CarouselSlideContent,
  Format,
  PostType,
} from '../types'

export function getCarouselDimensions(shape: CarouselShape): {
  w: number
  h: number
} {
  return shape === 'vertical' ? { w: 1080, h: 1350 } : { w: 1080, h: 1080 }
}

// Preview dimensions (scaled down to fit UI, maintain exact ratio)
export function getPreviewDimensions(
  format: Format,
  carouselShape?: CarouselShape,
): { w: number; h: number } {
  const real =
    format === 'carousel' && carouselShape
      ? getCarouselDimensions(carouselShape)
      : REAL_DIMENSIONS[format]
  const scale = 400 / real.w
  return { w: Math.round(real.w * scale), h: Math.round(real.h * scale) }
}

export function getDimensionLabel(
  format: Format,
  carouselShape?: CarouselShape,
): string {
  const d =
    format === 'carousel' && carouselShape
      ? getCarouselDimensions(carouselShape)
      : REAL_DIMENSIONS[format]
  return `${d.w}x${d.h}`
}

export function generateCardName(
  format: Format,
  postType: PostType,
  productName: string,
): string {
  const formatLabel =
    FORMAT_OPTIONS.find((f) => f.id === format)?.label || format
  const typeLabel =
    postType === 'nenhum'
      ? 'Card'
      : POST_TYPES.find((t) => t.value === postType)?.label || postType
  const name = productName.trim() || 'Sem nome'
  return `${formatLabel} - ${typeLabel} - ${name}`
}

export function getTextPositionStyles(tp: CardConfig['textPosition']): {
  justifyContent: string
  alignItems: string
  textAlign: React.CSSProperties['textAlign']
} {
  const vMap: Record<string, string> = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
  }
  const hMap: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }
  const tMap: Record<string, React.CSSProperties['textAlign']> = {
    left: 'left',
    center: 'center',
    right: 'right',
  }
  return {
    justifyContent: vMap[tp.vertical],
    alignItems: hMap[tp.horizontal],
    textAlign: tMap[tp.horizontal],
  }
}

export function getStatusBadgeVariant(
  status: string,
): 'default' | 'success' | 'warning' | 'secondary' {
  switch (status) {
    case 'approved':
      return 'success'
    case 'scheduled':
      return 'warning'
    case 'published':
      return 'default'
    default:
      return 'secondary'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'approved':
      return 'Aprovado'
    case 'scheduled':
      return 'Agendado'
    case 'published':
      return 'Publicado'
    default:
      return status
  }
}

export function getObjectivesForNiche(niche?: string): CarouselObjective[] {
  return NICHE_OBJECTIVES[niche || 'outro'] || NICHE_OBJECTIVES.outro
}

export function getSlideContent(
  objective: CarouselObjective | undefined,
  slideIndex: number,
  config: CardConfig,
): CarouselSlideContent {
  if (
    !objective ||
    objective.id === 'personalizado' ||
    !objective.slides.length
  ) {
    return {
      headline: config.headline || 'Seu titulo aqui',
      subtext: config.extraText || 'Seu texto aqui',
      cta: config.cta,
    }
  }
  const slide = objective.slides[slideIndex % objective.slides.length]
  return slide
}

export function getThemesForPostType(postType: PostType): CardTheme[] {
  return CARD_THEMES.filter((t) => t.postTypes.includes(postType))
}
