// Contatos da Juntix para suporte / ativacao de plano.
// Usar NEXT_PUBLIC_SUPPORT_WHATSAPP / _EMAIL / _PHONE no .env para sobrescrever.

const PHONE_DIGITS = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '5571996838735').replace(/\D/g, '')

export const SUPPORT_CONTACT = {
  phoneDigits: PHONE_DIGITS,
  phoneDisplay: formatBRPhone(PHONE_DIGITS),
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contato@juntix.com.br',
  whatsappUrl(message?: string) {
    const base = `https://wa.me/${PHONE_DIGITS}`
    return message ? `${base}?text=${encodeURIComponent(message)}` : base
  },
  mailtoUrl(subject?: string, body?: string) {
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (body) params.set('body', body)
    const qs = params.toString()
    return `mailto:${this.email}${qs ? `?${qs}` : ''}`
  },
} as const

function formatBRPhone(digits: string): string {
  // 55 71 99683 8735 -> +55 (71) 99683-8735
  const m = digits.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/)
  if (!m) return digits
  return `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}`
}
