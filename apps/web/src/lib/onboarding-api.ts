import { api } from './api'

export type OnboardingStep =
  | 'inicio'
  | 'analise'
  | 'objetivo'
  | 'marca'
  | 'publico'
  | 'identidade'
  | 'estilo'
  | 'completo'

export type Objetivo = 'vender' | 'autoridade' | 'engajamento' | 'leads'

export type TomDeVoz =
  | 'descontraido'
  | 'profissional'
  | 'inspirador'
  | 'educativo'
  | 'divertido'
  | 'acolhedor'
  | 'direto'
  | 'sofisticado'
  | 'amigavel'
  | 'motivacional'

export type EstiloVisual =
  | 'minimalista'
  | 'colorido'
  | 'elegante'
  | 'moderno'
  | 'rustico'
  | 'feminino'
  | 'corporativo'

export interface BrandExtraction {
  marca: {
    nome: string
    descricao: string
    tag: string
    instagram: string
    site: string
    localizacao: string
    diferencial: string
    produtosServicos: string
  }
  publico: {
    clienteIdeal: string
    dores: string
    desejos: string
  }
  identidade: {
    tomDeVoz: TomDeVoz[]
    personalidade: string
  }
  estiloVisual: {
    cores: string[]
    logoUrl: string
    estilo: EstiloVisual | null
    fontes: string
    paleta: string
    descricao: string
    referenciaUrl: string
  }
}

export interface OnboardingState {
  onboardingCompleto: boolean
  onboardingStep: OnboardingStep
  onboardingFonte: 'instagram' | 'site' | 'manual' | null
  instagramConectado: boolean
  instagramHandle: string
  objetivo: Objetivo | null
  marca: Partial<BrandExtraction['marca']>
  publico: Partial<BrandExtraction['publico']>
  identidade: Partial<BrandExtraction['identidade']>
  estiloVisual: Partial<BrandExtraction['estiloVisual']>
}

export const OnboardingAPI = {
  getState: () => api.get<OnboardingState>('/api/onboarding/state'),

  getMetaConfig: () =>
    api.get<{ appId: string; redirectUri: string; configured: boolean }>(
      '/api/onboarding/meta/config',
    ),

  analyzeInstagram: (code: string, redirectUri: string) =>
    api.post<{
      source: 'instagram'
      handle: string
      profilePictureUrl: string
      extraction: BrandExtraction
    }>('/api/onboarding/analyze/instagram', { code, redirectUri }),

  analyzeWebsite: (url: string) =>
    api.post<{
      source: 'site'
      finalUrl: string
      logoUrl: string
      extraction: BrandExtraction
    }>('/api/onboarding/analyze/website', { url }),

  saveStep: (key: string, data: Record<string, any>) =>
    api.put<{ ok: true; step: string }>(`/api/onboarding/step/${key}`, data),

  complete: () => api.post<{ ok: true }>('/api/onboarding/complete'),

  skipAnalysis: () =>
    api.post<{ ok: true }>('/api/onboarding/skip-analysis'),
}
