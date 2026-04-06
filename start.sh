#!/bin/bash
# ──────────────────────────────────────────────
# Soma.ai — Start Dev Environment
# ──────────────────────────────────────────────

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo -e "${BLUE}   Soma.ai — Setup Dev Environment   ${NC}"
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo ""

# ── 1. Kill processes on ports 3000 and 3001 ──
echo -e "${YELLOW}[1/6] Liberando portas 3000 e 3001...${NC}"
for PORT in 3000 3001; do
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "  Matando processos na porta $PORT: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  else
    echo "  Porta $PORT livre"
  fi
done
sleep 1

# ── 2. Ensure Redis is running ──
echo ""
echo -e "${YELLOW}[2/6] Verificando Redis...${NC}"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^soma-redis$'; then
  echo "  soma-redis ja esta rodando"
else
  if docker start soma-redis 2>/dev/null; then
    echo "  soma-redis iniciado"
  else
    echo "  Criando novo container soma-redis na porta 6380..."
    docker run -d --name soma-redis -p 6380:6379 redis:7-alpine 2>/dev/null || {
      echo -e "${RED}  ERRO: Nao foi possivel iniciar Redis. Verifique o Docker.${NC}"
      exit 1
    }
    echo "  soma-redis criado e rodando"
  fi
fi
sleep 1
if docker exec soma-redis redis-cli ping 2>/dev/null | grep -q PONG; then
  echo -e "  ${GREEN}Redis: OK${NC}"
else
  echo -e "  ${RED}Redis: NAO RESPONDE${NC}"
  exit 1
fi

# ── 3. Ensure MongoDB is running ──
echo ""
echo -e "${YELLOW}[3/6] Verificando MongoDB...${NC}"
if mongosh --quiet --eval "db.runCommand({ping:1}).ok" 2>/dev/null | grep -q 1; then
  echo -e "  ${GREEN}MongoDB local: OK${NC}"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^soma-mongo$'; then
  echo -e "  ${GREEN}MongoDB: OK (Docker)${NC}"
elif docker start soma-mongo 2>/dev/null; then
  sleep 2
  echo -e "  ${GREEN}MongoDB: OK (Docker)${NC}"
else
  docker run -d --name soma-mongo -p 27017:27017 mongo:7 2>/dev/null
  sleep 3
  echo -e "  ${GREEN}MongoDB: OK (Docker criado)${NC}"
fi

# ── 4. Install dependencies if needed ──
echo ""
echo -e "${YELLOW}[4/6] Verificando dependencias...${NC}"
if [ ! -d "node_modules" ]; then
  echo "  Instalando dependencias..."
  pnpm install
else
  echo "  node_modules existe, pulando install"
fi

# ── 5. Seed database ──
echo ""
echo -e "${YELLOW}[5/6] Seed do banco de dados...${NC}"
npx tsx apps/api/src/seed.ts 2>&1 | sed 's/^/  /'

# ── 6. Start dev servers ──
echo ""
echo -e "${YELLOW}[6/6] Iniciando servidores...${NC}"
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  API:  http://localhost:3001        ${NC}"
echo -e "${GREEN}  Web:  http://localhost:3000        ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Admin:${NC}     admin@soma.ai / admin123"
echo -e "  ${BLUE}Pet Shop:${NC}  maria@petshopamigo.com / demo123"
echo -e "  ${BLUE}Farmacia:${NC}  joao@farmaciacentral.com / demo123"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar tudo${NC}"
echo ""

# Cleanup on Ctrl+C
trap 'echo ""; echo "Parando servidores..."; kill 0; exit 0' SIGINT SIGTERM

# Start API in background
npx tsx apps/api/src/server.ts &

# Start Web (Next.js) - needs higher file limit
cd apps/web
NODE_OPTIONS="--max-old-space-size=4096" npx next dev --port 3000
