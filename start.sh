#!/usr/bin/env bash
#
# 21CSC403T Virtual Lab — one-command startup script.
#
# Sets up (first run) and launches BOTH servers:
#   • FastAPI backend  → http://127.0.0.1:8000
#   • Vite frontend    → http://localhost:5173
#
# Usage:
#   ./start.sh                 # setup if needed, then run both
#   ./start.sh --setup-only    # only install deps, do not start servers
#   ./start.sh --backend       # run only the backend
#   ./start.sh --frontend      # run only the frontend
#
# Press Ctrl+C to stop everything.

set -euo pipefail

# Resolve the directory this script lives in, so it works from anywhere.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_DIR="$ROOT_DIR/.venv"

BACKEND_HOST="127.0.0.1"
BACKEND_PORT="8000"

# ---- pretty logging -------------------------------------------------------
c_reset="\033[0m"; c_blue="\033[34m"; c_green="\033[32m"; c_yellow="\033[33m"; c_red="\033[31m"
info()  { printf "${c_blue}[start]${c_reset} %s\n" "$1"; }
ok()    { printf "${c_green}[ ok ]${c_reset} %s\n" "$1"; }
warn()  { printf "${c_yellow}[warn]${c_reset} %s\n" "$1"; }
err()   { printf "${c_red}[fail]${c_reset} %s\n" "$1" >&2; }

RUN_BACKEND=1
RUN_FRONTEND=1
SETUP_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --setup-only) SETUP_ONLY=1 ;;
    --backend)    RUN_FRONTEND=0 ;;
    --frontend)   RUN_BACKEND=0 ;;
    -h|--help)
      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) warn "Unknown argument: $arg (ignored)" ;;
  esac
done

# ---- pick a Python interpreter --------------------------------------------
PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then PYTHON_BIN="$candidate"; break; fi
done
if [ -z "$PYTHON_BIN" ]; then
  err "Python 3 not found. Install Python 3.11+ and retry."
  exit 1
fi

# ---- backend setup --------------------------------------------------------
setup_backend() {
  if [ ! -d "$VENV_DIR" ]; then
    info "Creating virtual environment at .venv ..."
    "$PYTHON_BIN" -m venv "$VENV_DIR"
  fi
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  info "Installing backend dependencies ..."
  python -m pip install --quiet --upgrade pip
  python -m pip install --quiet -r "$BACKEND_DIR/requirements.txt"
  ok "Backend ready."
}

# ---- frontend setup -------------------------------------------------------
setup_frontend() {
  if ! command -v npm >/dev/null 2>&1; then
    err "npm not found. Install Node.js 20+ and retry."
    exit 1
  fi
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    info "Installing frontend dependencies (npm install) ..."
    (cd "$FRONTEND_DIR" && npm install --silent)
  fi
  ok "Frontend ready."
}

# ---- run ------------------------------------------------------------------
PIDS=()
cleanup() {
  echo
  info "Shutting down ..."
  for pid in "${PIDS[@]:-}"; do
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait >/dev/null 2>&1 || true
  ok "Stopped."
}
trap cleanup INT TERM EXIT

[ "$RUN_BACKEND" -eq 1 ] && setup_backend
[ "$RUN_FRONTEND" -eq 1 ] && setup_frontend

if [ "$SETUP_ONLY" -eq 1 ]; then
  ok "Setup complete. Run ./start.sh to launch the servers."
  trap - EXIT
  exit 0
fi

if [ "$RUN_BACKEND" -eq 1 ]; then
  info "Starting backend on http://$BACKEND_HOST:$BACKEND_PORT ..."
  (
    cd "$BACKEND_DIR"
    exec "$VENV_DIR/bin/uvicorn" app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" --reload
  ) &
  PIDS+=("$!")
fi

if [ "$RUN_FRONTEND" -eq 1 ]; then
  info "Starting frontend on http://localhost:5173 ..."
  (
    cd "$FRONTEND_DIR"
    exec npm run dev
  ) &
  PIDS+=("$!")
fi

ok "Servers launched. Open http://localhost:5173  (Ctrl+C to stop)"
wait
