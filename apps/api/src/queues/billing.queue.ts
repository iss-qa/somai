import { Queue } from 'bullmq'
import { getRedis } from '../plugins/redis'

let _queue: Queue | null = null

export function getBillingQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('billing-queue', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  }
  return _queue
}

export const billingQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    const q = getBillingQueue()
    const value = (q as any)[prop]
    return typeof value === 'function' ? value.bind(q) : value
  },
})

export default billingQueue
