'use client'

import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Instagram,
  Facebook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FORMATOS, STEPS_ORDER, type StepKey } from '../types'
import { WhatsAppIcon } from './WhatsAppIcon'

export function Header({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
        {titulo}
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitulo}</p>
    </div>
  )
}

export function Footer({
  onVoltar,
  onContinuar,
  continuarDisabled,
  continuarLabel,
}: {
  onVoltar: () => void
  onContinuar: () => void
  continuarDisabled?: boolean
  continuarLabel?: ReactNode
}) {
  return (
    <div className="sticky bottom-0 -mx-3 mt-8 flex items-center justify-between border-t border-gray-200 bg-white/80 px-3 py-3 backdrop-blur md:-mx-4 md:px-4 dark:border-gray-800 dark:bg-gray-950/80">
      <button
        type="button"
        onClick={onVoltar}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      <Button
        onClick={onContinuar}
        disabled={continuarDisabled}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
      >
        {continuarLabel || (
          <>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

export function Section({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </div>
      {hint && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {children}
    </div>
  )
}

export function TopSteps({
  step,
  onGoTo,
}: {
  step: StepKey
  onGoTo: (s: StepKey) => void
}) {
  const currentIdx = STEPS_ORDER.findIndex((s) => s.key === step)
  return (
    <div className="sticky top-14 z-10 -mx-3 border-b border-gray-200 bg-white/80 px-3 py-3 backdrop-blur md:-mx-4 md:px-4 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {STEPS_ORDER.map((s, i) => {
          const isDone = i < currentIdx
          const isActive = i === currentIdx
          const clickable = i <= currentIdx
          return (
            <button
              key={s.key}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onGoTo(s.key)}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isDone
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="hidden min-w-0 md:block">
                <div
                  className={`truncate text-xs font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
                >
                  {s.label}
                </div>
                <div className="truncate text-[10px] text-gray-400">
                  {s.hint}
                </div>
              </div>
              {i < STEPS_ORDER.length - 1 && (
                <div
                  className={`hidden h-px flex-1 md:block ${
                    i < currentIdx ? 'bg-purple-300' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BigCard({
  active,
  disabled,
  onClick,
  titulo,
  subtitulo,
  price,
  icon,
  badge,
  footer,
  details,
  highlight,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  titulo: string
  subtitulo: string
  price?: string
  icon: ReactNode
  badge?: ReactNode
  footer?: ReactNode
  details?: string[]
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition md:p-5 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900/40'
          : active
            ? 'border-purple-500 bg-white shadow-lg ring-2 ring-purple-200 dark:bg-gray-900 dark:ring-purple-900/50'
            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900'
      } ${highlight && !active ? 'ring-1 ring-purple-100' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
            disabled
              ? 'bg-gray-200 text-gray-400'
              : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          }`}
        >
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {titulo}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitulo}</p>
      </div>
      {details && (
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {details.map((d, i) => (
            <li key={i}>• {d}</li>
          ))}
        </ul>
      )}
      {price && (
        <div className="mt-auto text-xs font-semibold text-purple-700 dark:text-purple-300">
          🪙 {price}
        </div>
      )}
      {footer}
    </button>
  )
}

export function FormatoCard({
  formato,
  selected,
  onClick,
}: {
  formato: (typeof FORMATOS)[number]
  selected: boolean
  onClick: () => void
}) {
  const Icon = formato.icon
  const PlatIcon =
    formato.plataforma === 'instagram'
      ? Instagram
      : formato.plataforma === 'facebook'
        ? Facebook
        : WhatsAppIcon
  const aspectClass =
    formato.ratio === 'story'
      ? 'aspect-[9/16]'
      : formato.ratio === 'landscape'
        ? 'aspect-[1.91/1]'
        : 'aspect-[4/5]'
  const widthClass =
    formato.ratio === 'story'
      ? 'w-[58%]'
      : formato.ratio === 'landscape'
        ? 'w-[88%]'
        : 'w-[78%]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border-2 p-3 text-left transition ${
        selected
          ? 'border-transparent bg-gradient-to-br ' +
            formato.gradient +
            ' text-white shadow-lg'
          : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      {formato.badge && (
        <span className="absolute right-2 top-2 z-10 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
          {formato.badge}
        </span>
      )}
      <span
        className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
          selected
            ? 'bg-white/25 text-white'
            : formato.plataforma === 'instagram'
              ? 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
              : formato.plataforma === 'facebook'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
        }`}
      >
        <PlatIcon className="h-3 w-3" />
      </span>

      <div
        className={`relative flex min-h-[140px] items-center justify-center rounded-xl py-3 ${
          selected
            ? 'bg-white/15'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900'
        }`}
      >
        {formato.isCarrossel && (
          <>
            <div
              className={`absolute ${aspectClass} ${widthClass} -translate-x-3 -rotate-6 rounded-lg shadow ${
                selected
                  ? 'bg-white/20'
                  : 'bg-white/70 ring-1 ring-gray-200 dark:bg-gray-700/60 dark:ring-gray-700'
              }`}
            />
            <div
              className={`absolute ${aspectClass} ${widthClass} translate-x-3 rotate-6 rounded-lg shadow ${
                selected
                  ? 'bg-white/20'
                  : 'bg-white/70 ring-1 ring-gray-200 dark:bg-gray-700/60 dark:ring-gray-700'
              }`}
            />
          </>
        )}
        <div
          className={`relative z-[1] flex ${aspectClass} ${widthClass} flex-col items-center justify-center rounded-lg shadow-md ${
            selected
              ? 'bg-white/30 backdrop-blur'
              : 'bg-gradient-to-br ' + formato.gradient + ' text-white'
          }`}
        >
          <Icon className="h-6 w-6 opacity-90" />
        </div>
      </div>

      <div>
        <div
          className={`text-sm font-semibold leading-tight ${
            selected ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}
        >
          {formato.label}
        </div>
        <div
          className={`text-[11px] ${
            selected ? 'text-white/85' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {formato.subLabel}
        </div>
      </div>
      <div
        className={`text-[10px] ${
          selected ? 'text-white/75' : 'text-gray-500 dark:text-gray-500'
        }`}
      >
        {formato.size}
      </div>
    </button>
  )
}

export function ObjetivoCard({
  ativo,
  onClick,
  titulo,
  subtitulo,
  icon,
  gradiente,
  tintBg,
  tintIcon,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  subtitulo: string
  icon: ReactNode
  gradiente: string
  tintBg: string
  tintIcon: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition md:p-4 ${
        ativo
          ? `border-transparent bg-gradient-to-br ${gradiente} text-white shadow-md`
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
          ativo ? 'bg-white/25 text-white' : `${tintBg} ${tintIcon}`
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className={`font-semibold ${
            ativo ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}
        >
          {titulo}
        </div>
        <div
          className={`text-xs ${
            ativo ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {subtitulo}
        </div>
      </div>
    </button>
  )
}

export function FonteCard({
  ativo,
  onClick,
  titulo,
  subtitulo,
  icon,
  cor,
  tintBg,
  tintIcon,
  resumo,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  subtitulo: string
  icon: ReactNode
  cor: string
  tintBg: string
  tintIcon: string
  resumo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-2xl border-2 p-3 text-left transition md:p-4 ${
        ativo
          ? `border-transparent bg-gradient-to-br ${cor} text-white shadow-md`
          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          ativo ? 'bg-white/25 text-white' : `${tintBg} ${tintIcon}`
        }`}
      >
        {icon}
      </div>
      <div
        className={`font-semibold ${
          ativo ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}
      >
        {titulo}
      </div>
      {resumo ? (
        <div
          className={`line-clamp-2 text-xs italic ${
            ativo ? 'text-white/95' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          &ldquo;{resumo}&rdquo;
        </div>
      ) : (
        <div
          className={`text-xs ${
            ativo ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {subtitulo}
        </div>
      )}
      {ativo && (
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Selecionado
          </span>
          <span className="underline">Editar</span>
        </div>
      )}
    </button>
  )
}

export function ResumoCardRich({
  label,
  labelBg,
  iconBg,
  icon,
  titulo,
  meta,
}: {
  label: string
  labelBg: string
  iconBg: string
  icon: ReactNode
  titulo: string
  meta?: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${labelBg}`}
        >
          {label}
        </div>
        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {titulo}
        </div>
        {meta && (
          <div className="mt-0.5 flex items-center text-[11px] text-gray-500 dark:text-gray-400">
            {meta}
          </div>
        )}
      </div>
    </div>
  )
}
