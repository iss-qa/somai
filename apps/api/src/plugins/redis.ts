import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380'

let _redis: IORedis | null = null

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })

    _redis.on('error', (err) => {
      console.error('Redis connection error:', err.message)
    })

    _redis.on('connect', () => {
      console.log('Redis conectado')
    })

    _redis.connect().catch(() => {
      // Silently handle — error event already logged above
    })
  }

  return _redis
}

// Keep backward-compatible default export for existing imports,
// but use a Proxy so the connection is only created on first access.
const redis: IORedis = new Proxy({} as IORedis, {
  get(_target, prop) {
    const instance = getRedis()
    const value = (instance as any)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export { redis }
export default redis
