import { COLOR_PALETTES } from '../constants'
import type { CardConfig, FontFamily } from '../types'

export function getActivePalette(config: CardConfig): {
  primary: string
  secondary: string
  bg: string
} {
  if (config.palette === 'custom') return config.customColors
  const found = COLOR_PALETTES.find((p) => p.id === config.palette)
  return found
    ? { primary: found.primary, secondary: found.secondary, bg: found.bg }
    : { primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' }
}

export function getFontStack(fontFamily: FontFamily): string {
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

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
