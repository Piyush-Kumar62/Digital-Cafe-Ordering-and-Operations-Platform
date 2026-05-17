#!/usr/bin/env bash
set -euo pipefail

# Renders backend .env file from AWS SSM Parameter Store.
# Required IAM permission: ssm:GetParameter on the configured parameter names.

APP_DIR="${APP_DIR:-/opt/digital-cafe}"
ENV_FILE="${ENV_FILE:-$APP_DIR/digital-cafe-backend/env/.env.prod}"
SSM_PREFIX="${SSM_PREFIX:-/digital-cafe/prod}"
AWS_REGION="${AWS_REGION:-ap-south-1}"

get_param() {
  local name="$1"
  aws ssm get-parameter \
    --name "$name" \
    --with-decryption \
    --region "$AWS_REGION" \
    --query 'Parameter.Value' \
    --output text
}

get_param_optional() {
  local name="$1"
  local default_value="$2"
  if value=$(aws ssm get-parameter \
    --name "$name" \
    --with-decryption \
    --region "$AWS_REGION" \
    --query 'Parameter.Value' \
    --output text 2>/dev/null); then
    echo "$value"
  else
    echo "$default_value"
  fi
}

echo "Rendering backend env file from SSM prefix: $SSM_PREFIX"

DB_HOST="$(get_param_optional "$SSM_PREFIX/DB_HOST" "")"
DB_PORT="$(get_param_optional "$SSM_PREFIX/DB_PORT" "5432")"
DB_NAME="$(get_param_optional "$SSM_PREFIX/DB_NAME" "")"
DB_URL="$(get_param_optional "$SSM_PREFIX/DB_URL" "")"

if [[ -n "$DB_URL" ]]; then
  if [[ "$DB_URL" == *"localhost"* || "$DB_URL" == *"127.0.0.1"* ]]; then
    echo "Refusing to write env: DB_URL points to localhost ($DB_URL)"
    exit 1
  fi
  if [[ -z "$DB_HOST" ]] && [[ "$DB_URL" =~ jdbc:postgresql://([^:/]+)(:([0-9]+))?/([^?]+) ]]; then
    DB_HOST="${BASH_REMATCH[1]}"
    DB_PORT="${BASH_REMATCH[3]:-5432}"
    DB_NAME="${BASH_REMATCH[4]}"
  fi
fi

if [[ -z "$DB_HOST" || -z "$DB_NAME" ]]; then
  echo "Missing DB settings in SSM. Provide DB_HOST/DB_NAME (or DB_URL parsable as jdbc:postgresql://host:port/db)."
  exit 1
fi

cat > "$ENV_FILE" <<EOF
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USERNAME=$(get_param "$SSM_PREFIX/DB_USERNAME")
DB_PASSWORD=$(get_param "$SSM_PREFIX/DB_PASSWORD")
JWT_SECRET=$(get_param "$SSM_PREFIX/JWT_SECRET")
JWT_EXPIRATION=$(get_param "$SSM_PREFIX/JWT_EXPIRATION")
JWT_REFRESH_EXPIRATION=$(get_param "$SSM_PREFIX/JWT_REFRESH_EXPIRATION")
FRONTEND_URL=$(get_param "$SSM_PREFIX/FRONTEND_URL")
APP_CORS_ALLOWED_ORIGINS=$(get_param_optional "$SSM_PREFIX/APP_CORS_ALLOWED_ORIGINS" "$(get_param "$SSM_PREFIX/FRONTEND_URL")")
PAYMENT_GATEWAY=$(get_param "$SSM_PREFIX/PAYMENT_GATEWAY")
RAZORPAY_KEY_ID=$(get_param "$SSM_PREFIX/RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET=$(get_param "$SSM_PREFIX/RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET=$(get_param "$SSM_PREFIX/RAZORPAY_WEBHOOK_SECRET")
MAIL_USERNAME=$(get_param "$SSM_PREFIX/MAIL_USERNAME")
MAIL_PASSWORD=$(get_param "$SSM_PREFIX/MAIL_PASSWORD")
MAIL_FROM_EMAIL=$(get_param "$SSM_PREFIX/MAIL_FROM_EMAIL")
EMAIL_FROM_NAME=$(get_param_optional "$SSM_PREFIX/MAIL_FROM_NAME" "Digital Cafe Team")
MAIL_ENABLED=$(get_param_optional "$SSM_PREFIX/MAIL_ENABLED" "true")
APP_STORAGE_PROVIDER=$(get_param_optional "$SSM_PREFIX/APP_STORAGE_PROVIDER" "s3")
S3_BUCKET=$(get_param_optional "$SSM_PREFIX/S3_BUCKET" "")
AWS_REGION=$(get_param "$SSM_PREFIX/AWS_REGION")
AWS_ACCESS_KEY_ID=$(get_param_optional "$SSM_PREFIX/AWS_ACCESS_KEY_ID" "")
AWS_SECRET_ACCESS_KEY=$(get_param_optional "$SSM_PREFIX/AWS_SECRET_ACCESS_KEY" "")
SERVER_PORT=$(get_param "$SSM_PREFIX/SERVER_PORT")
EOF

echo "Wrote $ENV_FILE from SSM parameters."
