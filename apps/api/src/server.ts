// IMPORTANTE: ./env DEVE ser o primeiro import — carrega o .env antes que
// qualquer outro módulo avalie código que leia process.env. Em ESM todos os
// `import` são hoisted, então `dotenv.config()` chamado no topo do server.ts
// roda TARDE demais (depois dos workers/queues já terem inicializado).
import './env'

import { getApp } from './app'
import { publishDuePosts } from './jobs/publish-due.job'

// Workers (auto-start on import)
import './workers/video.worker'
import './workers/campaign.worker'
import './workers/post.worker'
import './workers/whatsapp.worker'

const PORT = Number(process.env.PORT) || 3001

async function bootstrap() {
  const app = await getApp()

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Soma.ai API running on port ${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // ── Internal publish scheduler ─────────────────────────────────────────
  // ATENCAO: este scheduler NAO roda em Vercel serverless (o processo so vive
  // durante o tempo de cada request). Em producao o agendamento e feito pelo
  // Vercel Cron em apps/web/vercel.json, que chama /api/cron/publish-due a
  // cada 5 minutos.
  //
  // Este setInterval existe apenas para ambiente local (pnpm dev) e deploys
  // self-hosted onde o Node fica rodando continuamente.

  if (process.env.VERCEL !== '1') {
    // Run once on startup to catch any posts that were missed (e.g. server restart)
    publishDuePosts(20).then(({ processed }) => {
      if (processed > 0) console.log(`[Scheduler] Startup: publicados ${processed} posts atrasados`)
    }).catch(() => {})

    setInterval(() => {
      publishDuePosts(10).then(({ processed, results }) => {
        if (processed > 0) {
          const failed = results.filter((r) => r.status === 'failed').length
          console.log(`[Scheduler] ${processed} processados${failed ? `, ${failed} falhas` : ''}`)
        }
      }).catch((err) => {
        console.error('[Scheduler] Erro no ciclo de publicacao:', err.message)
      })
    }, 60_000)
  }
}

bootstrap()
