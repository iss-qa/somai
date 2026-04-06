import type { FastifyRequest, FastifyReply } from 'fastify'

export interface UserPayload {
  userId: string
  companyId: string | null
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload
    user: UserPayload
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Try cookie first, then Authorization header
    let token = request.cookies['soma-token']

    if (!token) {
      const authHeader = request.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return reply.status(401).send({ error: 'Token nao fornecido' })
    }

    const decoded = request.server.jwt.verify<UserPayload>(token)
    request.user = decoded
  } catch (err) {
    return reply.status(401).send({ error: 'Token invalido ou expirado' })
  }
}

export async function adminOnly(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (
    !request.user ||
    (request.user.role !== 'superadmin' && request.user.role !== 'support')
  ) {
    return reply.status(403).send({ error: 'Acesso restrito a administradores' })
  }
}
