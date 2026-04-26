import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Whitelist de hosts cujos objetos podem ser servidos pelo proxy.
// Evita SSRF (proxy nao pode ser usado pra varrer IPs internos / outros hosts).
const ALLOWED_HOST_SUFFIXES = [
  '.r2.dev',
  '.r2.cloudflarestorage.com',
  '.fal.media',
  '.fal.ai',
  '.cloudfront.net',
  '.cdninstagram.com',
  '.fbcdn.net',
]

function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase()
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix))
}

export default async function storageRoutes(app: FastifyInstance) {
  // ── GET /proxy ─ devolve um asset publico em mesma origem ────────────
  // Existe pra contornar tres cenarios reais:
  // 1) <img crossOrigin> bloqueado quando o storage nao manda CORS;
  // 2) bucket R2 com pub-*.r2.dev intermitente / 403 em alguns objetos;
  // 3) html-to-image precisando inlinar imagem cross-origin.
  // Sem auth porque o asset ja era publico — so faz pass-through.
  app.get(
    '/proxy',
    async (
      request: FastifyRequest<{ Querystring: { url?: string } }>,
      reply: FastifyReply,
    ) => {
      const raw = request.query.url
      if (!raw) {
        return reply.status(400).send({ error: 'url e obrigatorio' })
      }

      let target: URL
      try {
        target = new URL(raw)
      } catch {
        return reply.status(400).send({ error: 'url invalido' })
      }

      if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        return reply.status(400).send({ error: 'protocolo nao permitido' })
      }

      if (!isAllowedHost(target.hostname)) {
        return reply.status(403).send({ error: 'host nao permitido' })
      }

      try {
        const upstream = await fetch(target.toString(), {
          // Sem cookies/credentials. Fetch como servidor → sem CORS.
          redirect: 'follow',
        })

        if (!upstream.ok) {
          return reply
            .status(upstream.status)
            .send({ error: `upstream respondeu ${upstream.status}` })
        }

        const contentType =
          upstream.headers.get('content-type') || 'application/octet-stream'
        const buffer = Buffer.from(await upstream.arrayBuffer())

        reply
          .header('Content-Type', contentType)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          .header('Access-Control-Allow-Origin', '*')
          .header('Cross-Origin-Resource-Policy', 'cross-origin')
        return reply.send(buffer)
      } catch (err: any) {
        request.log.error(err, '[storage/proxy] fetch falhou')
        return reply
          .status(502)
          .send({ error: err?.message || 'falha ao buscar asset' })
      }
    },
  )
}
