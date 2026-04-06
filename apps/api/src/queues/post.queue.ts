import { Queue } from 'bullmq'
import redis from '../plugins/redis'

export const postQueue = new Queue('post-queue', {
  connection: redis,
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

export default postQueue
