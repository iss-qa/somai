import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export const SITE = {
  name: 'Soma.AI',
  tagline: 'Plataforma de Marketing com IA',
  description:
    'Plataforma de marketing com IA para pequenas empresas. Geramos posts, vídeos, roteiros, campanhas e mensagens no WhatsApp — automaticamente, no seu estilo, todos os dias, de forma simples, rápida e objetiva.',
  url: 'https://somai.issqa.com.br',
  appUrl: 'https://somai.issqa.com.br/login',
  whatsapp: 'https://wa.me/5571996838735?text=Quero%20conhecer%20a%20Soma.AI',
  whatsappNumber: '5571996838735',
} as const
