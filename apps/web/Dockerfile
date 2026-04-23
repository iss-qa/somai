# ---------- Dockerfile: apps/web ----------
# Build context: RAIZ do repositorio (monorepo pnpm)
# Rodar: docker build -f apps/web/Dockerfile -t somaiweb .

# -------- Stage 1: deps --------
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# -------- Stage 2: builder --------
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copia deps instaladas + codigo fonte
COPY --from=deps /app ./
COPY apps/web ./apps/web
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

ENV NEXT_TELEMETRY_DISABLED=1
# Build args — NEXT_PUBLIC_* precisa existir em build time para ser embutido no bundle
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app/apps/web
RUN pnpm build

# -------- Stage 3: runner --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone ja traz node_modules essenciais
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# outputFileTracingRoot faz o server.js ficar em apps/web dentro do standalone
CMD ["node", "apps/web/server.js"]
