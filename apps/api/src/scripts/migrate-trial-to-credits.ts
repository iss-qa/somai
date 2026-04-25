/**
 * Migracao: substituir modelo TRIAL (dias) pelo modelo CREDITOS.
 *
 * O que faz:
 *   1. Toda Company com status='trial' vira status='active', access_enabled=true
 *   2. Limpa trial_expires_at e trial_days (seta pra null/0)
 *   3. Garante Gamificacao com creditos >= 25 pra essas empresas
 *      (quem ja tem mais, mantem; quem tem menos, sobe pra 25)
 *
 * Idempotente. Pode rodar varias vezes sem dano.
 *
 * Rodar:
 *   cd apps/api && pnpm tsx src/scripts/migrate-trial-to-credits.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB, Company, Gamificacao } from '@soma-ai/db'

const CREDITOS_INICIAIS = 25

async function main() {
  await connectDB(
    process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev',
  )
  console.log('[migrate] conectado ao MongoDB')

  const trialCompanies = await Company.find({ status: 'trial' }).lean()
  console.log(`[migrate] ${trialCompanies.length} empresa(s) em status=trial`)

  let converted = 0
  let creditsSeeded = 0

  for (const c of trialCompanies) {
    const cid = (c as any)._id

    // 1. Converte Company: trial -> active + enabled + limpa trial_*
    await Company.updateOne(
      { _id: cid },
      {
        $set: {
          status: 'active',
          access_enabled: true,
          trial_days: 0,
          trial_expires_at: null,
        },
      },
    )
    converted++

    // 2. Garante gamificacao com >= 25 creditos
    const gam: any = await Gamificacao.findOne({ company_id: cid }).lean()
    if (!gam) {
      await Gamificacao.create({
        company_id: cid,
        xp: 0,
        nivel: 'INICIANTE',
        creditos: CREDITOS_INICIAIS,
        ofensiva: 0,
        maiorOfensiva: 0,
        ultimaAtividade: null,
        rankingMes: 0,
        creditosMes: 0,
        promptsRefinados: 0,
        mesReferencia: new Date().toISOString().slice(0, 7),
        conquistasIds: [],
        missoesCompletasIds: [],
      })
      creditsSeeded++
      console.log(`  + gamificacao criada p/ ${c.name} (${CREDITOS_INICIAIS}cr)`)
    } else if ((gam.creditos || 0) < CREDITOS_INICIAIS) {
      const diff = CREDITOS_INICIAIS - (gam.creditos || 0)
      await Gamificacao.updateOne(
        { company_id: cid },
        { $inc: { creditos: diff } },
      )
      creditsSeeded++
      console.log(
        `  + ${c.name}: creditos ${gam.creditos || 0} -> ${CREDITOS_INICIAIS}`,
      )
    }
  }

  // 3. Garante que TODAS as companies (nao-canceladas) tenham >= 25 creditos
  //    — cria Gamificacao pra quem nao tem, e bumpa saldo pra quem tem < 25
  const allCompanies = await Company.find(
    { status: { $ne: 'cancelled' } },
    { _id: 1, name: 1 },
  ).lean()
  let backfilled = 0
  let bumped = 0
  for (const c of allCompanies) {
    const cid = (c as any)._id
    const exists: any = await Gamificacao.findOne({ company_id: cid })
      .select('_id creditos')
      .lean()
    if (!exists) {
      await Gamificacao.create({
        company_id: cid,
        xp: 0,
        nivel: 'INICIANTE',
        creditos: CREDITOS_INICIAIS,
        ofensiva: 0,
        maiorOfensiva: 0,
        ultimaAtividade: null,
        rankingMes: 0,
        creditosMes: 0,
        promptsRefinados: 0,
        mesReferencia: new Date().toISOString().slice(0, 7),
        conquistasIds: [],
        missoesCompletasIds: [],
      })
      backfilled++
    } else if ((exists.creditos || 0) < CREDITOS_INICIAIS) {
      const diff = CREDITOS_INICIAIS - (exists.creditos || 0)
      await Gamificacao.updateOne(
        { company_id: cid },
        { $inc: { creditos: diff } },
      )
      bumped++
    }
  }

  console.log('[migrate] concluido:')
  console.log(`  - trial -> active: ${converted}`)
  console.log(`  - creditos ajustados (trial loop): ${creditsSeeded}`)
  console.log(`  - gamificacao criada (backfill): ${backfilled}`)
  console.log(`  - creditos bumpados pra >= ${CREDITOS_INICIAIS} (backfill): ${bumped}`)
  console.log(`  - total empresas varridas: ${allCompanies.length}`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('[migrate] erro:', err)
  process.exit(1)
})
