/** @type {import('next').NextConfig} */
const nextConfig = {
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
