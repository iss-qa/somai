import { Queue } from 'bullmq'
import { getRedis } from '../plugins/redis'

let _queue: Queue | null = null

export function getWhatsappQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('whatsapp-queue', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    })
  }
  return _queue
}

export const whatsappQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    const q = getWhatsappQueue()
    const value = (q as any)[prop]
    return typeof value === 'function' ? value.bind(q) : value
  },
})

export default whatsappQueue
