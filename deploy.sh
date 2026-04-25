#!/bin/bash
# ──────────────────────────────────────────────
# Soma.ai — Deploy direto em PRD
# ──────────────────────────────────────────────
# Faz merge da branch atual (version_2_0 ou outra) em main
# e push, disparando o GitHub Action que aciona o webhook
# do EasyPanel pra rebuildar API e Web.
#
# Uso:
#   ./deploy.sh              # merge da branch atual em main + push
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
echo -e "${YELLOW}[1/5] Branch atual: ${CURRENT_BRANCH}${NC}"

if [ "$CURRENT_BRANCH" = "main" ] && [ "$REDEPLOY" = "false" ]; then
  echo -e "${RED}  Voce ja esta em main. Use --redeploy pra forcar rebuild,${NC}"
  echo -e "${RED}  ou troque pra sua branch de trabalho antes.${NC}"
  exit 1
fi

# ── 2. Verifica working tree limpo ──
echo ""
echo -e "${YELLOW}[2/5] Verificando working tree...${NC}"
if [ -n "$(git status --porcelain | grep -v tsbuildinfo)" ]; then
  echo -e "${RED}  Existem mudancas nao commitadas:${NC}"
  git status --short | grep -v tsbuildinfo
  echo ""
  echo -e "${RED}  Commite ou stashe antes de rodar o deploy.${NC}"
  exit 1
fi
echo -e "  ${GREEN}Working tree limpo${NC}"

# ── 3. Atualiza branches do remoto ──
echo ""
echo -e "${YELLOW}[3/5] Sincronizando com origin...${NC}"
git fetch origin --quiet
echo -e "  ${GREEN}Fetch OK${NC}"

# ── 4. Switch para main, fast-forward e merge ──
echo ""
echo -e "${YELLOW}[4/5] Atualizando main...${NC}"
git checkout main --quiet
git pull --ff-only origin main --quiet
echo -e "  ${GREEN}main atualizada${NC}"

if [ "$REDEPLOY" = "true" ]; then
  echo "  Criando commit vazio pra forcar rebuild..."
  git commit --allow-empty -m "chore: trigger easypanel redeploy"
else
  echo "  Mergeando ${CURRENT_BRANCH} em main (fast-forward)..."
  if ! git merge --ff-only "$CURRENT_BRANCH" 2>/dev/null; then
    echo -e "${RED}  Fast-forward falhou. main e ${CURRENT_BRANCH} divergiram.${NC}"
    echo -e "${RED}  Faca o merge/rebase manualmente e rode novamente.${NC}"
    git checkout "$CURRENT_BRANCH" --quiet
    exit 1
  fi
fi

# ── 5. Push e volta pra branch original ──
echo ""
echo -e "${YELLOW}[5/5] Push pra origin/main (dispara EasyPanel)...${NC}"
git push origin main
echo -e "  ${GREEN}Push OK${NC}"

git checkout "$CURRENT_BRANCH" --quiet
if [ "$CURRENT_BRANCH" != "main" ]; then
  git merge --ff-only main --quiet 2>/dev/null || true
  git push origin "$CURRENT_BRANCH" --quiet 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Deploy disparado.                   ${NC}"
echo -e "${GREEN}  Build do EasyPanel: ~1-3 min        ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  Acompanhe o workflow:"
echo -e "  ${BLUE}https://github.com/iss-qa/somai/actions${NC}"
echo ""
echo -e "  Apos o build, valide com:"
echo -e "  ${BLUE}./deploy.sh --check${NC}  (em breve)"
echo ""
