/* ──────────────────────────────────────────────
 * Soma.ai — Shared Constants
 * ────────────────────────────────────────────── */

import { CardFormat, Niche, PlanSlug, PostType } from '../enums';

// ── Plans ────────────────────────────────────

export const PLAN_STARTER = {
  name: 'Starter',
  slug: PlanSlug.Starter,
  setup_price: 297,
  monthly_price: 39.9,
  features: {
    instagram: true,
    facebook: false,
    cards_limit: -1,
    video_generation: false,
    videos_per_day: 0,
    scripts: false,
    whatsapp: false,
    campaigns: false,
    date_suggestions: false,
    analytics: false,
  },
} as const;

export const PLAN_PRO = {
  name: 'Pro',
  slug: PlanSlug.Pro,
  setup_price: 497,
  monthly_price: 69.9,
  features: {
    instagram: true,
    facebook: true,
    cards_limit: -1,
    video_generation: true,
    videos_per_day: 2,
    scripts: true,
    whatsapp: true,
    campaigns: true,
    date_suggestions: true,
    analytics: true,
  },
} as const;

export const PLAN_ENTERPRISE = {
  name: 'Enterprise',
  slug: PlanSlug.Enterprise,
  setup_price: 720,
  monthly_price: 89.9,
  features: {
    instagram: true,
    facebook: true,
    cards_limit: -1,
    video_generation: true,
    videos_per_day: 5,
    scripts: true,
    whatsapp: true,
    campaigns: true,
    date_suggestions: true,
    analytics: true,
  },
} as const;

// ── Niche Options ────────────────────────────

export const NICHE_OPTIONS = [
  { value: Niche.Farmacia, label: 'Farmacia' },
  { value: Niche.Pet, label: 'Pet Shop' },
  { value: Niche.Moda, label: 'Moda' },
  { value: Niche.Cosmeticos, label: 'Cosmeticos' },
  { value: Niche.Mercearia, label: 'Mercearia' },
  { value: Niche.Calcados, label: 'Calcados' },
  { value: Niche.Outro, label: 'Outro' },
] as const;

// ── Post Type Options ────────────────────────

export const POST_TYPE_OPTIONS = [
  { value: PostType.Promocao, label: 'Promocao' },
  { value: PostType.Dica, label: 'Dica' },
  { value: PostType.Novidade, label: 'Novidade' },
  { value: PostType.Institucional, label: 'Institucional' },
  { value: PostType.DataComemorativa, label: 'Data Comemorativa' },
] as const;

// ── Card Format Options ──────────────────────

export const CARD_FORMAT_OPTIONS = [
  { value: CardFormat.Feed1x1, label: 'Feed 1:1' },
  { value: CardFormat.Stories9x16, label: 'Stories 9:16' },
  { value: CardFormat.Reels, label: 'Reels' },
  { value: CardFormat.Carousel, label: 'Carousel' },
] as const;

// ── Billing Due Day Options ──────────────────

export const BILLING_DUE_DAY_OPTIONS = [1, 5, 10, 15, 20] as const;
