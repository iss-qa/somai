import { mkdirSync, writeFileSync } from 'fs'

const FUNC = '.vercel/output/functions/api/index.func'
mkdirSync(FUNC, { recursive: true })

// MINIMAL TEST: deploy a simple function to verify Build Output API works
writeFileSync(`${FUNC}/index.js`, `
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, env: !!process.env.MONGO_URI, node: process.version }));
};
`)

writeFileSync(`${FUNC}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  maxDuration: 10,
}))

writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', dest: '/api/index' },
  ],
}))

console.log('Minimal test function deployed')
