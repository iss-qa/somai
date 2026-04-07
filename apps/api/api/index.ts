import type { IncomingMessage, ServerResponse } from 'http'
import { getApp } from '../src/app.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp()
    app.routing(req, res)
  } catch (error: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }))
  }
}
