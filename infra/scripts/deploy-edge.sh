#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/digital-cafe"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
API_URL="${API_URL:-http://localhost/api/public/health}"
ENV_FILE="${ENV_FILE:-digital-cafe-backend/env/.env.prod}"

cd "$APP_DIR"

echo "Pulling edge stack images..."
docker compose --env-file "$ENV_FILE" -f infra/compose/docker-compose.prod.yml pull

echo "Starting edge stack..."
docker compose --env-file "$ENV_FILE" -f infra/compose/docker-compose.prod.yml up -d --remove-orphans

echo "Waiting for edge frontend..."
for i in {1..60}; do
  if curl -fsS "$FRONTEND_URL/healthz" >/dev/null; then
    echo "Frontend edge endpoint is reachable."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "Frontend edge health check failed."
    exit 1
  fi
done

echo "Waiting for edge API..."
for i in {1..60}; do
  if curl -fsS "$API_URL" >/dev/null; then
    echo "API edge endpoint is reachable."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "API edge health check failed."
    exit 1
  fi
done

echo "Edge deployment complete and healthy."
