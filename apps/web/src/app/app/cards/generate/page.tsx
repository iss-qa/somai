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
import { getCardTemplate, type TemplatePostType } from '@/lib/card-templates'
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
  ArrowLeft,
} from 'lucide-react'

// Extracted types/constants/utils (refactor fase 2)
import type {
  Format,
  CarouselShape,
  PostType,
  PaletteId,
  ImageLayout,
  LogoPosition,
  TypeBadgePosition,
  FontFamily,
  ColorPalette,
  CardConfig,
  GalleryCard,
  CarouselSlideContent,
  CarouselObjective,
  CardTheme,
} from './types'
import {
  COLOR_PALETTES,
  FORMAT_OPTIONS,
  POST_TYPES,
  NICHE_OBJECTIVES,
  FONT_FAMILIES,
  IMAGE_LAYOUTS,
  RANDOM_HEADLINES,
  RANDOM_PRODUCTS,
  RANDOM_CTAS,
  RANDOM_EXTRAS,
  CARD_THEMES,
  DEFAULT_CONFIG,
  NICHE_LABELS,
  REAL_DIMENSIONS,
} from './constants'
import {
  getActivePalette,
  getFontStack,
  hexToRgba,
} from './utils/colors'
import {
  getCarouselDimensions,
  getPreviewDimensions,
  getDimensionLabel,
  generateCardName,
  getTextPositionStyles,
  getStatusBadgeVariant,
  getStatusLabel,
  getObjectivesForNiche,
  getSlideContent,
  getThemesForPostType,
} from './utils/card'
import { getSmartDefaults } from './utils/smart-defaults'
import { buildAiPrompt, getNicheLabel } from './utils/prompt'

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
// Image Dropzone (URL + upload + drag-drop numa única área)
// ---------------------------------------------------------------------------

