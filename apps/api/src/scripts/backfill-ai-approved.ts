/**
 * Backfill: promove cards IA antigos (source: 'ai', status: 'draft') para
 * 'approved', preenchendo approved_at, para que apareçam no combobox do
 * modal Agendar Card.
 *
 * Idempotente — so atualiza cards que ainda nao tem status approved.
 *
 * Rodar:
 *   cd apps/api && pnpm tsx src/scripts/backfill-ai-approved.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB, Card } from '@soma-ai/db'

async function run() {
  await connectDB(
    process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev',
  )
  console.log('[backfill] promovendo cards IA draft -> approved...')

  // Tambem cobre cards antigos sem campo source que tem o briefing IA
  // (heuristica usada em GET /api/cards e /api/cards/stats).
  const filter = {
    status: 'draft',
    generated_image_url: { $exists: true, $nin: [null, ''] },
    $or: [
      { source: 'ai' },
      { ai_prompt_used: { $regex: /\*\*Objetivo do Post:\*\*/i } },
    ],
  }

  const total = await Card.countDocuments(filter)
  console.log(`[backfill] ${total} cards elegiveis encontrados.`)

  if (total === 0) {
    await mongoose.disconnect()
    return
  }

  const result = await Card.updateMany(filter, {
    $set: { status: 'approved', approved_at: new Date() },
  })
  console.log(`[backfill] ${result.modifiedCount} cards promovidos.`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('[backfill] erro:', err)
  process.exit(1)
})
