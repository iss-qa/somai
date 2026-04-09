import { Worker, Job } from 'bullmq'
import redis from '../plugins/redis'
import { MessageHistory, StatusMensagem } from '@soma-ai/db'
import { EvolutionService } from '../services/evolution.service'
import { LogService } from '../services/log.service'

interface WhatsappJobData {
  historicoId: string
  phoneNumber: string
  message: string
  instanceName: string
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

function getRecipientNumber(originalPhone: string): string {
  const forceMock = process.env.FORCE_MOCK_RECIPIENT === 'true'
  const mockNumber = process.env.MOCK_WHATSAPP_NUMBER
  if (forceMock && mockNumber) {
    console.log(`[WhatsappWorker] MOCK MODE: redirecting from ${originalPhone} → ${mockNumber}`)
    return mockNumber
  }
  return originalPhone
}

export const whatsappWorker = new Worker<WhatsappJobData>(
  'whatsapp-queue',
  async (job: Job<WhatsappJobData>) => {
    const { historicoId, phoneNumber, message, instanceName } = job.data
    const recipient = getRecipientNumber(phoneNumber)
    const formattedPhone = formatPhoneNumber(recipient)

    console.log(
      `[WhatsappWorker] Processing job ${job.id} → ${formattedPhone}`,
    )

    try {
      await EvolutionService.sendText(instanceName, formattedPhone, message)

      await MessageHistory.findByIdAndUpdate(historicoId, {
        status: StatusMensagem.ENVIADO,
        data_envio: new Date(),
      })

      console.log(
        `[WhatsappWorker] Message sent successfully → ${formattedPhone}`,
      )
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido'

      await MessageHistory.findByIdAndUpdate(historicoId, {
        status: StatusMensagem.FALHA,
        error_message: errorMsg,
      })

      await LogService.error(
        'api',
        'whatsapp_send_failed',
        `Falha ao enviar WhatsApp para ${formattedPhone}: ${errorMsg}`,
        {
          metadata: {
            jobId: job.id,
            historicoId,
            phone: formattedPhone,
            attempt: job.attemptsMade + 1,
          },
        },
      )

      throw error // BullMQ retries
    }
  },
  {
    connection: redis,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  },
)

whatsappWorker.on('completed', (job) => {
  console.log(`[WhatsappWorker] Job ${job.id} completed`)
})

whatsappWorker.on('failed', (job, err) => {
  console.error(`[WhatsappWorker] Job ${job?.id} failed:`, err.message)
})

export default whatsappWorker
