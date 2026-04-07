import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// Minimal test function
writeFileSync(`${FUNC}/index.js`, `
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, node: process.version, url: req.url }));
};
`)

writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.js',
  maxDuration: 10,
}))

writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/api/index' },
  ],
}))

// Debug: verify output structure
console.log('Output structure:')
console.log('  .vercel/output:', readdirSync('.vercel/output'))
console.log('  functions/api:', readdirSync('.vercel/output/functions/api'))
console.log('  index.func:', readdirSync(FUNC))
console.log('  handler.js:', readFileSync(`${FUNC}/index.js`, 'utf-8').trim().slice(0, 100))
console.log('  vc-config:', readFileSync(`${FUNC}/.vc-config.json`, 'utf-8'))
console.log('  config.json:', readFileSync('.vercel/output/config.json', 'utf-8'))
