/**
 * Side-effect module: carrega o .env da raiz do monorepo antes de qualquer
 * outro módulo que leia `process.env`. Importe isto como PRIMEIRO import em
 * todo entry point (server.ts, seed.ts, workers standalone, etc).
 *
 * Sem isto, em ESM os `import` são hoisted e `dotenv.config()` na entry acaba
 * rodando depois da avaliação de módulos dependentes — fazendo variáveis como
 * REDIS_URL/MONGO_URI virem `undefined` e caírem em defaults incorretos.
 */
import path from 'node:path'
import dotenv from 'dotenv'

const envPath = path.resolve(__dirname, '..', '..', '..', '.env')
dotenv.config({ path: envPath })
