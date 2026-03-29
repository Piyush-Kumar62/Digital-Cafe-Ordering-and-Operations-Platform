#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/digital-cafe"
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:8080/api/public/health}"
FRONTEND_HEALTH_URL="${FRONTEND_HEALTH_URL:-http://localhost}"
RENDER_ENV_FROM_SSM="${RENDER_ENV_FROM_SSM:-false}"
SSM_PREFIX="${SSM_PREFIX:-/digital-cafe/prod}"

cd "$APP_DIR"

if [[ "$RENDER_ENV_FROM_SSM" == "true" && -x "./scripts/render-env-from-ssm.sh" ]]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "AWS CLI is required when RENDER_ENV_FROM_SSM=true, but it is not installed."
    exit 1
  fi
  echo "Rendering backend env from AWS SSM..."
  APP_DIR="$APP_DIR" SSM_PREFIX="$SSM_PREFIX" ./scripts/render-env-from-ssm.sh
fi

echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "Restarting stack..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Waiting for backend health..."
for i in {1..60}; do
  if curl -fsS "$BACKEND_HEALTH_URL" >/dev/null; then
    echo "Backend is healthy."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "Backend health check failed."
    exit 1
  fi
done

echo "Waiting for frontend health..."
for i in {1..60}; do
  if curl -fsS "$FRONTEND_HEALTH_URL" >/dev/null; then
    echo "Frontend is healthy."
    break
  fi
  sleep 2
  if [[ "$i" == "60" ]]; then
    echo "Frontend health check failed."
    exit 1
  fi
done

echo "Deployment complete and healthy."
