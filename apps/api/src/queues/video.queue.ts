import { Queue } from 'bullmq'
import redis from '../plugins/redis'

export const videoQueue = new Queue('video-queue', {
  connection: redis,
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

export default videoQueue
