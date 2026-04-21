import { NextRequest } from 'next/server'
import { publishDuePosts } from '../../../../../../api/src/jobs/publish-due.job'
import { connectDB } from '@soma-ai/db'

let dbConnected = false

export async function GET(request: NextRequest) {
  // Verify cron secret
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
    // Ensure DB connection
    if (!dbConnected) {
      await connectDB(process.env.MONGO_URI || '')
      dbConnected = true
    }

    const result = await publishDuePosts(10)
    return Response.json(result)
  } catch (err: any) {
    console.error('[Cron] publish-due error:', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60
