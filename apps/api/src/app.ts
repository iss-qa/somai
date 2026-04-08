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
import adminAppLogsRoutes from './routes/admin/applogs'
import billingRoutes from './routes/billing'
import cronRoutes from './routes/cron'

let app: ReturnType<typeof Fastify> | null = null

export async function getApp() {
  if (app) return app

  app = Fastify({ logger: false })

  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'soma_ai_secret_key_2026',
    cookie: {
      cookieName: 'soma-token',
      signed: false,
    },
  })

  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev')

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
  await app.register(adminAppLogsRoutes, { prefix: '/api/admin/applogs' })
  await app.register(billingRoutes, { prefix: '/api/billing' })
  await app.register(cronRoutes, { prefix: '/api/cron' })

  await app.ready()
  return app
}
