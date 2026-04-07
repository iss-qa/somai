import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

// 1. Bundle app code with esbuild (workspace packages inlined, npm deps external)
const externals = [
  'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart',
  'mongoose', 'bcryptjs', 'ioredis', 'bullmq', 'date-fns', 'dotenv', 'jose',
].map(p => `--external:${p}`).join(' ')

execSync(
  `npx -y esbuild@0.25.0 api/_handler.ts --bundle --platform=node --target=node20 --outfile=api/index.js --format=cjs ${externals} --footer:js="module.exports=module.exports.default||module.exports;"`,
  { stdio: 'inherit' }
)

console.log('esbuild complete')
