import { NextRequest } from 'next/server'

// Import getApp from the api workspace via relative path
import { getApp } from '../../../../../api/src/app'

async function handler(req: NextRequest) {
  const app = await getApp()

  const url = new URL(req.url)
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined

  const result = await app.inject({
    method: req.method as any,
    url: url.pathname + url.search,
    headers,
    payload: body,
  })

  // Forward cookies from Fastify response
  const responseHeaders = new Headers()
  for (const [key, value] of Object.entries(result.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach(v => responseHeaders.append(key, v))
    } else {
      responseHeaders.set(key, String(value))
    }
  }

  return new Response(result.body, {
    status: result.statusCode,
    headers: responseHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler

export const dynamic = 'force-dynamic'
