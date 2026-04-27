/**
 * Feature flags do MVP. Mantemos o codigo das features desligadas no repo
 * (rotas, componentes e backend continuam funcionando por URL direta) — so
 * removemos os pontos de entrada visiveis (menu, dashboard) ate
 * retomarmos pos-MVP.
 */
export const FEATURES = {
  comunidade: false,
  jornada: false,
  // ranking, nivel iniciante, ofensiva, missoes
  gamificacao: false,
  // banner "Proximo passo" (3 marcos do onboarding gamificado)
  proximoPassoBanner: false,
  // moedas/creditos continuam ativos
  creditos: true,
} as const
