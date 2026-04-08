/**
 * Script para sincronizar collections no MongoDB de producao.
 * Roda: npx tsx apps/api/src/scripts/sync-collections.ts
 *
 * O Mongoose cria collections automaticamente ao primeiro insert,
 * mas este script garante que os indexes estao criados.
 */
import path from 'node:path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') })

import mongoose from 'mongoose'
import { connectDB } from '@soma-ai/db'

// Import all models to register them
import '@soma-ai/db'

async function syncCollections() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev'
  console.log(`Conectando a: ${uri.replace(/\/\/[^@]+@/, '//***@')}`)

  await connectDB(uri)

  const db = mongoose.connection.db
  if (!db) {
    console.error('Falha na conexao')
    process.exit(1)
  }

  // List existing collections
  const existing = await db.listCollections().toArray()
  const existingNames = existing.map((c) => c.name)
  console.log(`\nCollections existentes (${existingNames.length}):`)
  existingNames.sort().forEach((n) => console.log(`  - ${n}`))

  // Ensure all model indexes are created (this also creates the collections)
  const modelNames = mongoose.modelNames()
  console.log(`\nModelos registrados (${modelNames.length}):`)

  for (const name of modelNames) {
    const model = mongoose.model(name)
    const collName = model.collection.name
    try {
      await model.createIndexes()
      const wasNew = !existingNames.includes(collName)
      console.log(`  ${wasNew ? '+ CRIADA' : '  OK    '} ${collName}`)
    } catch (err: any) {
      console.log(`  ! ERRO   ${collName}: ${err.message}`)
    }
  }

  console.log('\nSincronizacao concluida!')
  process.exit(0)
}

syncCollections().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
