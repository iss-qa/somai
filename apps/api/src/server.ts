import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') })

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
  // Runs every 60 seconds as a self-contained fallback.
  // This ensures posts get published even if:
  //   - Redis is unavailable (BullMQ job was never queued)
  //   - No external cron service is configured
  // Uses findOneAndUpdate with status check to avoid duplicate processing
  // when BullMQ and this scheduler both run.

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

bootstrap()
