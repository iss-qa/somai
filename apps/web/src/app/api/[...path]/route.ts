import { NextRequest } from 'next/server'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { connectDB } from '@soma-ai/db'

// Import routes directly from the api workspace
import dashboardRoutes from '../../../../../../apps/api/src/routes/dashboard'
import authRoutes from '../../../../../../apps/api/src/routes/auth'
import companiesRoutes from '../../../../../../apps/api/src/routes/companies'
import cardsRoutes from '../../../../../../apps/api/src/routes/cards'
import postsRoutes from '../../../../../../apps/api/src/routes/posts'
import postQueueRoutes from '../../../../../../apps/api/src/routes/post-queue'
import campaignsRoutes from '../../../../../../apps/api/src/routes/campaigns'
import schedulesRoutes from '../../../../../../apps/api/src/routes/schedules'
import videosRoutes from '../../../../../../apps/api/src/routes/videos'
import scriptsRoutes from '../../../../../../apps/api/src/routes/scripts'
import integrationsRoutes from '../../../../../../apps/api/src/routes/integrations'
import webhooksRoutes from '../../../../../../apps/api/src/routes/webhooks'
import adminDashboardRoutes from '../../../../../../apps/api/src/routes/admin/dashboard'
import adminFinancialRoutes from '../../../../../../apps/api/src/routes/admin/financial'
import adminHealthRoutes from '../../../../../../apps/api/src/routes/admin/health'
import adminLogsRoutes from '../../../../../../apps/api/src/routes/admin/logs'
import cronRoutes from '../../../../../../apps/api/src/routes/cron'

let app: ReturnType<typeof Fastify> | null = null

async function getApp() {
  if (app) return app

  app = Fastify({ logger: false })

  await app.register(cors, { origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] })
  await app.register(cookie)
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'soma_ai_secret_key_2026', cookie: { cookieName: 'soma-token', signed: false } })

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
  await app.register(cronRoutes, { prefix: '/api/cron' })

  await app.ready()
  console.log('[SOMA API] Routes registered:', app.printRoutes())
  return app
}

async function handler(req: NextRequest) {
  const url = new URL(req.url)

  // Debug endpoint
  if (url.pathname === '/api/health') {
    try {
      const fastify = await getApp()
      const routeList = fastify.printRoutes()
      return new Response(JSON.stringify({
        ok: true,
        mongo: process.env.MONGO_URI ? 'configured' : 'missing',
        jwt: process.env.JWT_SECRET ? 'configured' : 'missing',
        routes: routeList,
        authType: typeof authRoutes,
      }), { headers: { 'Content-Type': 'application/json' } })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack?.split('\n').slice(0, 5) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
  }

  const fastify = await getApp()

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => { headers[key] = value })

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined

  const result = await fastify.inject({
    method: req.method as any,
    url: url.pathname + url.search,
    headers,
    payload: body,
  })

  // Build response with headers, handling Set-Cookie specially
  const responseHeaders = new Headers()
  const setCookies: string[] = []

  for (const [key, value] of Object.entries(result.headers)) {
    if (value === undefined) continue
    if (key.toLowerCase() === 'set-cookie') {
      // Collect Set-Cookie headers separately (Headers API mangles them)
      if (Array.isArray(value)) {
        setCookies.push(...value)
      } else {
        setCookies.push(String(value))
      }
    } else if (Array.isArray(value)) {
      value.forEach(v => responseHeaders.append(key, v))
    } else {
      responseHeaders.set(key, String(value))
    }
  }

  const res = new Response(result.body, {
    status: result.statusCode,
    headers: responseHeaders,
  })

  // Append Set-Cookie headers directly (bypasses Headers API limitations)
  for (const cookie of setCookies) {
    res.headers.append('Set-Cookie', cookie)
  }

  return res
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const dynamic = 'force-dynamic'
