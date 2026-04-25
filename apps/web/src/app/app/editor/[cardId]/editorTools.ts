import type { Overlay } from './EditorCanvas'

// Fontes carregadas via Google Fonts (ver editor/page.tsx → injectFonts).
export const FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Playfair Display',
  'Lora',
  'Bebas Neue',
  'Oswald',
  'Pacifico',
  'Dancing Script',
] as const

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Inter:wght@400;500;600;700;800',
    'family=Poppins:wght@400;500;600;700;800',
    'family=Montserrat:wght@400;600;700;800',
    'family=Roboto:wght@400;500;700',
    'family=Open+Sans:wght@400;600;700',
    'family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400',
    'family=Lora:ital,wght@0,400;0,600;0,700;1,400',
    'family=Bebas+Neue',
    'family=Oswald:wght@400;500;700',
    'family=Pacifico',
    'family=Dancing+Script:wght@500;600;700',
    'display=swap',
  ].join('&')

type Preset = {
  key: string
  label: string
  sub: string
  build: () => Partial<Overlay>
}

// Tamanhos de fonte são em px @ 1080 (largura de referência) — escalados.
export const TEXT_PRESETS: Preset[] = [
  {
    key: 'titulo_grande',
    label: 'Título Grande',
    sub: 'Título',
    build: () => ({
      type: 'text',
      text: 'Seu Título',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 110,
      fontWeight: 800,
      color: '#ffffff',
      textAlign: 'center',
      preset: 'titulo_grande',
      w: 0.78,
      h: 0.18,
    }),
  },
  {
    key: 'subtitulo',
    label: 'Subtítulo',
    sub: 'Subtítulo',
    build: () => ({
      type: 'text',
      text: 'Subtítulo',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 68,
      fontWeight: 600,
      color: '#ffffff',
      textAlign: 'center',
      preset: 'subtitulo',
      w: 0.7,
      h: 0.12,
    }),
  },
  {
    key: 'corpo',
    label: 'Corpo',
    sub: 'Texto do corpo',
    build: () => ({
      type: 'text',
      text: 'Texto do corpo do post',
      fontFamily: 'Inter',
      fontSize: 38,
      fontWeight: 400,
      color: '#ffffff',
      textAlign: 'left',
      preset: 'corpo',
      w: 0.7,
      h: 0.1,
    }),
  },
  {
    key: 'citacao',
    label: 'Citação',
    sub: '"Citação inspiradora"',
    build: () => ({
      type: 'text',
      text: '"Citação inspiradora"',
      fontFamily: 'Playfair Display',
      fontSize: 70,
      fontWeight: 500,
      fontStyle: 'italic',
      color: '#ffffff',
      textAlign: 'center',
      preset: 'citacao',
      w: 0.78,
      h: 0.16,
    }),
  },
  {
    key: 'destaque',
    label: 'Destaque',
    sub: 'DESTAQUE',
    build: () => ({
      type: 'text',
      text: 'DESTAQUE',
      fontFamily: 'Bebas Neue',
      fontSize: 88,
      fontWeight: 400,
      color: '#fde047',
      textAlign: 'center',
      preset: 'destaque',
      w: 0.6,
      h: 0.14,
    }),
  },
  {
    key: 'legenda',
    label: 'Legenda',
    sub: 'Legenda pequena',
    build: () => ({
      type: 'text',
      text: 'Legenda pequena',
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 500,
      color: '#ffffff',
      textAlign: 'left',
      preset: 'legenda',
      w: 0.5,
      h: 0.06,
    }),
  },
]

export const SHAPE_PRESETS = [
  {
    key: 'rect',
    label: 'Retângulo',
    build: () =>
      ({
        type: 'shape',
        shape: 'rect',
        fill: '#8b5cf6',
        borderRadius: 16,
        w: 0.3,
        h: 0.12,
      }) as Partial<Overlay>,
  },
  {
    key: 'rect_round',
    label: 'Pílula',
    build: () =>
      ({
        type: 'shape',
        shape: 'rect',
        fill: '#22c55e',
        borderRadius: 999,
        w: 0.36,
        h: 0.08,
      }) as Partial<Overlay>,
  },
  {
    key: 'circle',
    label: 'Círculo',
    build: () =>
      ({
        type: 'shape',
        shape: 'circle',
        fill: '#ef4444',
        w: 0.18,
        h: 0.18,
      }) as Partial<Overlay>,
  },
]

export function makeOverlayId() {
  return 'ov_' + Math.random().toString(36).slice(2, 10)
}

export function buildPreset(
  base: Partial<Overlay>,
  centerX = 0.1,
  centerY = 0.4,
): Overlay {
  const w = base.w ?? 0.4
  const h = base.h ?? 0.1
  return {
    id: makeOverlayId(),
    type: base.type ?? 'text',
    x: centerX,
    y: centerY,
    w,
    h,
    z: Date.now(),
    ...base,
  } as Overlay
}
