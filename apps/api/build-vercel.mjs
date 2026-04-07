import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, cpSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// Bundle app code only, keep npm packages as external requires
const flags = [
  'api/index.ts',
  '--bundle',
  '--platform=node',
  '--target=node20',
  `--outfile=${FUNC}/index.js`,
  '--format=cjs',
  '--packages=external',
  '--footer:js=module.exports=module.exports.default||module.exports;',
].join(' ')

try {
  execSync(`node_modules/.bin/esbuild ${flags}`, { stdio: 'inherit' })
} catch {
  execSync(`npx -y esbuild ${flags}`, { stdio: 'inherit' })
}

// Copy node_modules (for external package resolution at runtime)
console.log('Copying node_modules...')
cpSync('node_modules', `${FUNC}/node_modules`, { recursive: true })

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
