import { Queue } from 'bullmq'
import redis from '../plugins/redis'

export const billingQueue = new Queue('billing-queue', {
  connection: redis,
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

export default billingQueue
