import IORedis, { type RedisOptions } from 'ioredis'

// Prioriza REDIS_URL se definida; caso contrario monta conexao a partir das
// vars separadas (mais legivel quando a senha tem caracteres especiais).
const REDIS_URL = process.env.REDIS_URL

let _redis: IORedis | null = null

function buildRedis(): IORedis {
  const commonOpts: RedisOptions = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  }

  if (REDIS_URL) {
    return new IORedis(REDIS_URL, commonOpts)
  }

  return new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    ...commonOpts,
  })
}

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = buildRedis()

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
