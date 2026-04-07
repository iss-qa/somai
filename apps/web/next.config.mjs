/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@soma-ai/shared', '@soma-ai/db'],
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'fastify', '@fastify/cors', '@fastify/jwt', '@fastify/cookie', '@fastify/multipart', 'bcryptjs', 'ioredis', 'bullmq'],
  },
}
export default nextConfig
