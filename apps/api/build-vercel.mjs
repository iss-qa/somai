import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// 1. Bundle app code (workspace packages inlined, npm deps external)
const externals = [
  'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart',
  'mongoose', 'bcryptjs', 'ioredis', 'bullmq', 'date-fns', 'dotenv', 'jose',
].map(p => `--external:${p}`).join(' ')

const flags = `api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/index.js --format=cjs ${externals} --footer:js="module.exports=module.exports.default||module.exports;"`

try {
  execSync(`node_modules/.bin/esbuild ${flags}`, { stdio: 'inherit' })
} catch {
  execSync(`npx -y esbuild ${flags}`, { stdio: 'inherit' })
}

// 2. Create package.json with production deps for npm install
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
writeFileSync(`${FUNC}/package.json`, JSON.stringify({
  name: 'somai-api-func',
  private: true,
  dependencies: pkg.dependencies,
}))

// 3. Install production deps with npm (flat node_modules, no symlinks)
console.log('Installing production dependencies...')
execSync('npm install --production --no-package-lock', { cwd: FUNC, stdio: 'inherit' })

// 4. Function config
writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
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
