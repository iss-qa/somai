import { Worker, Job } from 'bullmq'
import redis from '../plugins/redis'
import { Company, Notification } from '@soma-ai/db'
import {
  BillingStatus,
  CompanyStatus,
  NotificationType,
} from '@soma-ai/shared'
import { NotificationService } from '../services/notification.service'
import { LogService } from '../services/log.service'
import { ComunicacaoService } from '../services/comunicacao.service'
import billingQueue from '../queues/billing.queue'

interface BillingJobData {
  type: 'daily_check'
}

export const billingWorker = new Worker<BillingJobData>(
  'billing-queue',
  async (job: Job<BillingJobData>) => {
    console.log(`[BillingWorker] Processing job ${job.id} - type: ${job.data.type}`)

    if (job.data.type !== 'daily_check') return

    const now = new Date()

    // ── Find companies with pending/overdue billing ──
    const companies = await Company.find({
      status: { $nin: ['cancelled'] },
      'billing.status': { $in: ['pending', 'overdue'] },
      'billing.next_due_at': { $ne: null },
    }).lean()

    for (const company of companies) {
      if (!company.billing?.next_due_at) continue

      const dueDate = new Date(company.billing.next_due_at)
      const diffMs = now.getTime() - dueDate.getTime()
      const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (overdueDays <= 0) continue

      // ── Update overdue_days ───────────────
      await Company.findByIdAndUpdate(company._id, {
        'billing.overdue_days': overdueDays,
        'billing.status': BillingStatus.Overdue,
      })

      // ── Send reminder at 3, 5, 10, 20 days overdue ───
      if ([3, 5, 10, 20].includes(overdueDays)) {
        await NotificationService.create({
          target: 'company',
          company_id: String(company._id),
          type: NotificationType.PaymentDue,
          title: 'Pagamento em atraso',
          message: `Sua fatura esta com ${overdueDays} dias de atraso. Regularize para evitar bloqueio.`,
          action_url: '/dashboard/billing',
        })

        await NotificationService.create({
          target: 'admin',
          type: NotificationType.PaymentOverdue,
          title: `Pagamento atrasado - ${company.name}`,
          message: `${company.name} esta com ${overdueDays} dias de atraso.`,
          action_url: '/admin/financial',
        })

        // WhatsApp: Alerta de Atraso
        const valor = (company.billing?.monthly_amount ?? 0).toFixed(2)
        ComunicacaoService.enviarAlertaAtraso(
          String(company._id),
          valor,
          overdueDays,
        ).catch(() => {})
      }

      // ── Block access after 30 days ────────
      if (overdueDays >= 30 && company.access_enabled) {
        await Company.findByIdAndUpdate(company._id, {
          access_enabled: false,
          status: CompanyStatus.Blocked,
        })

        await NotificationService.create({
          target: 'company',
          company_id: String(company._id),
          type: NotificationType.AccessBlocked,
          title: 'Acesso bloqueado',
          message:
            'Seu acesso foi bloqueado por falta de pagamento. Entre em contato para regularizar.',
          action_url: '/dashboard/billing',
        })

        await NotificationService.create({
          target: 'admin',
          type: NotificationType.AccessBlocked,
          title: `Acesso bloqueado - ${company.name}`,
          message: `${company.name} foi bloqueada por ${overdueDays} dias de atraso.`,
          action_url: '/admin/financial',
        })

        // WhatsApp: Acesso Bloqueado
        ComunicacaoService.enviarAcessoBloqueado(String(company._id)).catch(() => {})

        await LogService.warn('billing', 'company_blocked', `Empresa bloqueada por inadimplencia: ${company.name} (${overdueDays} dias)`, {
          company_id: String(company._id),
          company_name: company.name,
          metadata: { overdueDays },
        })

        console.log(
          `[BillingWorker] Blocked company ${company.name} - ${overdueDays} days overdue`,
        )
      }
    }

    console.log(
      `[BillingWorker] Daily check completed. Checked ${companies.length} companies.`,
    )
  },
  {
    connection: redis,
    concurrency: 1,
  },
)

// ── Schedule repeatable job: daily at 06:00 ──
async function setupRepeatableJob() {
  try {
    await billingQueue.upsertJobScheduler(
      'billing-daily-check',
      {
        pattern: '0 6 * * *', // every day at 06:00
      },
      {
        name: 'daily-billing-check',
        data: { type: 'daily_check' },
      },
    )
    console.log('[BillingWorker] Repeatable job scheduled: daily at 06:00')
  } catch (err) {
    console.error('[BillingWorker] Failed to setup repeatable job:', err)
  }
}

setupRepeatableJob()

billingWorker.on('completed', (job) => {
  console.log(`[BillingWorker] Job ${job.id} completed`)
})

billingWorker.on('failed', async (job, err) => {
  console.error(`[BillingWorker] Job ${job?.id} failed:`, err.message)
  await LogService.error('billing', 'billing_worker_failed', `Billing job ${job?.id} falhou: ${err.message}`, {
    metadata: { jobId: job?.id, error: err.message },
  })
})

export default billingWorker
