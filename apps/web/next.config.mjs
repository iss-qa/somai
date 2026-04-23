/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um servidor auto-contido em .next/standalone — ideal para Docker
  output: 'standalone',
  // Necessario para o standalone encontrar workspace packages fora do apps/web
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  transpilePackages: ['@soma-ai/shared', '@soma-ai/db'],
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart', 'bcryptjs', 'ioredis', 'bullmq', 'dotenv'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'mongoose': 'commonjs mongoose',
        'fastify': 'commonjs fastify',
        '@fastify/cors': 'commonjs @fastify/cors',
        '@fastify/jwt': 'commonjs @fastify/jwt',
        '@fastify/cookie': 'commonjs @fastify/cookie',
        '@fastify/multipart': 'commonjs @fastify/multipart',
        'bcryptjs': 'commonjs bcryptjs',
        'ioredis': 'commonjs ioredis',
        'bullmq': 'commonjs bullmq',
      })
    }
    return config
  },
}
export default nextConfig
