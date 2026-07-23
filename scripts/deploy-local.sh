#!/usr/bin/env bash
# deploy-local.sh
# Deploys codemie-capstone from GitHub to local machine (Mac/Linux)
# Usage: bash scripts/deploy-local.sh [--branch <branch>] [--docker]

set -e

REPO_URL="https://github.com/bharathskh/codemie-capstone.git"
APP_DIR="codemie-capstone"
PORT=3000
BRANCH="main"
USE_DOCKER=false

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch) BRANCH="$2"; shift 2 ;;
    --docker) USE_DOCKER=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo ""
echo "=== codemie-capstone Local Deployment ==="

# ── Step 1: Clone or update ───────────────────────────────────────────────────
echo ""
echo "[1/4] Syncing repository ($BRANCH)..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Step 2: Check port availability ──────────────────────────────────────────
echo ""
echo "[2/4] Checking port $PORT..."
if lsof -ti:"$PORT" &>/dev/null; then
  echo "  Port $PORT in use — killing existing process..."
  lsof -ti:"$PORT" | xargs kill -9
  sleep 1
fi

# ── Step 3: Install or build ──────────────────────────────────────────────────
echo ""
if [ "$USE_DOCKER" = true ]; then
  echo "[3/4] Building Docker image..."
  docker build -t codemie-capstone .
else
  echo "[3/4] Installing npm dependencies..."
  npm install
fi

# ── Step 4: Start ─────────────────────────────────────────────────────────────
echo ""
echo "[4/4] Starting application..."
if [ "$USE_DOCKER" = true ]; then
  docker run --rm -p "$PORT:$PORT" --name codemie-capstone codemie-capstone
else
  echo ""
  echo "  App running at: http://localhost:$PORT"
  echo "  Login:          demo / C0dem!e@Secure#24"
  echo "  Stop:           Ctrl+C"
  echo ""
  npm start
fi
