/**
 * Seed inicial de missões e conquistas para a v2.0.
 * Idempotente — usa upsert por slug/condicao+titulo.
 *
 * Rodar:
 *   cd apps/api && pnpm tsx src/scripts/seed-gamificacao.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB, Missao, Conquista } from '@soma-ai/db'

interface MissaoSeed {
  titulo: string
  descricao: string
  tipo: 'diaria' | 'semanal' | 'unica'
  condicao:
    | 'gerar_post'
    | 'agendar_post'
    | 'publicar_post'
    | 'analisar_inspiracao'
    | 'completar_wizard'
    | 'criar_calendario_mes'
    | 'streak_7'
    | 'convidar_empresa'
    | 'primeira_pergunta'
    | 'primeira_resposta'
  recompensaXP: number
  recompensaCreditos: number
  meta: number
  icone: string
  ordem: number
}

const MISSOES: MissaoSeed[] = [
  {
    titulo: 'Gere 1 post hoje',
    descricao: 'Crie um post para sua marca hoje',
    tipo: 'diaria',
    condicao: 'gerar_post',
    meta: 1,
    recompensaXP: 10,
    recompensaCreditos: 0,
    icone: 'zap',
    ordem: 10,
  },
  {
    titulo: 'Analise uma inspiracao',
    descricao: 'Salve uma inspiracao do feed da comunidade',
    tipo: 'diaria',
    condicao: 'analisar_inspiracao',
    meta: 1,
    recompensaXP: 5,
    recompensaCreditos: 0,
    icone: 'zap',
    ordem: 20,
  },
  {
    titulo: 'Agende 1 post',
    descricao: 'Agende um post para publicacao futura',
    tipo: 'diaria',
    condicao: 'agendar_post',
    meta: 1,
    recompensaXP: 5,
    recompensaCreditos: 0,
    icone: 'calendar',
    ordem: 30,
  },
  {
    titulo: 'Crie um calendario do mes',
    descricao: 'Use a IA para gerar a pauta do mes inteiro',
    tipo: 'semanal',
    condicao: 'criar_calendario_mes',
    meta: 1,
    recompensaXP: 100,
    recompensaCreditos: 20,
    icone: 'calendar-plus',
    ordem: 40,
  },
  {
    titulo: 'Publique 3 posts nesta semana',
    descricao: 'Publique 3 conteudos em suas redes',
    tipo: 'semanal',
    condicao: 'publicar_post',
    meta: 3,
    recompensaXP: 45,
    recompensaCreditos: 10,
    icone: 'send',
    ordem: 50,
  },
  {
    titulo: 'Complete seu onboarding',
    descricao: 'Configure sua marca em 5 passos',
    tipo: 'unica',
    condicao: 'completar_wizard',
    meta: 1,
    recompensaXP: 50,
    recompensaCreditos: 25,
    icone: 'sparkles',
    ordem: 1,
  },
  {
    titulo: 'Faca sua primeira pergunta na comunidade',
    descricao: 'Troque experiencia com outros empreendedores',
    tipo: 'unica',
    condicao: 'primeira_pergunta',
    meta: 1,
    recompensaXP: 20,
    recompensaCreditos: 50,
    icone: 'message-circle',
    ordem: 60,
  },
]

const CONQUISTAS = [
  {
    slug: 'primeiro_post',
    titulo: 'Primeiro Post',
    descricao: 'Voce gerou seu primeiro post',
    icone: 'trophy',
    cor: '#A855F7',
    condicao: 'gerar_post',
    meta: 1,
    recompensaXP: 10,
    recompensaCreditos: 0,
    ordem: 10,
  },
  {
    slug: 'ofensiva_7_dias',
    titulo: 'Ofensiva de 7 dias',
    descricao: 'Voce postou 7 dias seguidos',
    icone: 'flame',
    cor: '#F97316',
    condicao: 'streak_7',
    meta: 1,
    recompensaXP: 50,
    recompensaCreditos: 20,
    ordem: 20,
  },
  {
    slug: '50_posts',
    titulo: '50 posts criados',
    descricao: 'Voce ja criou 50 conteudos!',
    icone: 'award',
    cor: '#EAB308',
    condicao: 'gerar_post',
    meta: 50,
    recompensaXP: 100,
    recompensaCreditos: 50,
    ordem: 30,
  },
  {
    slug: 'onboarding_completo',
    titulo: 'Tudo pronto!',
    descricao: 'Voce configurou sua marca completamente',
    icone: 'check-circle',
    cor: '#22C55E',
    condicao: 'completar_wizard',
    meta: 1,
    recompensaXP: 50,
    recompensaCreditos: 0,
    ordem: 1,
  },
]

async function run() {
  await connectDB(
    process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev',
  )

  console.log('[seed] Missoes...')
  for (const m of MISSOES) {
    await Missao.findOneAndUpdate(
      { titulo: m.titulo, condicao: m.condicao, tipo: m.tipo },
      { $set: { ...m, ativo: true } },
      { upsert: true },
    )
  }
  console.log(`[seed] ${MISSOES.length} missoes upsertadas.`)

  console.log('[seed] Conquistas...')
  for (const c of CONQUISTAS) {
    await Conquista.findOneAndUpdate(
      { slug: c.slug },
      { $set: { ...c, ativo: true } },
      { upsert: true },
    )
  }
  console.log(`[seed] ${CONQUISTAS.length} conquistas upsertadas.`)

  await mongoose.disconnect()
  console.log('[seed] OK')
}

run().catch((err) => {
  console.error('[seed] erro:', err)
  process.exit(1)
})
