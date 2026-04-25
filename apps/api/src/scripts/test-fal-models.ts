/**
 * Testa 3 modelos fal.ai com o MESMO prompt pra comparar qualidade + custo.
 *
 * Modelos:
 *   A) fal-ai/ideogram/v2         — ~$0.080/img (melhor em texto nitido)
 *   B) fal-ai/ideogram/v2/turbo   — ~$0.050/img (balance)
 *   C) fal-ai/flux/dev            — ~$0.025/img (mais barato + boa qualidade geral)
 *
 * Rodar:
 *   cd apps/api && pnpm tsx src/scripts/test-fal-models.ts
 *
 * Salva em /tmp/soma-fal-test/ e imprime os paths.
 */
import dotenv from 'dotenv'
import path from 'node:path'
// .env vive na raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

import { fal } from '@fal-ai/client'
import fs from 'node:fs/promises'

const OUT_DIR = '/tmp/soma-fal-test'

// Prompt estruturado (mesmo formato do nosso refinar-prompt, adaptado pra farmacia)
const PROMPT = `Objetivo do Post: Promover a Dipirona 500mg com 30% de desconto durante a semana em uma farmacia de bairro, transmitindo confianca e alivio rapido para dor de cabeca.

Headline: DOR DE CABECA? ALIVIO EM MINUTOS!

Corpo do Texto:
- Dipirona 500mg com 30% OFF toda a semana
- Alivio rapido e confiavel pra sua dor de cabeca
- Farmacia de confianca perto de voce

Elementos Visuais: Composicao minimalista e limpa em fundo branco com gradiente sutil em azul claro e verde suave (identidade farmaceutica). Ao centro, uma caixa de Dipirona 500mg bem destacada com embalagem fotorrealista. Ao lado, a mao de uma mulher jovem segurando um copo de agua, criando conexao humana. Particulas de luz delicadas flutuando ao redor. Selo circular "30% OFF" em vermelho no canto superior direito. Tipografia moderna e sans-serif. Ambiente aconchegante mas profissional, transmitindo confianca medica.

Call-to-Action: Comente "DIPIRONA" e receba um cupom especial no direct de @farmaciateste`

const MODELS = [
  { key: 'A_ideogram_v2', endpoint: 'fal-ai/ideogram/v2', custoImg: 0.08 },
  { key: 'B_ideogram_v2_turbo', endpoint: 'fal-ai/ideogram/v2/turbo', custoImg: 0.05 },
  { key: 'C_flux_dev', endpoint: 'fal-ai/flux/dev', custoImg: 0.025 },
]

async function main() {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY nao configurada no .env')
  }
  fal.config({ credentials: process.env.FAL_KEY })

  await fs.mkdir(OUT_DIR, { recursive: true })
  console.log(`[test-fal] saida: ${OUT_DIR}`)
  console.log(`[test-fal] rodando os 3 modelos em paralelo...\n`)

  const results = await Promise.allSettled(
    MODELS.map(async (m) => {
      const t0 = Date.now()
      try {
        // Input adaptado: ideogram aceita aspect_ratio; flux usa image_size
        const isFlux = m.endpoint.includes('flux')
        const input: any = isFlux
          ? {
              prompt: PROMPT,
              image_size: { width: 1080, height: 1920 }, // stories 9:16
              num_inference_steps: 28,
              guidance_scale: 3.5,
            }
          : {
              prompt: PROMPT,
              aspect_ratio: '9:16',
              expand_prompt: true,
              style: 'auto',
            }

        const result: any = await fal.subscribe(m.endpoint, {
          input,
          logs: false,
        })
        const url =
          result?.data?.images?.[0]?.url || result?.images?.[0]?.url
        if (!url) throw new Error('sem URL na resposta')

        // Download
        const res = await fetch(url)
        const buf = Buffer.from(await res.arrayBuffer())
        const ext = (res.headers.get('content-type') || 'image/png').split('/')[1] || 'png'
        const file = path.join(OUT_DIR, `${m.key}.${ext}`)
        await fs.writeFile(file, buf)

        const dt = ((Date.now() - t0) / 1000).toFixed(1)
        return { ...m, file, url, dt, size: buf.length }
      } catch (err: any) {
        const dt = ((Date.now() - t0) / 1000).toFixed(1)
        return { ...m, error: err?.message || String(err), dt }
      }
    }),
  )

  console.log('\n=== RESULTADOS ===\n')
  let totalCusto = 0
  for (const r of results) {
    if (r.status !== 'fulfilled') {
      console.log(`[erro promise] ${r.reason}`)
      continue
    }
    const v = r.value as any
    if (v.error) {
      console.log(`❌ ${v.key}`)
      console.log(`   endpoint: ${v.endpoint}`)
      console.log(`   tempo:    ${v.dt}s`)
      console.log(`   erro:     ${v.error}`)
    } else {
      console.log(`✅ ${v.key}`)
      console.log(`   endpoint: ${v.endpoint}`)
      console.log(`   custo:    $${v.custoImg.toFixed(3)}`)
      console.log(`   tempo:    ${v.dt}s`)
      console.log(`   size:     ${(v.size / 1024).toFixed(0)}kb`)
      console.log(`   arquivo:  ${v.file}`)
      console.log(`   url orig: ${v.url}`)
      totalCusto += v.custoImg
    }
    console.log()
  }
  console.log(`Custo total estimado: $${totalCusto.toFixed(3)}`)
  console.log(`\nAbrir as 3 no Finder: open ${OUT_DIR}`)
}

main().catch((err) => {
  console.error('[test-fal] erro:', err)
  process.exit(1)
})
