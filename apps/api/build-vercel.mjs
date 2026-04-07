import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// 1. Bundle app code (workspace packages inlined, npm deps external)
const externals = [
  'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart',
  'mongoose', 'bcryptjs', 'ioredis', 'bullmq', 'date-fns', 'dotenv', 'jose',
].map(p => `--external:${p}`).join(' ')

try {
  execSync(
    `node_modules/.bin/esbuild api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/app.js --format=cjs ${externals}`,
    { stdio: 'inherit' }
  )
} catch {
  execSync(
    `npx -y esbuild api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/app.js --format=cjs ${externals}`,
    { stdio: 'inherit' }
  )
}

// 2. Create a wrapper that properly exports the handler for Vercel
writeFileSync(`${FUNC}/index.js`, `
const app = require('./app.js');
const handler = app.default || app;
module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  }
};
`)

// 3. Install npm deps
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
const deps = Object.fromEntries(
  Object.entries(pkg.dependencies).filter(([, v]) => !v.startsWith('workspace:'))
)
writeFileSync(`${FUNC}/package.json`, JSON.stringify({
  name: 'somai-api-func',
  private: true,
  dependencies: deps,
}))
console.log('Installing production dependencies...')
execSync('npm install --omit=dev --no-package-lock', { cwd: FUNC, stdio: 'inherit' })

// 4. Function config
writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  maxDuration: 30,
}))

// 5. Routing
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/api/index' },
  ],
}))

console.log('Build complete')
