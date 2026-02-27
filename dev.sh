#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Start backend + frontend for local development
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill 0 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}All processes stopped.${NC}"
}
trap cleanup EXIT INT TERM

# ── Preflight checks ────────────────────────────────────────────────────────

echo -e "${CYAN}🔍 Checking prerequisites...${NC}"

if ! command -v python3 &>/dev/null; then
  echo -e "${RED}✗ python3 not found. Please install Python 3.10+.${NC}"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ node not found. Please install Node.js 18+.${NC}"
  exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Python $PYTHON_VERSION${NC}"
echo -e "${GREEN}✓ Node $NODE_VERSION${NC}"

# ── Backend setup ────────────────────────────────────────────────────────────

echo -e "\n${CYAN}🐍 Setting up backend...${NC}"

VENV_DIR="$BACKEND_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo -e "${YELLOW}Creating virtual environment...${NC}"
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

echo "Installing/updating Python dependencies..."
pip install -q -r "$BACKEND_DIR/requirements.txt"

# ── Frontend setup ───────────────────────────────────────────────────────────

echo -e "\n${CYAN}⚛️  Setting up frontend...${NC}"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing npm dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
else
  echo -e "${GREEN}✓ node_modules exists${NC}"
fi

# ── Clean stale lock files ────────────────────────────────────────────────────

rm -rf "$FRONTEND_DIR/.next/dev/lock"

# ── Start services ───────────────────────────────────────────────────────────

echo -e "\n${CYAN}🚀 Starting services...${NC}"
echo -e "   Backend  → ${GREEN}http://localhost:8000${NC}  (FastAPI + uvicorn)"
echo -e "   Frontend → ${GREEN}http://localhost:3000${NC}  (Next.js dev server)"
echo -e "${YELLOW}Press Ctrl+C to stop both.${NC}\n"

# Start backend
(
  cd "$BACKEND_DIR"
  source .venv/bin/activate
  uvicorn main:app --reload --host 0.0.0.0 --port 8000 2>&1 | sed "s/^/[backend]  /"
) &

# Start frontend
(
  cd "$FRONTEND_DIR"
  npm run dev 2>&1 | sed "s/^/[frontend] /"
) &

# Wait for both
wait
