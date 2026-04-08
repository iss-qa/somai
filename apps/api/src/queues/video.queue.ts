import { Queue } from 'bullmq'
import { getRedis } from '../plugins/redis'

let _queue: Queue | null = null

export function getVideoQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('video-queue', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
      },
    })
  }
  return _queue
}

export const videoQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    const q = getVideoQueue()
    const value = (q as any)[prop]
    return typeof value === 'function' ? value.bind(q) : value
  },
})

export default videoQueue
