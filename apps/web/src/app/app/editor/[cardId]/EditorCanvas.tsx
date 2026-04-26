'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { proxyImageUrl } from '@/lib/proxyImage'

export type Overlay = {
  id: string
  type: 'text' | 'shape' | 'image'
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  z?: number
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number | string
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  preset?: string
  shape?: 'rect' | 'circle' | 'line'
  fill?: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
  imageUrl?: string
  opacity?: number
}

type DragState =
  | { kind: 'move'; startX: number; startY: number; ox: number; oy: number }
  | {
      kind: 'resize'
      handle: 'nw' | 'ne' | 'sw' | 'se'
      startX: number
      startY: number
      ox: number
      oy: number
      ow: number
      oh: number
    }
  | null

type Props = {
  imageUrl?: string
  // Tamanho de referência (ex. 1080x1350) — usado pra escalar fontSize.
  refWidth: number
  refHeight: number
  overlays: Overlay[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChange: (overlays: Overlay[]) => void
  // Quando true, esconde handles/seleção (modo export).
  exporting?: boolean
}

export const EditorCanvas = forwardRef<HTMLDivElement, Props>(function EditorCanvas(
  { imageUrl, refWidth, refHeight, overlays, selectedId, onSelect, onChange, exporting },
  exportRef,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const [drag, setDrag] = useState<DragState>(null)

  // Mantém a ref externa sincronizada com a interna (pra html-to-image).
  useLayoutEffect(() => {
    if (typeof exportRef === 'function') exportRef(wrapRef.current)
    else if (exportRef) (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = wrapRef.current
  })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Escala: fontSize vem em "px @ refWidth" — convertido pra CSS px.
  const scale = size.w / refWidth

  const sortedOverlays = [...overlays].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))

  const update = (id: string, patch: Partial<Overlay>) => {
    onChange(overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  const startMove = useCallback(
    (e: React.PointerEvent, ov: Overlay) => {
      if (exporting) return
      e.stopPropagation()
      const wrap = wrapRef.current
      if (!wrap) return
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      const rect = wrap.getBoundingClientRect()
      onSelect(ov.id)
      setDrag({
        kind: 'move',
        startX: (e.clientX - rect.left) / rect.width,
        startY: (e.clientY - rect.top) / rect.height,
        ox: ov.x,
        oy: ov.y,
      })
    },
    [exporting, onSelect],
  )

  const startResize = useCallback(
    (e: React.PointerEvent, ov: Overlay, handle: 'nw' | 'ne' | 'sw' | 'se') => {
      if (exporting) return
      e.stopPropagation()
      const wrap = wrapRef.current
      if (!wrap) return
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      const rect = wrap.getBoundingClientRect()
      setDrag({
        kind: 'resize',
        handle,
        startX: (e.clientX - rect.left) / rect.width,
        startY: (e.clientY - rect.top) / rect.height,
        ox: ov.x,
        oy: ov.y,
        ow: ov.w,
        oh: ov.h,
      })
    },
    [exporting],
  )

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !selectedId) return
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const dx = x - drag.startX
    const dy = y - drag.startY
    const ov = overlays.find((o) => o.id === selectedId)
    if (!ov) return

    if (drag.kind === 'move') {
      const nx = clamp(drag.ox + dx, -ov.w + 0.02, 1 - 0.02)
      const ny = clamp(drag.oy + dy, -ov.h + 0.02, 1 - 0.02)
      update(ov.id, { x: nx, y: ny })
    } else if (drag.kind === 'resize') {
      let nx = drag.ox
      let ny = drag.oy
      let nw = drag.ow
      let nh = drag.oh
      if (drag.handle.includes('e')) nw = Math.max(0.04, drag.ow + dx)
      if (drag.handle.includes('s')) nh = Math.max(0.04, drag.oh + dy)
      if (drag.handle.includes('w')) {
        nw = Math.max(0.04, drag.ow - dx)
        nx = drag.ox + dx
      }
      if (drag.handle.includes('n')) {
        nh = Math.max(0.04, drag.oh - dy)
        ny = drag.oy + dy
      }
      update(ov.id, { x: nx, y: ny, w: nw, h: nh })
    }
  }

  const onPointerUp = () => setDrag(null)

  return (
    <div
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseDown={() => onSelect(null)}
      data-canvas-export
      className="relative h-full w-full overflow-hidden bg-white select-none"
      style={{ touchAction: 'none' }}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxyImageUrl(imageUrl)}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      )}

      {sortedOverlays.map((ov) => {
        const selected = !exporting && selectedId === ov.id
        const fontPx = (ov.fontSize ?? 48) * scale
        const left = `${ov.x * 100}%`
        const top = `${ov.y * 100}%`
        const width = `${ov.w * 100}%`
        const height = `${ov.h * 100}%`
        return (
          <div
            key={ov.id}
            onPointerDown={(e) => startMove(e, ov)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              transform: ov.rotation ? `rotate(${ov.rotation}deg)` : undefined,
              cursor: exporting ? 'default' : 'move',
              opacity: ov.opacity ?? 1,
              outline: selected ? '2px solid rgba(139, 92, 246, 0.9)' : 'none',
              outlineOffset: selected ? '2px' : 0,
            }}
          >
            {ov.type === 'text' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    ov.textAlign === 'center'
                      ? 'center'
                      : ov.textAlign === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                  fontFamily: ov.fontFamily || 'Inter, sans-serif',
                  fontSize: fontPx,
                  fontWeight: ov.fontWeight ?? 400,
                  fontStyle: ov.fontStyle || 'normal',
                  color: ov.color || '#ffffff',
                  textAlign: ov.textAlign || 'left',
                  lineHeight: 1.15,
                  textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  padding: 4 * scale,
                }}
              >
                {ov.text || 'Texto'}
              </div>
            )}

            {ov.type === 'shape' && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: ov.fill || '#8b5cf6',
                  border: ov.strokeWidth
                    ? `${ov.strokeWidth * scale}px solid ${ov.stroke || '#000'}`
                    : 'none',
                  borderRadius:
                    ov.shape === 'circle'
                      ? '50%'
                      : `${(ov.borderRadius ?? 0) * scale}px`,
                }}
              />
            )}

            {ov.type === 'image' && ov.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxyImageUrl(ov.imageUrl)}
                alt=""
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  // Com borderRadius (ex.: logo auto-adicionada como circulo)
                  // queremos cover pra preencher e cortar os cantos quadrados;
                  // sem borderRadius mantemos contain pra preservar proporcao.
                  objectFit: ov.borderRadius ? 'cover' : 'contain',
                  borderRadius: ov.borderRadius
                    ? `${ov.borderRadius * scale}px`
                    : undefined,
                  pointerEvents: 'none',
                }}
              />
            )}

            {selected && (
              <>
                {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
                  <span
                    key={h}
                    onPointerDown={(e) => startResize(e, ov, h)}
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 12,
                      background: '#fff',
                      border: '2px solid rgb(139, 92, 246)',
                      borderRadius: 9999,
                      cursor:
                        h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize',
                      ...(h === 'nw' && { left: -6, top: -6 }),
                      ...(h === 'ne' && { right: -6, top: -6 }),
                      ...(h === 'sw' && { left: -6, bottom: -6 }),
                      ...(h === 'se' && { right: -6, bottom: -6 }),
                    }}
                  />
                ))}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
