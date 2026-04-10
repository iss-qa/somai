import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { publishDuePosts } from '../jobs/publish-due.job'

export default async function cronRoutes(app: FastifyInstance) {
  /**
   * GET /api/cron/publish-due
   * Can be called by an external cron service (e.g. cron-job.org) every minute.
   * The server also runs this internally via setInterval — see server.ts.
   */
  app.get(
    '/publish-due',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const secret = process.env.CRON_SECRET

      if (secret) {
        // Accept X-Cron-Secret (external cron services) OR
        // Authorization: Bearer <secret> (Vercel Cron sends this automatically)
        const xHeader = (request.headers['x-cron-secret'] as string) || ''
        const authHeader = (request.headers['authorization'] as string) || ''
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

        if (xHeader !== secret && bearerToken !== secret) {
          return reply.status(401).send({ error: 'Unauthorized' })
        }
      }

      const result = await publishDuePosts(10)
      return reply.send(result)
    },
  )
}
