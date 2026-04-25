'use client'

import { useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Italic,
  Palette,
  Trash2,
  Type as TypeIcon,
} from 'lucide-react'
import type { Overlay } from './EditorCanvas'
import { FONTS } from './editorTools'

type Props = {
  overlay: Overlay
  onChange: (patch: Partial<Overlay>) => void
  onDelete: () => void
  onLayer: (dir: 'up' | 'down') => void
}

export function FloatingToolbar({ overlay, onChange, onDelete, onLayer }: Props) {
  const [openFont, setOpenFont] = useState(false)
  const [openColor, setOpenColor] = useState(false)
  const isText = overlay.type === 'text'
  const isShape = overlay.type === 'shape'

  return (
    <div className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Color */}
      <div className="relative">
        <ToolbarButton
          title="Cor"
          onClick={() => {
            setOpenColor((v) => !v)
            setOpenFont(false)
          }}
        >
          <Palette className="h-4 w-4" />
          <span
            className="ml-1 inline-block h-3 w-3 rounded-full border border-gray-300"
            style={{
              background: isText
                ? overlay.color || '#fff'
                : overlay.fill || '#8b5cf6',
            }}
          />
        </ToolbarButton>
        {openColor && (
          <Popover>
            <div className="grid grid-cols-6 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-6 w-6 rounded-full border border-gray-200"
                  style={{ background: c }}
                  onClick={() => {
                    onChange(isText ? { color: c } : { fill: c })
                    setOpenColor(false)
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={(isText ? overlay.color : overlay.fill) || '#ffffff'}
              onChange={(e) =>
                onChange(isText ? { color: e.target.value } : { fill: e.target.value })
              }
              className="mt-2 h-8 w-full cursor-pointer rounded"
            />
          </Popover>
        )}
      </div>

      {/* Font (text only) */}
      {isText && (
        <div className="relative">
          <ToolbarButton
            title="Fonte"
            onClick={() => {
              setOpenFont((v) => !v)
              setOpenColor(false)
            }}
          >
            <TypeIcon className="h-4 w-4" />
            <span className="ml-1 max-w-[80px] truncate text-xs">
              {overlay.fontFamily || 'Inter'}
            </span>
          </ToolbarButton>
          {openFont && (
            <Popover>
              <div className="max-h-60 w-44 overflow-y-auto">
                {FONTS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      onChange({ fontFamily: f })
                      setOpenFont(false)
                    }}
                    className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-purple-50 dark:hover:bg-gray-700 ${overlay.fontFamily === f ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40' : ''}`}
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Popover>
          )}
        </div>
      )}

      {/* Size (text only) */}
      {isText && (
        <input
          type="number"
          min={8}
          max={400}
          step={2}
          value={overlay.fontSize ?? 48}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) || 48 })}
          className="h-8 w-14 rounded border border-gray-200 bg-white px-1.5 text-center text-xs dark:border-gray-700 dark:bg-gray-900"
          title="Tamanho"
        />
      )}

      {/* Bold / Italic (text only) */}
      {isText && (
        <>
          <ToolbarButton
            title="Negrito"
            active={Number(overlay.fontWeight ?? 400) >= 700}
            onClick={() =>
              onChange({
                fontWeight: Number(overlay.fontWeight ?? 400) >= 700 ? 400 : 700,
              })
            }
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Itálico"
            active={overlay.fontStyle === 'italic'}
            onClick={() =>
              onChange({
                fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic',
              })
            }
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      {/* Align (text only) */}
      {isText && (
        <>
          <ToolbarButton
            title="Esquerda"
            active={overlay.textAlign === 'left' || !overlay.textAlign}
            onClick={() => onChange({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Centro"
            active={overlay.textAlign === 'center'}
            onClick={() => onChange({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Direita"
            active={overlay.textAlign === 'right'}
            onClick={() => onChange({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}

      {/* Border-radius (shape only) */}
      {isShape && overlay.shape !== 'circle' && (
        <input
          type="number"
          min={0}
          max={999}
          step={2}
          value={overlay.borderRadius ?? 0}
          onChange={(e) => onChange({ borderRadius: Number(e.target.value) || 0 })}
          className="h-8 w-14 rounded border border-gray-200 bg-white px-1.5 text-center text-xs dark:border-gray-700 dark:bg-gray-900"
          title="Arredondamento"
        />
      )}

      <Sep />

      {/* Layer */}
      <ToolbarButton title="Trazer pra frente" onClick={() => onLayer('up')}>
        <ArrowUp className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Enviar pra trás" onClick={() => onLayer('down')}>
        <ArrowDown className="h-4 w-4" />
      </ToolbarButton>

      <Sep />

      {/* Delete */}
      <ToolbarButton title="Excluir" onClick={onDelete} danger>
        <Trash2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  title,
  active,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium transition ${
        danger
          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          : active
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
}

function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-0 top-full z-30 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {children}
    </div>
  )
}

const COLORS = [
  '#ffffff',
  '#000000',
  '#fde047',
  '#fb923c',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#22c55e',
]
