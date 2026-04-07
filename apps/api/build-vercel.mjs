import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// Bundle everything into a single CJS file
try {
  execSync(
    `node_modules/.bin/esbuild api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/index.js --format=cjs`,
    { stdio: 'inherit' }
  )
} catch {
  // Fallback: try npx
  execSync(
    `npx -y esbuild api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/index.js --format=cjs`,
    { stdio: 'inherit' }
  )
}

// Function config
writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  maxDuration: 30,
  launcherType: 'Nodejs',
}))

// Routing config
mkdirSync('.vercel/output', { recursive: true })
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/api/index' },
  ],
}))

console.log('Vercel build output created')
