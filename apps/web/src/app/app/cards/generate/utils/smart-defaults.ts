import {
  FONT_FAMILIES,
  RANDOM_CTAS,
  RANDOM_EXTRAS,
  RANDOM_HEADLINES,
  RANDOM_PRODUCTS,
} from '../constants'
import type { CardConfig, PaletteId, PostType } from '../types'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getSmartDefaults(
  niche: string | undefined,
  postType: PostType | 'nenhum',
): Partial<CardConfig> {
  if (postType === 'nenhum') return {}
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
    const original = Math.floor(Math.random() * 200) + 20
    const discount = Math.floor(Math.random() * 40) + 15 // 15-55% off
    const promo = Math.round(original * (1 - discount / 100) * 100) / 100
    base.originalPrice = `${original},90`
    base.promoPrice = `${Math.floor(promo)},90`
  }

  if (postType === 'dica') {
    base.headline = pick([
      'Você sabia?',
      'Dica do especialista',
      'Fique ligado',
      'Dica do dia',
      'Cuide-se bem',
    ])
    base.cta = pick(['Saiba mais', 'Confira', 'Leia mais', 'Descubra'])
  }

  if (postType === 'institucional') {
    base.productName = pick([
      'Comunicado importante',
      'Horario especial',
      'Atendimento',
      'Novos horarios',
      'Aviso aos clientes',
    ])
    base.headline = pick(['Comunicado', 'Informativo', 'Atenção', 'Aviso'])
    base.cta = pick(['Saiba mais', 'Entenda', 'Confira', 'Veja detalhes'])
  }

  if (postType === 'novidade') {
    base.headline = pick([
      'Novidade na loja',
      'Chegou!',
      'Lancamento',
      'Recem chegado',
      'Exclusivo',
    ])
    base.cta = pick(['Confira', 'Veja mais', 'Conheca', 'Descubra'])
  }

  if (postType === 'data_comemorativa') {
    const datas = [
      'Dia das Maes',
      'Black Friday',
      'Natal',
      'Dia dos Namorados',
      'Dia do Cliente',
      'Aniversario da Loja',
      'Semana do Consumidor',
    ]
    base.productName = pick(datas)
    base.headline = pick([
      'Celebre conosco',
      'Data especial',
      'Comemore',
      'Festeje',
    ])
    base.cta = pick(['Aproveite', 'Celebre', 'Comemore', 'Presenteie'])
  }

  return base
}
