import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Integration } from '@soma-ai/db'
import { authenticate } from '../plugins/auth'
import { EncryptionService } from '../services/encryption.service'

export default async function integrationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── GET /meta ─────────────────────────────────
  app.get('/meta', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!

    if (!companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada' })
    }

    const integration: any = await Integration.findOne({
      company_id: companyId,
    }).lean()

    if (!integration) {
      return reply.status(404).send({ error: 'Integracao nao encontrada' })
    }

    // Mask access token for security
    const meta = { ...integration.meta }
    if (meta.access_token) {
      meta.access_token =
        meta.access_token.substring(0, 8) +
        '...' +
        meta.access_token.substring(meta.access_token.length - 4)
    }

    return reply.send({
      integration: {
        ...integration,
        meta,
      },
    })
  })

  // ── POST /meta ────────────────────────────────
  app.post(
    '/meta',
    async (
      request: FastifyRequest<{
        Body: {
          access_token: string
          instagram_account_id?: string
          instagram_username?: string
          facebook_page_id?: string
          facebook_page_name?: string
        }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const body = request.body

      if (!body.access_token) {
        return reply.status(400).send({ error: 'access_token e obrigatorio' })
      }

      // Encrypt the access token before storing
      const encryptedToken = EncryptionService.encrypt(body.access_token)

      const integration = await Integration.findOneAndUpdate(
        { company_id: companyId },
        {
          'meta.access_token': encryptedToken,
          'meta.instagram_account_id': body.instagram_account_id || '',
          'meta.instagram_username': body.instagram_username || '',
          'meta.facebook_page_id': body.facebook_page_id || '',
          'meta.facebook_page_name': body.facebook_page_name || '',
          'meta.connected': true,
          'meta.connected_at': new Date(),
          'meta.status': 'ok',
          'meta.token_expires_at': new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000,
          ), // 60 days
          updated_at: new Date(),
        },
        { new: true, upsert: true },
      ).lean()

      return reply.send({
        message: 'Integracao Meta salva com sucesso',
        integration: {
          connected: true,
          instagram_username: body.instagram_username || '',
          facebook_page_name: body.facebook_page_name || '',
          status: 'ok',
        },
      })
    },
  )

  // ── POST /meta/test ───────────────────────────
  app.post(
    '/meta/test',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const integration: any = await Integration.findOne({
        company_id: companyId,
      }).lean()

      if (!integration?.meta?.access_token) {
        return reply.send({
          valid: false,
          message: 'Token Meta nao configurado',
        })
      }

      // TODO: Actually call Meta debug_token endpoint
      // For now, return placeholder
      return reply.send({
        valid: true,
        message: 'Token valido (placeholder)',
        expires_at: integration.meta.token_expires_at,
      })
    },
  )

  // ── GET /whatsapp ─────────────────────────────
  app.get('/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    const { companyId } = request.user!

    if (!companyId) {
      return reply.status(400).send({ error: 'Empresa nao encontrada' })
    }

    const integration: any = await Integration.findOne({
      company_id: companyId,
    }).lean()

    if (!integration) {
      return reply.send({
        whatsapp: { connected: false, status: 'disconnected' },
      })
    }

    return reply.send({ whatsapp: integration.whatsapp })
  })

  // ── POST /gemini ──────────────────────────────
  app.post(
    '/gemini',
    async (
      request: FastifyRequest<{
        Body: { api_key: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!

      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { api_key } = request.body

      if (!api_key) {
        return reply.status(400).send({ error: 'api_key e obrigatoria' })
      }

      // Encrypt the API key
      const encryptedKey = EncryptionService.encrypt(api_key)

      await Integration.findOneAndUpdate(
        { company_id: companyId },
        {
          'gemini.api_key': encryptedKey,
          'gemini.active': true,
          'gemini.last_tested_at': new Date(),
          updated_at: new Date(),
        },
        { upsert: true },
      )

      return reply.send({ message: 'Chave Gemini salva com sucesso' })
    },
  )
}
