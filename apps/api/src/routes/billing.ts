import type { FastifyInstance } from 'fastify'
import { Company } from '@soma-ai/db'
import { authenticate, adminOnly } from '../plugins/auth'
import { OpenPixService } from '../services/openpix.service'
import { ComunicacaoService } from '../services/comunicacao.service'

export default async function billingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // ── POST /setup-charge — Generate setup fee PIX ──
  app.post<{
    Body: { company_id: string; value?: number }
  }>(
    '/setup-charge',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { company_id, value } = request.body

      if (!company_id) {
        return reply.status(400).send({ error: 'company_id obrigatorio' })
      }

      const company: any = await Company.findById(company_id)
        .populate('plan_id')
        .lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      // Value in cents — use provided or plan setup_price
      const chargeValue =
        value || (company.plan_id?.setup_price || 297) * 100

      try {
        // 1. Create customer in OpenPix first
        const phone = company.whatsapp?.replace(/\D/g, '') || ''
        await OpenPixService.createCustomer({
          name: company.responsible_name,
          email: company.email,
          phone: phone.startsWith('55') ? phone : `55${phone}`,
        }).catch((err) => {
          console.warn('[billing] Customer creation skipped:', err.message)
        })

        // 2. Create PIX charge
        const result = await OpenPixService.createCharge({
          value: chargeValue,
          customer: {
            name: company.responsible_name,
            email: company.email,
            phone: phone.startsWith('55') ? phone : `55${phone}`,
          },
        })

        // 3. Save charge reference on company
        await Company.findByIdAndUpdate(company_id, {
          setup_amount: chargeValue / 100,
          'billing.setup_charge_id': result.correlationID,
        })

        console.log(
          '[billing] Setup charge created for',
          company.name,
          ':',
          result.correlationID,
        )

        // Send boleto setup notification via WhatsApp
        try {
          const link = result.charge.paymentLinkUrl || result.brCode || ''
          await ComunicacaoService.enviarBoletoSetup(
            company_id,
            (chargeValue / 100).toFixed(2),
            link,
          )
        } catch (err) {
          console.warn('[billing] Boleto setup WhatsApp notification failed:', err)
        }

        return reply.send({
          charge: result.charge,
          brCode: result.brCode,
          correlationID: result.correlationID,
          qrCodeImage: result.charge.qrCodeImage,
          paymentLinkUrl: result.charge.paymentLinkUrl,
          value: chargeValue / 100,
        })
      } catch (err: any) {
        console.error('[billing] Setup charge error:', err.message)
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao gerar cobranca' })
      }
    },
  )

  // ── GET /setup-charge/:companyId — Check charge status + auto-update ──
  app.get<{ Params: { companyId: string } }>(
    '/setup-charge/:companyId',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { companyId } = request.params
      const company: any = await Company.findById(companyId).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const chargeId = (company.billing as any)?.setup_charge_id
      if (!chargeId) {
        return reply.send({ charge: null, message: 'Nenhuma cobranca de setup gerada' })
      }

      try {
        const data = await OpenPixService.getCharge(chargeId)
        const charge = data.charge

        // Auto-update: if charge is COMPLETED but company not yet marked as paid
        if (
          charge?.status === 'COMPLETED' &&
          !company.setup_paid
        ) {
          // Setup paid → access enabled, but awaiting subscription
          await Company.findByIdAndUpdate(companyId, {
            setup_paid: true,
            setup_paid_at: new Date(),
            access_enabled: true,
            status: 'pending_subscription',
            'billing.status': 'pending_subscription',
          })
          console.log('[billing] Setup paid, awaiting subscription:', company.name)
        }

        return reply.send(data)
      } catch (err: any) {
        return reply.status(502).send({ error: err.message })
      }
    },
  )

  // ── POST /subscription — Create recurring subscription ──
  app.post<{
    Body: { company_id: string; value?: number; day_generate_charge?: number }
  }>(
    '/subscription',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { company_id, value, day_generate_charge } = request.body

      if (!company_id) {
        return reply.status(400).send({ error: 'company_id obrigatorio' })
      }

      const company: any = await Company.findById(company_id)
        .populate('plan_id')
        .lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const subValue =
        value || (company.plan_id?.monthly_price || 39.9) * 100

      try {
        // Create customer in OpenPix first
        const phone = company.whatsapp?.replace(/\D/g, '') || ''
        const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`
        await OpenPixService.createCustomer({
          name: company.responsible_name,
          email: company.email,
          phone: formattedPhone,
        }).catch((err) => {
          console.warn('[billing] Customer creation skipped:', err.message)
        })

        const result = await OpenPixService.createSubscription({
          value: Math.round(subValue),
          customer: {
            name: company.responsible_name,
            email: company.email,
            phone: formattedPhone,
          },
          dayGenerateCharge:
            day_generate_charge || company.billing?.due_day || 10,
        })

        // Save subscription reference + activate company fully
        await Company.findByIdAndUpdate(company_id, {
          status: 'active',
          access_enabled: true,
          'billing.monthly_amount': subValue / 100,
          'billing.subscription_id': result.subscription.globalID,
          'billing.status': 'paid',
          'billing.due_day':
            day_generate_charge || company.billing?.due_day || 10,
        })

        console.log(
          '[billing] Subscription created for',
          company.name,
          ':',
          result.subscription.globalID,
        )

        return reply.send({
          subscription: result.subscription,
          value: subValue / 100,
        })
      } catch (err: any) {
        console.error('[billing] Subscription error:', err.message)
        return reply
          .status(502)
          .send({ error: err.message || 'Erro ao criar assinatura' })
      }
    },
  )

  // ── GET /subscription/:companyId — Get subscription status ──
  app.get<{ Params: { companyId: string } }>(
    '/subscription/:companyId',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { companyId } = request.params
      const company: any = await Company.findById(companyId).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const subId = (company.billing as any)?.subscription_id
      if (!subId) {
        return reply.send({
          subscription: null,
          message: 'Nenhuma assinatura ativa',
        })
      }

      try {
        const data = await OpenPixService.getSubscription(subId)
        return reply.send(data)
      } catch (err: any) {
        return reply.status(502).send({ error: err.message })
      }
    },
  )

  // ── DELETE /subscription/:companyId — Cancel subscription ──
  app.delete<{ Params: { companyId: string } }>(
    '/subscription/:companyId',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      const { companyId } = request.params
      const company: any = await Company.findById(companyId).lean()

      if (!company) {
        return reply.status(404).send({ error: 'Empresa nao encontrada' })
      }

      const subId = (company.billing as any)?.subscription_id
      if (!subId) {
        return reply.status(400).send({ error: 'Nenhuma assinatura para cancelar' })
      }

      try {
        await OpenPixService.cancelSubscription(subId)
        await Company.findByIdAndUpdate(companyId, {
          'billing.subscription_id': '',
        })
        return reply.send({ message: 'Assinatura cancelada' })
      } catch (err: any) {
        return reply.status(502).send({ error: err.message })
      }
    },
  )

  // ── GET /charges — List all charges ──
  app.get<{ Querystring: { status?: string } }>(
    '/charges',
    { preHandler: [adminOnly] },
    async (request, reply) => {
      try {
        const data = await OpenPixService.listCharges({
          status: request.query.status,
        })
        return reply.send(data)
      } catch (err: any) {
        return reply.status(502).send({ error: err.message })
      }
    },
  )
}
