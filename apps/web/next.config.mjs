/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um servidor auto-contido em .next/standalone — ideal para Docker
  output: 'standalone',
  transpilePackages: ['@soma-ai/shared', '@soma-ai/db'],
  experimental: {
    // No Next 14 outputFileTracingRoot fica em experimental (virou top-level so no Next 15)
    outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
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
