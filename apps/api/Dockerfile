# ---------- Dockerfile: apps/api ----------
# Build context: RAIZ do repositorio (monorepo pnpm)
# Rodar: docker build -f apps/api/Dockerfile -t somaiapi .
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# 1. Manifests — aproveita cache do Docker entre builds
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# 2. Instala deps de todo workspace (tsx e types precisam estar presentes em runtime
#    porque packages/db e packages/shared sao exportados como TypeScript puro)
RUN pnpm install --frozen-lockfile

# 3. Copia codigo
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/apps/api
# tsx transpila TS em runtime — funciona com workspace:* sem bundler
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
