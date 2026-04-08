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

    // Mask sensitive fields for security
    const meta = { ...integration.meta }
    if (meta.access_token) {
      meta.access_token =
        meta.access_token.substring(0, 8) +
        '...' +
        meta.access_token.substring(meta.access_token.length - 4)
    }
    if (meta.app_secret) {
      meta.app_secret = '••••••••••••'
    }

    return reply.send({
      integration: {
        ...integration,
        meta,
      },
    })
  })

  // ── POST /meta/app ── Save App credentials ────
  app.post(
    '/meta/app',
    async (
      request: FastifyRequest<{
        Body: { app_id: string; app_secret?: string; app_name?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { app_id, app_secret, app_name } = request.body
      if (!app_id) {
        return reply.status(400).send({ error: 'app_id e obrigatorio' })
      }

      const update: Record<string, any> = {
        'meta.app_id': app_id,
        updated_at: new Date(),
      }

      if (app_name) {
        update['meta.app_name'] = app_name
      }

      // Only update secret if provided (not masked value)
      if (app_secret) {
        update['meta.app_secret'] = EncryptionService.encrypt(app_secret)
      }

      await Integration.findOneAndUpdate(
        { company_id: companyId },
        update,
        { upsert: true },
      )

      return reply.send({ message: 'Credenciais do App salvas com sucesso' })
    },
  )

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

      await Integration.findOneAndUpdate(
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
      )

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

  // ── POST /meta/callback ── OAuth Facebook ─────
  app.post(
    '/meta/callback',
    async (
      request: FastifyRequest<{
        Body: { code: string; redirect_uri: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      const { code, redirect_uri } = request.body
      if (!code) {
        return reply.status(400).send({ error: 'Codigo de autorizacao ausente' })
      }

      // Get app credentials from company's integration (per-company)
      const integration: any = await Integration.findOne({
        company_id: companyId,
      }).lean()

      const appId = integration?.meta?.app_id
      const encryptedSecret = integration?.meta?.app_secret

      if (!appId || !encryptedSecret) {
        return reply.status(400).send({
          error:
            'Credenciais do App Meta nao configuradas. Salve o App ID e App Secret primeiro.',
        })
      }

      let appSecret: string
      try {
        appSecret = EncryptionService.decrypt(encryptedSecret)
      } catch {
        return reply
          .status(500)
          .send({ error: 'Erro ao descriptografar App Secret' })
      }

      try {
        // 1. Exchange code for short-lived token
        const tokenUrl = `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`
        const tokenRes = await fetch(tokenUrl)
        const tokenData = (await tokenRes.json()) as any
        if (tokenData.error) {
          return reply
            .status(400)
            .send({ error: tokenData.error.message || 'Erro ao trocar codigo' })
        }
        const shortLivedToken = tokenData.access_token

        // 2. Exchange short-lived token for long-lived token
        const longUrl = `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
        const longRes = await fetch(longUrl)
        const longData = (await longRes.json()) as any
        const longLivedToken = longData.access_token || shortLivedToken

        // 3. Get user's Facebook pages
        const pagesUrl = `https://graph.facebook.com/v25.0/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token,instagram_business_account`
        const pagesRes = await fetch(pagesUrl)
        const pagesData = (await pagesRes.json()) as any

        if (!pagesData.data || pagesData.data.length === 0) {
          return reply.status(400).send({
            error:
              'Nenhuma pagina encontrada. A conta precisa ter uma Pagina do Facebook vinculada.',
          })
        }

        // Pick first page with instagram_business_account, or first page
        const pageWithIg = pagesData.data.find(
          (p: any) => p.instagram_business_account,
        )
        const page = pageWithIg || pagesData.data[0]
        const pageAccessToken = page.access_token // never-expiring page token

        // 4. Get Instagram Business Account
        let igAccountId = ''
        let igUsername = ''
        let igProfileUrl = ''
        if (page.instagram_business_account) {
          igAccountId = page.instagram_business_account.id
          const igUrl = `https://graph.facebook.com/v25.0/${igAccountId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
          const igRes = await fetch(igUrl)
          const igData = (await igRes.json()) as any
          igUsername = igData.username || ''
          igProfileUrl = igUsername
            ? `https://www.instagram.com/${igUsername}/`
            : ''
        }

        const fbPageUrl = `https://www.facebook.com/${page.id}`

        // 5. Save everything encrypted
        const encryptedToken = EncryptionService.encrypt(pageAccessToken)

        await Integration.findOneAndUpdate(
          { company_id: companyId },
          {
            'meta.access_token': encryptedToken,
            'meta.instagram_account_id': igAccountId,
            'meta.instagram_username': igUsername,
            'meta.instagram_profile_url': igProfileUrl,
            'meta.facebook_page_id': page.id,
            'meta.facebook_page_name': page.name,
            'meta.facebook_page_url': fbPageUrl,
            'meta.connected': true,
            'meta.connected_at': new Date(),
            'meta.last_verified_at': new Date(),
            'meta.status': 'ok',
            'meta.token_expires_at': null, // page token via long-lived = never expires
            updated_at: new Date(),
          },
          { new: true, upsert: true },
        )

        return reply.send({
          success: true,
          connected: true,
          instagram_username: igUsername,
          instagram_account_id: igAccountId,
          instagram_profile_url: igProfileUrl,
          facebook_page_id: page.id,
          facebook_page_name: page.name,
          facebook_page_url: fbPageUrl,
          pages: pagesData.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            has_instagram: !!p.instagram_business_account,
          })),
        })
      } catch (err: any) {
        request.log.error(err, 'Erro no callback OAuth Meta')
        return reply
          .status(500)
          .send({ error: err.message || 'Erro interno no callback OAuth' })
      }
    },
  )

  // ── POST /meta/disconnect ─────────────────────
  app.post(
    '/meta/disconnect',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { companyId } = request.user!
      if (!companyId) {
        return reply.status(400).send({ error: 'Empresa nao encontrada' })
      }

      await Integration.findOneAndUpdate(
        { company_id: companyId },
        {
          'meta.access_token': '',
          'meta.instagram_account_id': '',
          'meta.instagram_username': '',
          'meta.facebook_page_id': '',
          'meta.facebook_page_name': '',
          'meta.connected': false,
          'meta.connected_at': null,
          'meta.last_verified_at': null,
          'meta.status': 'disconnected',
          'meta.token_expires_at': null,
          updated_at: new Date(),
        },
      )

      return reply.send({ message: 'Desconectado com sucesso' })
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
