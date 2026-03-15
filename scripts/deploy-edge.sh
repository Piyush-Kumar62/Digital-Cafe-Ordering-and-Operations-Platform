#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/digital-cafe"
FRONTEND_URL="${FRONTEND_URL:-https://cafehub.tech}"
API_URL="${API_URL:-https://api.cafehub.tech/api/public/health}"

cd "$APP_DIR"

echo "Pulling edge stack images..."
docker compose -f docker-compose.edge.yml pull

echo "Starting edge stack..."
docker compose -f docker-compose.edge.yml up -d --remove-orphans

echo "Waiting for edge frontend..."
for i in {1..60}; do
  if curl -kfsS "$FRONTEND_URL" >/dev/null; then
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
  if curl -kfsS "$API_URL" >/dev/null; then
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
