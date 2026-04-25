import { NICHE_LABELS } from '../constants'
import type { CarouselShape, Format, PostType } from '../types'

export function getNicheLabel(niche?: string): string {
  return NICHE_LABELS[niche || 'outro'] || NICHE_LABELS.outro
}

// Gera um prompt dinamico para a IA com base em nicho, formato, conteudo e referencia
export function buildAiPrompt(opts: {
  niche?: string
  format: Format
  carouselShape?: CarouselShape
  slideIndex?: number
  slideTotal?: number
  productName?: string
  headline?: string
  extraText?: string
  postType?: PostType
  hasReferenceImage?: boolean
}): string {
  const {
    niche,
    format,
    carouselShape,
    slideIndex,
    slideTotal,
    productName,
    headline,
    extraText,
    postType,
    hasReferenceImage,
  } = opts

  const nicheLabel = getNicheLabel(niche)

  // Dimensoes
  let dimensions = '1080x1080 (quadrado)'
  let formatLabel = 'post de feed do Instagram'
  if (format === 'stories') {
    dimensions = '1080x1920 (vertical, story)'
    formatLabel = 'story do Instagram (formato vertical 9:16, tela cheia)'
  } else if (format === 'carousel') {
    if (carouselShape === 'vertical') {
      dimensions = '1080x1350 (vertical 4:5)'
      formatLabel = 'slide de carrossel do Instagram (formato vertical 4:5)'
    } else {
      dimensions = '1080x1080 (quadrado 1:1)'
      formatLabel = 'slide de carrossel do Instagram (formato quadrado 1:1)'
    }
  } else if (format === 'feed') {
    dimensions = '1080x1080 (quadrado 1:1)'
    formatLabel = 'post de feed do Instagram (quadrado 1:1)'
  }

  const postTypeMap: Record<PostType, string> = {
    nenhum: '',
    promocao: 'promocao com apelo comercial',
    dica: 'dica educativa / conteudo informativo',
    novidade: 'lancamento / novidade',
    institucional: 'institucional / branding',
    data_comemorativa: 'data comemorativa',
  }
  const postTypePart =
    postType && postTypeMap[postType]
      ? `Tipo de post: ${postTypeMap[postType]}.\n`
      : ''

  const slidePart =
    format === 'carousel' && typeof slideIndex === 'number' && slideTotal
      ? `Slide ${slideIndex + 1} de ${slideTotal} do carrossel.\n`
      : ''

  const productPart = productName ? `Produto/serviço: ${productName}.\n` : ''
  const headlinePart = headline ? `Titulo/chamada: "${headline}".\n` : ''
  const textPart = extraText ? `Texto de apoio: "${extraText}".\n` : ''

  const refPart = hasReferenceImage
    ? 'IMPORTANTE: use a imagem de referencia anexada como base visual principal - mantenha o estilo, paleta, composicao e mood da referencia, adaptando apenas o conteudo para o briefing.\n'
    : ''

  return `Crie uma imagem profissional para ${formatLabel}.
Dimensoes: ${dimensions}
Nicho do anunciante: ${nicheLabel}.
${postTypePart}${slidePart}${productPart}${headlinePart}${textPart}${refPart}Estilo: moderno, clean, visualmente atrativo para redes sociais, coerente com o nicho de ${nicheLabel}, sem poluicao visual, com espaco de respiro para sobrepor texto.
A imagem deve ser fotografica ou ilustrativa de alta qualidade, adequada ao público do nicho.`
}
