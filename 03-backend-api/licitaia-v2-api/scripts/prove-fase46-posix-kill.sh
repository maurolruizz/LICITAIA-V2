#!/usr/bin/env bash
# Linux/macOS: envia SIGTERM real ao processo que escuta PORT (lsof). Não usar no Windows.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export NODE_ENV=development
export PORT="${PROOF_PORT:-3998}"
AUDIT="$ROOT/f46-shutdown-audit.log"
rm -f "$AUDIT"
export SHUTDOWN_AUDIT_FILE="$AUDIT"
unset F46_SHUTDOWN_STDIN || true

node dist/server.js &
BG=$!
for _ in $(seq 1 80); do
  curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1 && break
  sleep 0.05
done

OWN="$(lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null | head -1)"
if [ -z "${OWN}" ]; then
  echo "PROOF_FAIL: lsof não encontrou listener na porta ${PORT}"
  kill "$BG" 2>/dev/null || true
  exit 1
fi

echo "=== POSIX PROOF: kill -TERM ${OWN} (1º) + 2º idempotência ==="
kill -TERM "${OWN}" || true
sleep 0.08
kill -TERM "${OWN}" || true
wait "${BG}" 2>/dev/null || true
sleep 0.5
echo "=== audit ==="
[ -f "$AUDIT" ] && cat "$AUDIT" || echo "(sem arquivo)"
