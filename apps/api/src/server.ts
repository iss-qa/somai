import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') })

import { getApp } from './app'

// Workers (auto-start on import)
import './workers/video.worker'
import './workers/campaign.worker'

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
}

bootstrap()
