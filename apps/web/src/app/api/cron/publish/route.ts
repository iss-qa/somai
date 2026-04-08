import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer {CRON_SECRET}
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'

  try {
    const res = await fetch(`${apiUrl}/api/cron/publish-due`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret || '',
      },
    })

    const data = await res.json()
    console.log('[Cron] publish-due result:', data)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[Cron] publish-due error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
