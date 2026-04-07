import { mkdirSync, writeFileSync } from 'fs'

// Use "handler" instead of "api" to avoid conflicts with Vercel's api/ directory auto-detection
const FUNC = '.vercel/output/functions/handler.func'
mkdirSync(FUNC, { recursive: true })

writeFileSync(`${FUNC}/index.js`, `
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, node: process.version, url: req.url }));
};
`)

writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  maxDuration: 10,
}))

mkdirSync('.vercel/output', { recursive: true })
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/handler' },
  ],
}))

console.log('Minimal test function deployed at /handler')
