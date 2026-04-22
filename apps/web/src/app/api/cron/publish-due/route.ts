import { NextRequest } from 'next/server'
import { publishDuePosts } from '../../../../../../api/src/jobs/publish-due.job'
import { connectDB } from '@soma-ai/db'

export async function GET(request: NextRequest) {
  // Verify cron secret. Vercel Cron envia automaticamente o header Authorization
  // com o CRON_SECRET quando a env var esta definida no projeto.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const xCronSecret = request.headers.get('x-cron-secret') || ''

    if (bearerToken !== secret && xCronSecret !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // connectDB e idempotente — retorna imediatamente se ja conectado
    await connectDB(process.env.MONGO_URI || '')
    const result = await publishDuePosts(25)
    console.log(`[Cron] publish-due: ${result.processed} posts processados`)
    return Response.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err: any) {
    console.error('[Cron] publish-due error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60
