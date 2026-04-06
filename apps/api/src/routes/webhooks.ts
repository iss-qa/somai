import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Integration } from '@soma-ai/db'
import { EncryptionService } from '../services/encryption.service'

export default async function webhooksRoutes(app: FastifyInstance) {
  // ── GET /meta/callback ────────────────────────
  // OAuth callback for Meta API — no auth required (called by Meta)
  app.get(
    '/meta/callback',
    async (
      request: FastifyRequest<{
        Querystring: {
          code?: string
          state?: string
          error?: string
          error_description?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { code, state, error, error_description } = request.query

      if (error) {
        console.error(
          `[MetaCallback] OAuth error: ${error} - ${error_description}`,
        )
        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?error=${encodeURIComponent(error_description || error)}`,
        )
      }

      if (!code || !state) {
        return reply.status(400).send({ error: 'Parametros invalidos' })
      }

      try {
        // state contains companyId
        const companyId = state

        // Exchange code for access token
        const META_APP_ID = process.env.META_APP_ID
        const META_APP_SECRET = process.env.META_APP_SECRET
        const META_REDIRECT_URI = process.env.META_REDIRECT_URI

        const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI || '')}&client_secret=${META_APP_SECRET}&code=${code}`

        const tokenRes = await fetch(tokenUrl)
        const tokenData = (await tokenRes.json()) as {
          access_token?: string
          error?: { message: string }
        }

        if (!tokenData.access_token) {
          console.error('[MetaCallback] Failed to get token:', tokenData)
          return reply.redirect(
            `${process.env.APP_URL}/dashboard/integrations?error=token_exchange_failed`,
          )
        }

        // Exchange short-lived token for long-lived token
        const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`

        const longLivedRes = await fetch(longLivedUrl)
        const longLivedData = (await longLivedRes.json()) as {
          access_token?: string
          expires_in?: number
        }

        const accessToken = longLivedData.access_token || tokenData.access_token
        const expiresIn = longLivedData.expires_in || 5184000 // 60 days default

        // Encrypt and store
        const encryptedToken = EncryptionService.encrypt(accessToken)

        await Integration.findOneAndUpdate(
          { company_id: companyId },
          {
            'meta.access_token': encryptedToken,
            'meta.connected': true,
            'meta.connected_at': new Date(),
            'meta.status': 'ok',
            'meta.token_expires_at': new Date(
              Date.now() + expiresIn * 1000,
            ),
            updated_at: new Date(),
          },
          { upsert: true },
        )

        console.log(
          `[MetaCallback] Successfully connected Meta for company ${companyId}`,
        )

        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?success=true`,
        )
      } catch (err) {
        console.error('[MetaCallback] Error:', err)
        return reply.redirect(
          `${process.env.APP_URL}/dashboard/integrations?error=internal_error`,
        )
      }
    },
  )

  // ── POST /evolution ───────────────────────────
  // Webhook for Evolution API status updates — no auth (called by Evolution API)
  app.post(
    '/evolution',
    async (
      request: FastifyRequest<{
        Body: {
          event?: string
          instance?: string
          data?: Record<string, unknown>
          sender?: string
          apikey?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const body = request.body
      const event = body.event
      const instance = body.instance

      console.log(
        `[EvolutionWebhook] Event: ${event}, Instance: ${instance}`,
      )

      if (!event || !instance) {
        return reply.status(400).send({ error: 'Payload invalido' })
      }

      try {
        switch (event) {
          case 'connection.update': {
            const connectionState =
              (body.data as any)?.state || 'disconnected'
            const isConnected = connectionState === 'open'

            // Find integration by instance name and update
            await Integration.updateMany(
              { 'whatsapp.instance_name': instance },
              {
                'whatsapp.connected': isConnected,
                'whatsapp.status': connectionState,
                updated_at: new Date(),
              },
            )

            console.log(
              `[EvolutionWebhook] Instance ${instance} status: ${connectionState}`,
            )
            break
          }

          case 'messages.upsert': {
            // Handle incoming messages if needed
            console.log(
              `[EvolutionWebhook] New message on instance ${instance}`,
            )
            break
          }

          case 'qrcode.updated': {
            console.log(
              `[EvolutionWebhook] QR Code updated for instance ${instance}`,
            )
            break
          }

          default:
            console.log(
              `[EvolutionWebhook] Unhandled event: ${event}`,
            )
        }

        return reply.send({ received: true })
      } catch (err) {
        console.error('[EvolutionWebhook] Error:', err)
        return reply.status(500).send({ error: 'Erro ao processar webhook' })
      }
    },
  )
}
