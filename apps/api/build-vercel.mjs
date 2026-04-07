import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// Bundle everything into a single CJS file with correct export for Vercel
const flags = `api/index.ts --bundle --platform=node --target=node20 --outfile=${FUNC}/index.js --format=cjs --footer:js="module.exports=module.exports.default||module.exports;"`
try {
  execSync(`node_modules/.bin/esbuild ${flags}`, { stdio: 'inherit' })
} catch {
  execSync(`npx -y esbuild ${flags}`, { stdio: 'inherit' })
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
