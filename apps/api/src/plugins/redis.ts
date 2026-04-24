// Garante que dotenv rode ANTES deste módulo avaliar (side-effect import).
import '../env'
import IORedis, { type RedisOptions } from 'ioredis'

let _redis: IORedis | null = null
let _target = ''

function buildRedis(): IORedis {
  const commonOpts: RedisOptions = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  }

  const url = process.env.REDIS_URL
  if (url) {
    // Mascara credenciais para não vazar no log.
    _target = url.replace(/\/\/[^@]+@/, '//***@')
    return new IORedis(url, commonOpts)
  }

  const host = process.env.REDIS_HOST || 'localhost'
  const port = Number(process.env.REDIS_PORT) || 6379
  _target = `${host}:${port} (fallback)`

  return new IORedis({
    host,
    port,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    ...commonOpts,
  })
}

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = buildRedis()

    _redis.on('error', (err) => {
      console.error(`Redis connection error (${_target}):`, err.message)
    })

    _redis.on('connect', () => {
      console.log(`Redis conectado → ${_target}`)
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
