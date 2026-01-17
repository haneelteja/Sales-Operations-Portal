#!/usr/bin/env bash
set -euo pipefail

# 1) ensure dependencies installed
npm ci

# 2) type-check
npx tsc --noEmit

# 3) build
npm run build

# 4) serve dist on port 5000 (uses 'serve' package if available)
if ! command -v serve >/dev/null 2>&1; then
  npm install -g serve
fi

npx serve -s dist -l 5000 > /tmp/smoke-serve.log 2>&1 &
SERVER_PID=$!

for i in {1..10}; do
  if curl -fsS http://localhost:5000/ >/dev/null 2>&1; then
    echo "Smoke check passed: HTTP 200 OK"
    break
  fi
  sleep 1
done

if ! curl -fsS http://localhost:5000/ >/dev/null 2>&1; then
  echo "Smoke check failed: server not responding on http://localhost:5000/"
  tail -n +1 /tmp/smoke-serve.log || true
  kill $SERVER_PID || true
  exit 1
fi

kill $SERVER_PID || true
