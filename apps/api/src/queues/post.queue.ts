import { Queue } from 'bullmq'
import { getRedis } from '../plugins/redis'

let _queue: Queue | null = null

export function getPostQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('post-queue', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    })
  }
  return _queue
}

// Backward-compatible: lazy proxy so `import postQueue` doesn't connect on import
export const postQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    const q = getPostQueue()
    const value = (q as any)[prop]
    return typeof value === 'function' ? value.bind(q) : value
  },
})

export default postQueue
