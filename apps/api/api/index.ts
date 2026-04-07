import type { IncomingMessage, ServerResponse } from 'http'
import { getApp } from '../src/app'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp()
  app.routing(req, res)
}
