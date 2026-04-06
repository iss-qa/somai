import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') })

import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { connectDB } from '@soma-ai/db'

import dashboardRoutes from './routes/dashboard'
import authRoutes from './routes/auth'
import companiesRoutes from './routes/companies'
import cardsRoutes from './routes/cards'
import postsRoutes from './routes/posts'
import postQueueRoutes from './routes/post-queue'
import campaignsRoutes from './routes/campaigns'
import schedulesRoutes from './routes/schedules'
import videosRoutes from './routes/videos'
import scriptsRoutes from './routes/scripts'
import integrationsRoutes from './routes/integrations'
import webhooksRoutes from './routes/webhooks'
import adminDashboardRoutes from './routes/admin/dashboard'
import adminFinancialRoutes from './routes/admin/financial'
import adminHealthRoutes from './routes/admin/health'
import adminLogsRoutes from './routes/admin/logs'

// Workers (auto-start on import)
import './workers/video.worker'
import './workers/campaign.worker'

const PORT = Number(process.env.PORT) || 3001

async function bootstrap() {
  const app = Fastify({ logger: true })

  // ── Plugins ─────────────────────────────────
  await app.register(cors, {
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    cookie: {
      cookieName: 'soma-token',
      signed: false,
    },
  })

  // ── Database ────────────────────────────────
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev')

  // ── Routes ──────────────────────────────────
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(companiesRoutes, { prefix: '/api/companies' })
  await app.register(cardsRoutes, { prefix: '/api/cards' })
  await app.register(postsRoutes, { prefix: '/api/posts' })
  await app.register(postQueueRoutes, { prefix: '/api/post-queue' })
  await app.register(campaignsRoutes, { prefix: '/api/campaigns' })
  await app.register(schedulesRoutes, { prefix: '/api/schedules' })
  await app.register(videosRoutes, { prefix: '/api/videos' })
  await app.register(scriptsRoutes, { prefix: '/api/scripts' })
  await app.register(integrationsRoutes, { prefix: '/api/integrations' })
  await app.register(webhooksRoutes, { prefix: '/api/webhooks' })
  await app.register(adminDashboardRoutes, { prefix: '/api/admin/dashboard' })
  await app.register(adminFinancialRoutes, { prefix: '/api/admin/financial' })
  await app.register(adminHealthRoutes, { prefix: '/api/admin/health' })
  await app.register(adminLogsRoutes, { prefix: '/api/admin/logs' })

  // ── Start ───────────────────────────────────
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Soma.ai API running on port ${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()
