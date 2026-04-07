import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// 1. Bundle app code (workspace packages inlined, npm deps external)
const externals = [
  'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart',
  'mongoose', 'bcryptjs', 'ioredis', 'bullmq', 'date-fns', 'dotenv', 'jose',
].map(p => `--external:${p}`).join(' ')

const flags = `api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/index.mjs --format=esm ${externals}`

try {
  execSync(`node_modules/.bin/esbuild ${flags}`, { stdio: 'inherit' })
} catch {
  execSync(`npx -y esbuild ${flags}`, { stdio: 'inherit' })
}

// 2. Create package.json with production deps (exclude workspace packages)
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const deps = Object.fromEntries(
  Object.entries(pkg.dependencies).filter(([, v]) => !v.startsWith('workspace:'))
)
writeFileSync(`${FUNC}/package.json`, JSON.stringify({
  name: 'somai-api-func',
  private: true,
  type: 'module',
  dependencies: deps,
}))

// 3. Install production deps with npm
console.log('Installing production dependencies...')
execSync('npm install --omit=dev --no-package-lock', { cwd: FUNC, stdio: 'inherit' })

// 4. Function config (ESM handler)
writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  maxDuration: 30,
  launcherType: 'Nodejs',
}))

// 5. Routing config
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/api/index' },
  ],
}))

console.log('Vercel build output created')
