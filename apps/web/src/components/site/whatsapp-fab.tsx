'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { SITE } from '@/lib/utils'

export function WhatsAppFab() {
  const [tipOpen, setTipOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setTipOpen(true), 4500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      <AnimatePresence>
        {mounted && tipOpen && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="relative max-w-[260px] rounded-2xl border border-white/10 bg-brand-card/95 p-4 pr-9 text-sm text-zinc-200 shadow-card backdrop-blur-xl"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setDismissed(true)}
              className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Online agora
            </div>
            <div className="mt-1.5 font-display text-white">Oi! Posso ajudar?</div>
            <div className="mt-1 leading-snug text-zinc-400">
              Tire dúvidas sobre a Soma.AI pelo WhatsApp — respondemos em minutos.
            </div>
            <span
              aria-hidden
              className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-white/10 bg-brand-card/95"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={SITE.whatsapp}
        target="_blank"
        rel="noopener"
        aria-label="Falar conosco no WhatsApp"
        onMouseEnter={() => setTipOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 1 }}
        className="group relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-5px_rgba(37,211,102,0.6)] transition-shadow hover:shadow-[0_14px_40px_-5px_rgba(37,211,102,0.8)]"
      >
        {/* pulse rings */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-70 animate-pulseRing"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-pulseRing"
          style={{ animationDelay: '0.9s' }}
        />

        <svg
          viewBox="0 0 32 32"
          className="relative h-7 w-7"
          fill="currentColor"
          aria-hidden
        >
          <path d="M19.11 17.21c-.27-.14-1.61-.79-1.86-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.35-1.6-1.51-1.87-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.14-.61-1.47-.83-2.01-.22-.53-.45-.46-.61-.46-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.64 1.11 2.82.14.18 1.92 2.94 4.66 4.12.65.28 1.16.45 1.56.58.66.21 1.25.18 1.72.11.52-.08 1.61-.66 1.84-1.29.23-.63.23-1.17.16-1.29-.07-.12-.25-.18-.52-.32zM16 5.33C10.11 5.33 5.33 10.11 5.33 16c0 1.92.5 3.71 1.38 5.27l-1.46 5.35 5.49-1.44A10.63 10.63 0 0 0 16 26.67C21.89 26.67 26.67 21.89 26.67 16S21.89 5.33 16 5.33zm0 19.33a8.62 8.62 0 0 1-4.4-1.2l-.31-.18-3.26.85.87-3.18-.2-.33A8.66 8.66 0 1 1 24.66 16c0 4.78-3.88 8.66-8.66 8.66z" />
        </svg>
      </motion.a>
    </div>
  )
}
