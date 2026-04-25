#!/bin/bash
# ──────────────────────────────────────────────
# Soma.ai — Deploy direto em PRD
# ──────────────────────────────────────────────
# Faz push da main, disparando o GitHub Action
# que aciona o webhook do EasyPanel pra rebuildar API e Web.
#
# Uso:
#   ./deploy.sh              # push da main atual
#   ./deploy.sh --redeploy   # forca rebuild com commit vazio (sem mudancas novas)
# ──────────────────────────────────────────────

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REDEPLOY=false
if [ "$1" = "--redeploy" ]; then
  REDEPLOY=true
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo -e "${BLUE}   Soma.ai — Deploy PRD              ${NC}"
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo ""

# ── 1. Verifica branch atual ──
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}[1/4] Branch atual: ${CURRENT_BRANCH}${NC}"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}  Voce nao esta em main. Mude para main antes de deploiar.${NC}"
  exit 1
fi

# ── 2. Verifica working tree limpo ──
echo ""
echo -e "${YELLOW}[2/4] Verificando working tree...${NC}"
if [ -n "$(git status --porcelain | grep -v tsbuildinfo)" ]; then
  echo -e "${RED}  Existem mudancas nao commitadas:${NC}"
  git status --short | grep -v tsbuildinfo
  echo ""
  echo -e "${RED}  Commite antes de rodar o deploy.${NC}"
  exit 1
fi
echo -e "  ${GREEN}Working tree limpo${NC}"

# ── 3. Sincroniza com origin ──
echo ""
echo -e "${YELLOW}[3/4] Sincronizando com origin...${NC}"
git fetch origin --quiet
git pull --ff-only origin main --quiet
echo -e "  ${GREEN}main atualizada${NC}"

if [ "$REDEPLOY" = "true" ]; then
  echo "  Criando commit vazio pra forcar rebuild..."
  git commit --allow-empty -m "chore: trigger easypanel redeploy"
fi

# ── 4. Push ──
echo ""
echo -e "${YELLOW}[4/4] Push pra origin/main (dispara EasyPanel)...${NC}"
git push origin main
echo -e "  ${GREEN}Push OK${NC}"

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Deploy disparado.                   ${NC}"
echo -e "${GREEN}  Build do EasyPanel: ~1-3 min        ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  Acompanhe o workflow:"
echo -e "  ${BLUE}https://github.com/iss-qa/somai/actions${NC}"
echo ""
