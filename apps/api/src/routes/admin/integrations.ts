import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Integration, Company } from '@soma-ai/db'
import { authenticate, adminOnly } from '../../plugins/auth'
import { EncryptionService } from '../../services/encryption.service'

export default async function adminIntegrationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', adminOnly)

  // ── GET /:companyId/meta ───────────────────────
  app.get(
    '/:companyId/meta',
    async (
      request: FastifyRequest<{ Params: { companyId: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.params

      const company = await Company.findById(companyId).select('name slug').lean()
      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const integration: any = await Integration.findOne({ company_id: companyId }).lean()

      if (!integration) {
        return reply.send({ integration: null })
      }

      const meta = { ...integration.meta }
      if (meta.access_token) {
        meta.access_token = meta.access_token.substring(0, 8) + '...' + meta.access_token.substring(meta.access_token.length - 4)
      }
      if (meta.app_secret) {
        meta.app_secret = '••••••••••••'
      }

      return reply.send({ integration: { ...integration, meta } })
    },
  )

  // ── POST /:companyId/meta/app ─── Save App credentials ──
  app.post(
    '/:companyId/meta/app',
    async (
      request: FastifyRequest<{
        Params: { companyId: string }
        Body: { app_id: string; app_secret?: string; app_name?: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.params
      const { app_id, app_secret, app_name } = request.body

      if (!app_id) {
        return reply.status(400).send({ error: 'app_id e obrigatorio' })
      }

      const update: Record<string, any> = {
        'meta.app_id': app_id,
        updated_at: new Date(),
      }

      if (app_name) update['meta.app_name'] = app_name
      if (app_secret) update['meta.app_secret'] = EncryptionService.encrypt(app_secret)

      await Integration.findOneAndUpdate(
        { company_id: companyId },
        update,
        { upsert: true },
      )

      return reply.send({ message: 'Credenciais do App salvas com sucesso' })
    },
  )

  // ── POST /:companyId/meta ─── Save token manually ──
  app.post(
    '/:companyId/meta',
    async (
      request: FastifyRequest<{
        Params: { companyId: string }
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
      const { companyId } = request.params
      const body = request.body

      if (!body.access_token) {
        return reply.status(400).send({ error: 'access_token e obrigatorio' })
      }

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
          'meta.token_expires_at': new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
        },
        { new: true, upsert: true },
      )

      return reply.send({ message: 'Integracao Meta salva com sucesso', integration: { connected: true } })
    },
  )

  // ── POST /:companyId/meta/callback ─── OAuth callback ──
  app.post(
    '/:companyId/meta/callback',
    async (
      request: FastifyRequest<{
        Params: { companyId: string }
        Body: { code: string; redirect_uri: string }
      }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.params
      const { code, redirect_uri } = request.body

      if (!code) {
        return reply.status(400).send({ error: 'Codigo de autorizacao ausente' })
      }

      const integration: any = await Integration.findOne({ company_id: companyId }).lean()
      const appId = integration?.meta?.app_id
      const encryptedSecret = integration?.meta?.app_secret

      if (!appId || !encryptedSecret) {
        return reply.status(400).send({
          error: 'Credenciais do App Meta nao configuradas. Salve o App ID e App Secret primeiro.',
        })
      }

      let appSecret: string
      try {
        appSecret = EncryptionService.decrypt(encryptedSecret)
      } catch {
        return reply.status(500).send({ error: 'Erro ao descriptografar App Secret' })
      }

      try {
        const tokenUrl = `https://graph.facebook.com/v25.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${appSecret}&code=${code}`
        const tokenRes = await fetch(tokenUrl)
        const tokenData = (await tokenRes.json()) as any
        if (tokenData.error) {
          return reply.status(400).send({ error: tokenData.error.message || 'Erro ao trocar codigo' })
        }
        const shortLivedToken = tokenData.access_token

        const longUrl = `https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
        const longRes = await fetch(longUrl)
        const longData = (await longRes.json()) as any
        const longLivedToken = longData.access_token || shortLivedToken

        const pagesUrl = `https://graph.facebook.com/v25.0/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token,instagram_business_account`
        const pagesRes = await fetch(pagesUrl)
        const pagesData = (await pagesRes.json()) as any

        if (!pagesData.data || pagesData.data.length === 0) {
          return reply.status(400).send({ error: 'Nenhuma pagina encontrada.' })
        }

        const pageWithIg = pagesData.data.find((p: any) => p.instagram_business_account)
        const page = pageWithIg || pagesData.data[0]
        const pageAccessToken = page.access_token

        let igAccountId = ''
        let igUsername = ''
        let igProfileUrl = ''
        if (page.instagram_business_account) {
          igAccountId = page.instagram_business_account.id
          const igUrl = `https://graph.facebook.com/v25.0/${igAccountId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
          const igRes = await fetch(igUrl)
          const igData = (await igRes.json()) as any
          igUsername = igData.username || ''
          igProfileUrl = igUsername ? `https://www.instagram.com/${igUsername}/` : ''
        }

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
            'meta.facebook_page_url': `https://www.facebook.com/${page.id}`,
            'meta.connected': true,
            'meta.connected_at': new Date(),
            'meta.last_verified_at': new Date(),
            'meta.status': 'ok',
            'meta.token_expires_at': null,
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
          facebook_page_url: `https://www.facebook.com/${page.id}`,
        })
      } catch (err: any) {
        request.log.error(err, 'Erro no callback OAuth Meta (admin)')
        return reply.status(500).send({ error: err.message || 'Erro interno no callback OAuth' })
      }
    },
  )

  // ── POST /:companyId/meta/disconnect ──────────
  app.post(
    '/:companyId/meta/disconnect',
    async (
      request: FastifyRequest<{ Params: { companyId: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.params

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

  // ── POST /:companyId/meta/test ────────────────
  app.post(
    '/:companyId/meta/test',
    async (
      request: FastifyRequest<{ Params: { companyId: string } }>,
      reply: FastifyReply,
    ) => {
      const { companyId } = request.params

      const integration: any = await Integration.findOne({ company_id: companyId }).lean()

      if (!integration?.meta?.access_token) {
        return reply.send({ valid: false, message: 'Token Meta nao configurado' })
      }

      return reply.send({
        valid: true,
        message: 'Token valido',
        expires_at: integration.meta.token_expires_at,
      })
    },
  )
}