function ImageDropzone({
  value,
  onChange,
  onClear,
  onPickFromLibrary,
  libraryCount,
  libraryLabel = 'Escolher da biblioteca',
}: {
  value: string
  onChange: (url: string) => void
  onClear: () => void
  onPickFromLibrary: () => void
  libraryCount: number
  libraryLabel?: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const hasImage = !!value

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) readFile(file)
        }}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all',
          dragOver
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-brand-border bg-brand-surface/30 hover:border-primary-500/40',
        )}
      >
        {hasImage ? (
          <div className="flex items-center gap-3 p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Pré-visualização"
              className="h-16 w-16 rounded-md object-cover border border-brand-border flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">
                {value.startsWith('data:') ? 'Imagem carregada' : value}
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-[11px] text-gray-400 hover:text-white underline-offset-2 hover:underline"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[11px] text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-6 text-center cursor-pointer"
          >
            <Upload className="w-6 h-6 text-gray-500" />
            <div className="text-xs text-gray-400">
              <span className="text-gray-200 font-medium">Clique para enviar</span>
              {' '}ou arraste uma imagem
            </div>
            <div className="text-[10px] text-gray-600">PNG, JPG ou WEBP</div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) readFile(file)
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
      </div>

      {/* URL manual + biblioteca */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="ou cole a URL da imagem"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2 text-xs sm:w-auto"
          onClick={onPickFromLibrary}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          {libraryLabel} ({libraryCount})
        </Button>
      </div>
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
    nenhum: {
      badge: '',
      gradient: `linear-gradient(135deg, ${pal.bg} 0%, ${pal.bg} 100%)`,
      icon: '',
      accentGradient: `linear-gradient(135deg, ${pal.primary}, ${pal.secondary})`,
    },
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

    if (layout === 'background' || layout === 'external') {
      // Para video externo, renderiza <video> em vez de background-image
      if (layout === 'external' && config.mediaType === 'video' && config.imageUrl) {
        return (
          <video
            src={config.imageUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )
      }
      return (
        <div
          style={{
            ...baseImageStyle,
            position: 'absolute',
            inset: 0,
            opacity: layout === 'external' ? 1 : config.imageOpacity / 100,
            filter: layout === 'external' ? 'none' : `blur(${config.imageBlur}px)`,
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

  // Background layout (inclui external: imagem cobre o card todo)
  function isBgLayout() {
    return hasImageLayout && (config.imageLayout === 'background' || config.imageLayout === 'external')
  }

  // Logo
  function renderLogo() {
    if (!config.display.showLogo || config.logoPosition === 'hidden') return null
    const posMap: Record<string, React.CSSProperties> = {
      'top-left': { top: 12, left: 12 },
      'top-right': { top: 12, right: 12 },
      'top-center': { top: 12, left: '50%', transform: 'translateX(-50%)' },
    }
    const size = config.logoSize || 36
    return (
      <div
        style={{
          position: 'absolute',
          ...posMap[config.logoPosition],
          width: size,
          height: size,
          borderRadius: '50%',
          background: config.logoUrl ? 'transparent' : ptConfig.accentGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.36),
          fontWeight: 700,
          color: '#fff',
          fontFamily: fontStack,
          zIndex: 10,
          boxShadow: `0 2px 8px ${pal.primary}40`,
          overflow: 'hidden',
        }}
      >
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        ) : (
          initials
        )}
      </div>
    )
  }

  // Post type badge (inline – rendered inside text flow)
  function renderTypeBadge() {
    if (config.postType === 'nenhum') return null
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
    if (config.postType === 'nenhum') return null
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

        {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
        {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
          {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
            {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
          {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
          {config.display.showCta && config.cta && config.cta !== 'nenhum' && (
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
      {isBgLayout() && config.imageLayout !== 'external' && (
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
  const [aiConfigInfo, setAiConfigInfo] = useState<{ provider: string; model: string; active: boolean } | null>(null)
  const [showEnlargedPreview, setShowEnlargedPreview] = useState(false)
  const [enlargedSlide, setEnlargedSlide] = useState(0)
  // Fluxo direto: sempre inicia no formulario personalizado, sem modal de escolha.
  const [startChoice, setStartChoice] = useState<'custom' | 'ai' | 'existing' | null>('custom')
  const [showStartChoice, setShowStartChoice] = useState(false)
  const [showExistingUpload, setShowExistingUpload] = useState(false)
  const [existingCardPreview, setExistingCardPreview] = useState<string | null>(null)
  const [existingMediaType, setExistingMediaType] = useState<'image' | 'video'>('image')
  const aiFileInputRef = useRef<HTMLInputElement>(null)
  const existingFileInputRef = useRef<HTMLInputElement>(null)

  // Carrega info da IA configurada (para badge + aviso)
  useEffect(() => {
    api.get<any>('/api/integrations/ai')
      .then((d) => {
        if (d?.ai) setAiConfigInfo({ provider: d.ai.provider, model: d.ai.model, active: d.ai.active })
      })
      .catch(() => {})
  }, [])

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
      let next = { ...prev, [key]: value }

      // Ao trocar o tipo de post (exceto "nenhum"), carrega um exemplo
      // pré-preenchido coerente com o nicho da empresa do usuário.
      if (key === 'postType' && value !== 'nenhum' && value !== prev.postType) {
        const tpl = getCardTemplate(user?.niche, value as TemplatePostType)
        next = {
          ...next,
          productName: tpl.productName,
          headline: tpl.headline,
          extraText: tpl.extraText,
          cta: tpl.cta,
          ctaUrl: tpl.ctaUrl || prev.ctaUrl,
          originalPrice: tpl.originalPrice,
          promoPrice: tpl.promoPrice,
          palette: tpl.palette,
          fontFamily: tpl.fontFamily,
          display: {
            ...prev.display,
            showPrice: tpl.showPrice,
            showOriginalPrice: tpl.showOriginalPrice,
          },
        }
      }

      // Auto-generate card name when relevant fields change
      if (key === 'format' || key === 'postType' || key === 'productName') {
        const f = key === 'format' ? (value as Format) : prev.format
        const pt = key === 'postType' ? (value as PostType) : prev.postType
        const pn = key === 'productName' ? (value as string) : next.productName
        if (!prev.cardName || prev.cardName === generateCardName(prev.format, prev.postType, prev.productName)) {
          next.cardName = generateCardName(f, pt, pn)
        }
      }
      return next
    })
    setDirtyAfterApprove(true)
  }, [user?.niche])

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

  const updateSlideContent = useCallback((slideIndex: number, key: keyof CarouselSlideContent, value: string) => {
    setConfig((prev) => {
      const next = [...prev.carouselSlideContents]
      const current = next[slideIndex] || { headline: '', subtext: '', cta: prev.cta }
      next[slideIndex] = { ...current, [key]: value }
      return { ...prev, carouselSlideContents: next }
    })
    setDirtyAfterApprove(true)
  }, [])

  const updateCustomColor = useCallback((key: keyof CardConfig['customColors'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      customColors: { ...prev.customColors, [key]: value },
    }))
  }, [])

  /**
   * Define a imagem (principal ou secundária) e ativa `includeImage`
   * automaticamente quando o usuário adiciona uma imagem — evita a
   * confusão de ter imagem setada mas o preview não renderizá-la.
   */
  const setImage = useCallback((slot: 'image1' | 'image2', url: string) => {
    setConfig((prev) => {
      const key = slot === 'image1' ? 'imageUrl' : 'imageUrl2'
      const next: CardConfig = { ...prev, [key]: url }
      if (url && !prev.includeImage) {
        next.includeImage = true
      }
      return next
    })
    setDirtyAfterApprove(true)
  }, [])

  // ---------- Sync carouselSlideContents length com carouselSlides / objective ----------
  useEffect(() => {
    setConfig((prev) => {
      if (prev.format !== 'carousel') return prev
      const objectives = getObjectivesForNiche(user?.niche)
      const objective = objectives.find((o) => o.id === prev.objective)
      const next: CarouselSlideContent[] = []
      for (let i = 0; i < prev.carouselSlides; i++) {
        const existing = prev.carouselSlideContents[i]
        if (existing && (existing.headline || existing.subtext)) {
          next.push(existing)
        } else {
          // Preencher com conteudo do objetivo selecionado ou valores base
          const seed = getSlideContent(objective, i, prev)
          next.push({
            headline: seed.headline || '',
            subtext: seed.subtext || '',
            cta: seed.cta || prev.cta,
          })
        }
      }
      // Nenhuma mudanca real: retorna prev
      const same =
        next.length === prev.carouselSlideContents.length &&
        next.every((s, i) =>
          s.headline === prev.carouselSlideContents[i]?.headline &&
          s.subtext === prev.carouselSlideContents[i]?.subtext &&
          s.cta === prev.carouselSlideContents[i]?.cta,
        )
      if (same) return prev
      return { ...prev, carouselSlideContents: next }
    })
  }, [config.format, config.carouselSlides, config.objective, user?.niche])

  // Ao abrir em modo edicao, pula o modal de escolha (considera 'custom')
  useEffect(() => {
    if (editCardId) {
      setShowStartChoice(false)
      setStartChoice('custom')
    }
  }, [editCardId])

  // ---------- Auto-fill defaults on mount (somente se o usuario escolheu 'custom' no modal) ----------
  // Obs: no fluxo 'ai' o LLM preenche tudo; no 'custom' o form fica vazio (pedido do usuario).
  // Mantemos esse efeito inerte por ora - auto-fill legado foi desativado.
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)
  useEffect(() => {
    // no-op: form inicia vazio independente do caminho escolhido
    if (!defaultsLoaded) setDefaultsLoaded(true)
  }, [defaultsLoaded])

  // ---------- Refresh defaults when format changes (if not editing) ----------
  // Desativado: alterar formato nao deve sobrescrever o conteudo atual.
  const prevFormatRef = useRef(config.format)
  useEffect(() => {
    prevFormatRef.current = config.format
  }, [config.format])

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
    const defaultPrompt = buildAiPrompt({
      niche: user?.niche,
      format: config.format,
      carouselShape: config.carouselShape,
      slideTotal: config.format === 'carousel' ? config.carouselSlides : undefined,
      productName: config.productName,
      headline: config.headline,
      extraText: config.extraText,
      postType: config.postType,
      hasReferenceImage: false,
    })
    setAiPrompt(defaultPrompt)
    setAiReferenceImage(null)
    setShowAiModal(true)
  }, [config, user?.niche])

  // Regenera o prompt quando o usuario anexa/remove imagem de referencia
  // (sem sobrescrever edicoes manuais se o prompt ja foi alterado)
  const lastAutoPromptRef = useRef<string>('')
  useEffect(() => {
    if (!showAiModal) return
    const autoPrompt = buildAiPrompt({
      niche: user?.niche,
      format: config.format,
      carouselShape: config.carouselShape,
      slideTotal: config.format === 'carousel' ? config.carouselSlides : undefined,
      productName: config.productName,
      headline: config.headline,
      extraText: config.extraText,
      postType: config.postType,
      hasReferenceImage: !!aiReferenceImage,
    })
    // So atualiza se o prompt atual for o ultimo auto-gerado (ou seja, nao foi editado manualmente)
    if (aiPrompt === lastAutoPromptRef.current || lastAutoPromptRef.current === '') {
      setAiPrompt(autoPrompt)
    }
    lastAutoPromptRef.current = autoPrompt
  }, [aiReferenceImage, showAiModal]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---------- Handle existing card upload (imagem ou video) ----------
  const handleExistingCardUpload = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      toast.error('Selecione uma imagem ou video')
      return
    }
    const maxMb = isVideo ? 100 : 20
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Arquivo muito grande (max ${maxMb}MB)`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setExistingCardPreview(reader.result as string)
      setExistingMediaType(isVideo ? 'video' : 'image')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleConfirmExistingCard = useCallback(() => {
    if (!existingCardPreview) return
    updateConfig('imageUrl', existingCardPreview)
    updateConfig('imageLayout', 'external')
    updateConfig('includeImage', true)
    updateConfig('mediaType', existingMediaType)
    updateConfig('cta', 'nenhum')
    updateConfig('display', { showLogo: false, showCta: true, showPrice: true, showOriginalPrice: true })
    setStartChoice('existing')
    setShowStartChoice(false)
    setShowExistingUpload(false)
  }, [existingCardPreview, existingMediaType, updateConfig])

  // ---------- Generate full card/carousel with AI (texto + imagens) ----------
  const handleGenerateImage = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite um prompt')
      return
    }

    const isCarouselFmt = config.format === 'carousel'
    const total = isCarouselFmt ? config.carouselSlides : 1

    setGeneratingImage(true)
    const progressToast = toast.loading(
      isCarouselFmt
        ? `Aguarde, estamos gerando o carrossel (${total} slides)...`
        : 'Aguarde, estamos gerando sua imagem com IA...',
    )

    try {
      // 1. Pede ao LLM um plano COMPLETO de conteudo (texto + imagePrompt por slide)
      toast.loading('Gerando conteudo dos cards...', { id: progressToast })
      const plan = await api.post<{
        productName: string
        objective: string
        palette: string
        fontFamily: string
        slides: Array<{ headline: string; subtext: string; cta: string; imagePrompt: string }>
      }>('/api/cards/generate-content-plan', {
        format: config.format,
        carouselShape: config.carouselShape,
        slideTotal: total,
        niche: user?.niche,
        postType: config.postType,
        userPrompt: aiPrompt,
        productName: config.productName,
        hasReferenceImage: !!aiReferenceImage,
      })

      const planSlides = plan?.slides || []
      if (!planSlides.length) {
        toast.error('Não foi possivel gerar o conteudo. Tente novamente.', { id: progressToast })
        return
      }

      // 2. Aplica os textos imediatamente para o usuario ver o progresso
      const carouselContents: CarouselSlideContent[] = planSlides.map((s) => ({
        headline: s.headline || '',
        subtext: s.subtext || '',
        cta: s.cta || config.cta,
      }))

      setConfig((prev) => {
        const allowedPalettes = ['vibrante', 'profissional', 'quente', 'elegante'] as const
        const allowedFonts = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Bebas Neue', 'Playfair Display', 'Oswald', 'Raleway', 'Lato', 'Open Sans'] as const
        const palette = (allowedPalettes as readonly string[]).includes(plan.palette)
          ? (plan.palette as PaletteId)
          : prev.palette
        const fontFamily = (allowedFonts as readonly string[]).includes(plan.fontFamily)
          ? (plan.fontFamily as FontFamily)
          : prev.fontFamily
        const first = planSlides[0]
        return {
          ...prev,
          productName: plan.productName || prev.productName,
          palette,
          fontFamily,
          headline: first?.headline || prev.headline,
          extraText: first?.subtext || prev.extraText,
          cta: first?.cta || prev.cta,
          carouselSlideContents: carouselContents,
        }
      })

      // 3. Gera uma imagem por slide usando o imagePrompt da IA
      const slideImages: string[] = []
      for (let i = 0; i < total; i++) {
        toast.loading(
          isCarouselFmt
            ? `Gerando imagem ${i + 1}/${total}...`
            : 'Gerando imagem...',
          { id: progressToast },
        )
        const imgPrompt = planSlides[i]?.imagePrompt || aiPrompt
        try {
          const result = await api.post<{ image: string }>('/api/cards/generate-image', {
            prompt: imgPrompt,
            format: config.format,
            carouselShape: config.carouselShape,
            referenceImage: aiReferenceImage || undefined,
          })
          slideImages.push(result.image || '')
        } catch (err: any) {
          console.error(`[cards] Erro no slide ${i + 1}:`, err)
          slideImages.push('')
        }
      }

      const firstImg = slideImages.find((u) => !!u)
      if (!firstImg) {
        toast.error('Conteudo gerado, mas falhou ao gerar imagens', { id: progressToast })
      } else {
        setConfig((prev) => ({
          ...prev,
          includeImage: true,
          imageUrl: firstImg,
          slideImageUrls: isCarouselFmt ? slideImages : [],
          imageLayout: 'background',
          imageOpacity: 100,
          imageBlur: 0,
        }))
        const okCount = slideImages.filter(Boolean).length
        toast.success(
          isCarouselFmt
            ? `Carrossel pronto! ${okCount}/${total} imagens geradas`
            : 'Card gerado com IA!',
          { id: progressToast },
        )
      }
      setShowAiModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar com IA', { id: progressToast })
    } finally {
      setGeneratingImage(false)
    }
  }, [
    aiPrompt, aiReferenceImage,
    config.format, config.carouselShape, config.carouselSlides,
    config.postType, config.productName, config.cta,
    user?.niche,
  ])

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

      const isVideo = config.mediaType === 'video' && !!config.imageUrl

      // Para video: envia o data URL do video; para imagem: captura o preview como PNG
      let imageDataUrl: string | undefined
      let videoDataUrl: string | undefined
      if (isVideo) {
        videoDataUrl = config.imageUrl
      } else if (previewRef.current) {
        try {
          imageDataUrl = await toPng(previewRef.current, { pixelRatio: 1, cacheBust: true })
        } catch { /* ignore capture errors */ }
      }

      await api.patch(`/api/cards/${cardId}/approve`, {
        generated_image_url: imageDataUrl,
        generated_video_url: videoDataUrl,
        slide_image_urls: config.format === 'carousel' && config.slideImageUrls?.length > 0
          ? config.slideImageUrls
          : undefined,
        media_type: isVideo ? 'video' : 'image',
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
      const isVideo = config.mediaType === 'video' && !!config.imageUrl

      let imageDataUrl: string | undefined
      let videoDataUrl: string | undefined
      if (isVideo) {
        videoDataUrl = config.imageUrl
      } else if (previewRef.current) {
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
        generated_video_url: videoDataUrl || undefined,
        media_type: isVideo ? 'video' : 'image',
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
              {/* Generate button — somente quando o modo escolhido é "Gerar com IA" */}
              {startChoice === 'ai' && (
                <>
                  <Button
                    onClick={handleOpenAiModal}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/25 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar com IA
                  </Button>
                  {/* Divider */}
                  <div className="h-8 w-px bg-brand-border hidden sm:block" />
                </>
              )}

              {/* Post type select — agora antes do formato */}
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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEnlargedSlide(activeSlide); setShowEnlargedPreview(true) }}
                    className="gap-1.5 h-7 text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ampliar
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {config.carouselShape === 'vertical' ? 'Vertical 4:5' : 'Quadrado 1:1'} - {getDimensionLabel(config.format, config.carouselShape)}
                  </Badge>
                </div>
              </div>

              {/* Slides row */}
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {Array.from({ length: config.carouselSlides }).map((_, i) => {
                  const objectives = getObjectivesForNiche(user?.niche)
                  const objective = objectives.find((o) => o.id === config.objective)
                  const perSlide = config.carouselSlideContents[i]
                  const slideContent = (perSlide && (perSlide.headline || perSlide.subtext))
                    ? perSlide
                    : getSlideContent(objective, i, config)
                  const perSlideImg = config.slideImageUrls?.[i]
                  const slideConfig: CardConfig = {
                    ...config,
                    headline: slideContent.headline,
                    extraText: slideContent.subtext,
                    cta: slideContent.cta || config.cta,
                    imageUrl: perSlideImg || config.imageUrl,
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
              {/* Section 1: Conteúdo do card */}
              {/* ----------------------------------------------------------- */}
              <Section
                title={isCarousel ? `Conteúdo do card ${activeSlide + 1}` : 'Conteúdo do card'}
                icon={FileText}
                defaultOpen
              >
                {isCarousel && (
                  <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-2 border-b border-brand-border">
                    {Array.from({ length: config.carouselSlides }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={cn(
                          'flex-shrink-0 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors border-b-2 -mb-[2px]',
                          activeSlide === i
                            ? 'bg-primary-500/10 text-primary-300 border-primary-500'
                            : 'bg-transparent text-gray-500 hover:text-gray-300 border-transparent'
                        )}
                      >
                        Card {i + 1}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product name (compartilhado entre slides) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="productName">
                      Nome do produto <span className="text-red-400">*</span>
                      {isCarousel && <span className="ml-2 text-[10px] text-gray-500">(compartilhado)</span>}
                    </Label>
                    <Input
                      id="productName"
                      placeholder="Ex: Smartphone Galaxy S24"
                      value={config.productName}
                      onChange={(e) => updateConfig('productName', e.target.value)}
                    />
                  </div>

                  {/* Tema / Objetivo (compartilhado) */}
                  <div className="space-y-1.5">
                    <Label>
                      Tema / Objetivo
                      {isCarousel && <span className="ml-2 text-[10px] text-gray-500">(compartilhado)</span>}
                    </Label>
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

                  {/* Headline (por slide no carrossel) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="headline">
                      Headline (opcional)
                      {isCarousel && <span className="ml-2 text-[10px] text-primary-400">(so este slide)</span>}
                    </Label>
                    <Input
                      id="headline"
                      placeholder="Texto acima do titulo (eyebrow)"
                      value={isCarousel ? (config.carouselSlideContents[activeSlide]?.headline ?? '') : config.headline}
                      onChange={(e) => {
                        if (isCarousel) {
                          updateSlideContent(activeSlide, 'headline', e.target.value)
                        } else {
                          updateConfig('headline', e.target.value)
                        }
                      }}
                    />
                  </div>

                  {/* Prices - only for promocao (compartilhado) */}
                  {config.postType === 'promocao' && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="originalPrice">Preço original</Label>
                        <Input
                          id="originalPrice"
                          placeholder="199,90"
                          value={config.originalPrice}
                          onChange={(e) => updateConfig('originalPrice', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="promoPrice">Preço promocional</Label>
                        <Input
                          id="promoPrice"
                          placeholder="149,90"
                          value={config.promoPrice}
                          onChange={(e) => updateConfig('promoPrice', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Extra text (por slide no carrossel) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="extraText">
                      Texto adicional
                      {isCarousel && <span className="ml-2 text-[10px] text-primary-400">(so este slide)</span>}
                    </Label>
                    <Input
                      id="extraText"
                      placeholder="Descrição breve do produto ou serviço..."
                      value={isCarousel ? (config.carouselSlideContents[activeSlide]?.subtext ?? '') : config.extraText}
                      onChange={(e) => {
                        if (isCarousel) {
                          updateSlideContent(activeSlide, 'subtext', e.target.value)
                        } else {
                          updateConfig('extraText', e.target.value)
                        }
                      }}
                    />
                  </div>

                  {/* CTA (por slide no carrossel) */}
                  <div className="space-y-1.5">
                    <Label>
                      Destino do CTA
                      {isCarousel && <span className="ml-2 text-[10px] text-primary-400">(so este slide)</span>}
                    </Label>
                    <Select
                      value={isCarousel ? (config.carouselSlideContents[activeSlide]?.cta ?? config.cta) : config.cta}
                      onValueChange={(v) => {
                        if (isCarousel) updateSlideContent(activeSlide, 'cta', v)
                        else updateConfig('cta', v)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o CTA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
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

                  {/* CTA Destination URL (compartilhado) */}
                  <div className={`space-y-1.5 sm:col-span-2${config.cta === 'nenhum' ? ' hidden' : ''}`}>
                    <Label htmlFor="ctaUrl">
                      {config.cta === 'Chame no WhatsApp' ? 'WhatsApp (com DDD)' :
                       config.cta === 'Ligue agora' ? 'Telefone (com DDD)' :
                       config.cta === 'Siga no Instagram' ? 'Perfil do Instagram' :
                       'Link de destino'}
                      {isCarousel && <span className="ml-2 text-[10px] text-gray-500">(compartilhado)</span>}
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
                <Section title="Opções do Carrossel" icon={Layers} defaultOpen>
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
                      <Label className="text-xs">Primária</Label>
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
                      <Label className="text-xs">Secundária</Label>
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
              {/* Section: Temas */}
              {/* ----------------------------------------------------------- */}
              <Section title="Temas visuais" icon={Palette} defaultOpen={false}>
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">Aplique um tema visual ao card. O tema ajusta apenas cores e tipografia — sem alterar o layout da imagem.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Nenhum — restaura defaults de cor e fonte */}
                    <button
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          palette: DEFAULT_CONFIG.palette,
                          fontFamily: DEFAULT_CONFIG.fontFamily,
                          customColors: { ...DEFAULT_CONFIG.customColors },
                          textColor: DEFAULT_CONFIG.textColor,
                          titleColor: DEFAULT_CONFIG.titleColor,
                        }))
                        setDirtyAfterApprove(true)
                        toast.success('Tema removido')
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:border-gray-500 hover:bg-brand-surface transition-all text-left group"
                    >
                      <div className="flex-shrink-0 flex gap-1">
                        <div className="w-6 h-10 rounded-md bg-gray-700 flex items-center justify-center">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 group-hover:text-white">Nenhum</p>
                        <p className="text-xs text-gray-500">Volta ao padrão de cores e fonte</p>
                      </div>
                      <div className="text-gray-600 group-hover:text-gray-300 transition-colors text-xs">
                        Aplicar →
                      </div>
                    </button>
                    {getThemesForPostType(config.postType).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            palette: theme.apply.palette ?? prev.palette,
                            fontFamily: theme.apply.fontFamily ?? prev.fontFamily,
                            customColors: theme.apply.palette === 'custom' ? theme.colors : prev.customColors,
                          }))
                          setDirtyAfterApprove(true)
                          toast.success(`Tema "${theme.label}" aplicado!`)
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-brand-border hover:border-primary-500/50 hover:bg-brand-surface transition-all text-left group"
                      >
                        {/* Color preview */}
                        <div className="flex-shrink-0 flex gap-1">
                          <div className="w-6 h-10 rounded-md" style={{ backgroundColor: theme.colors.bg }} />
                          <div className="flex flex-col gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.primary }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.secondary }} />
                          </div>
                        </div>
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white">{theme.label}</p>
                          <p className="text-xs text-gray-500 truncate">{theme.description}</p>
                        </div>
                        {/* Apply arrow */}
                        <div className="text-gray-600 group-hover:text-primary-400 transition-colors text-xs">
                          Aplicar →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              {/* ----------------------------------------------------------- */}
              {/* Section: Imagem */}
              {/* ----------------------------------------------------------- */}
              <Section title="Imagem" icon={ImageIcon}>
                <div className="space-y-4">
                      {/* Toggle incluir imagem */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Incluir imagem no card</Label>
                        <Switch
                          checked={config.includeImage}
                          onCheckedChange={(v) => updateConfig('includeImage', v)}
                        />
                      </div>

                      {/* Dropzone unificado: URL + drag-drop + upload num só bloco */}
                      <ImageDropzone
                        value={config.imageUrl}
                        onChange={(url) => setImage('image1', url)}
                        onClear={() => setImage('image1', '')}
                        onPickFromLibrary={() => { setMediaPickerTarget('image1'); setShowMediaPicker(true) }}
                        libraryCount={mediaItems.length}
                      />

                      {/* Image 2 (dual-product / side-by-side / side-frame) */}
                      {(config.imageLayout === 'dual-product' || config.imageLayout === 'side-by-side' || config.imageLayout === 'side-frame') && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Imagem 2 (produto inferior)</Label>
                          <ImageDropzone
                            value={config.imageUrl2}
                            onChange={(url) => setImage('image2', url)}
                            onClear={() => setImage('image2', '')}
                            onPickFromLibrary={() => { setMediaPickerTarget('image2'); setShowMediaPicker(true) }}
                            libraryCount={mediaItems.length}
                            libraryLabel="Escolher 2ª imagem da biblioteca"
                          />
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
              {/* Section: Opções de exibição */}
              {/* ----------------------------------------------------------- */}
              <Section title="Opções de exibição" icon={Eye}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Incluir logo</Label>
                    <Switch
                      checked={config.display.showLogo}
                      onCheckedChange={(v) => {
                        updateDisplay('showLogo', v)
                        if (v && user?.logo_url && !config.logoUrl) {
                          updateConfig('logoUrl', user.logo_url)
                        }
                      }}
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
                        <Label className="text-sm">Incluir preço</Label>
                        <Switch
                          checked={config.display.showPrice}
                          onCheckedChange={(v) => updateDisplay('showPrice', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Mostrar preço original riscado</Label>
                        <Switch
                          checked={config.display.showOriginalPrice}
                          onCheckedChange={(v) => updateDisplay('showOriginalPrice', v)}
                        />
                      </div>
                    </>
                  )}
                  {/* Type badge position — so aparece quando ha um tipo de post selecionado */}
                  {config.postType !== 'nenhum' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400">Posicao do badge de categoria</Label>
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
                  )}

                  {/* Logo URL, size and position */}
                  {config.display.showLogo && (
                    <div className="space-y-4">
                      {/* Logo URL auto-fill */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-400">Logo da empresa</Label>
                          {user?.logo_url && (
                            <button
                              onClick={() => updateConfig('logoUrl', user.logo_url || '')}
                              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              Usar logo da empresa
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="URL da logo"
                            value={config.logoUrl}
                            onChange={(e) => updateConfig('logoUrl', e.target.value)}
                            className="flex-1 text-xs h-8"
                          />
                          {config.logoUrl && (
                            <button onClick={() => updateConfig('logoUrl', '')} className="text-gray-500 hover:text-red-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Logo size */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-gray-400">Tamanho do logo</Label>
                          <span className="text-xs text-gray-500">{config.logoSize || 36}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="80"
                          value={config.logoSize || 36}
                          onChange={(e) => updateConfig('logoSize', Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                      </div>

                      {/* Logo position */}
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
                      { key: 'price' as const, label: 'Preço', min: 18, max: 56 },
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
                      <Label className="text-xs">Cor do título</Label>
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
              <Section title="Posição do texto" icon={Move}>
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
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEnlargedSlide(0); setShowEnlargedPreview(true) }}
                          className="gap-1.5 h-7 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ampliar
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          {FORMAT_OPTIONS.find((f) => f.id === config.format)?.label} - {getDimensionLabel(config.format, config.carouselShape)}
                        </Badge>
                      </div>
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
              {config.format === 'carousel' ? 'Gerar carrossel com IA' : config.format === 'stories' ? 'Gerar story com IA' : 'Gerar card com IA'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              A IA vai gerar {config.format === 'carousel' ? `os ${config.carouselSlides} slides completos` : 'o card completo'} (produto, titulos, textos, CTAs e imagens) com base no seu nicho e briefing abaixo. Voce pode ajustar tudo depois.
            </p>
            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-gray-300">Briefing para a IA (opcional)</Label>
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
                {generatingImage
                  ? (config.format === 'carousel' ? 'Gerando carrossel...' : 'Gerando...')
                  : (config.format === 'carousel' ? 'Gerar carrossel' : 'Gerar com IA')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlarged Preview Modal */}
      {showEnlargedPreview && (() => {
        const objectives = getObjectivesForNiche(user?.niche)
        const objective = objectives.find((o) => o.id === config.objective)
        const idx = isCarousel ? enlargedSlide : 0
        const perSlide = config.carouselSlideContents[idx]
        const slideContent = isCarousel && perSlide && (perSlide.headline || perSlide.subtext)
          ? perSlide
          : isCarousel
            ? getSlideContent(objective, idx, config)
            : { headline: config.headline, subtext: config.extraText, cta: config.cta }
        const slideImg = isCarousel ? (config.slideImageUrls?.[idx] || config.imageUrl) : config.imageUrl
        const enlargedConfig: CardConfig = {
          ...config,
          headline: slideContent.headline || config.headline,
          extraText: slideContent.subtext || config.extraText,
          cta: slideContent.cta || config.cta,
          imageUrl: slideImg || config.imageUrl,
        }
        const dims = getPreviewDimensions(config.format, config.carouselShape)
        // Escala para caber em 85vh
        const maxH = typeof window !== 'undefined' ? window.innerHeight * 0.82 : 720
        const maxW = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.9, 900) : 720
        const scale = Math.min(maxH / dims.h, maxW / dims.w, 2)
        return (
          <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setShowEnlargedPreview(false)}
          >
            <button
              onClick={() => setShowEnlargedPreview(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {isCarousel && (
              <div className="absolute top-4 left-4 text-xs text-gray-400">
                Slide {idx + 1} de {config.carouselSlides}
              </div>
            )}

            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: dims.w * scale, height: dims.h * scale }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <CardPreview config={enlargedConfig} previewRef={null} companyName={companyName} />
              </div>
            </div>

            {isCarousel && (
              <div className="mt-6 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEnlargedSlide((i) => Math.max(0, i - 1))}
                  disabled={idx === 0}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1.5 px-3">
                  {Array.from({ length: config.carouselSlides }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEnlargedSlide(i)}
                      className={cn('w-2 h-2 rounded-full transition-all', idx === i ? 'bg-primary-500 w-5' : 'bg-gray-600 hover:bg-gray-400')}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEnlargedSlide((i) => Math.min(config.carouselSlides - 1, i + 1))}
                  disabled={idx === config.carouselSlides - 1}
                >
                  Próximo
                </Button>
              </div>
            )}
          </div>
        )
      })()}

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
                          setImage(mediaPickerTarget === 'image2' ? 'image2' : 'image1', item.url)
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
