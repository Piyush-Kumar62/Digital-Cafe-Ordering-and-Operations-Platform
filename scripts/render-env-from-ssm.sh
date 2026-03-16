#!/usr/bin/env bash
set -euo pipefail

# Renders backend .env file from AWS SSM Parameter Store.
# Required IAM permission: ssm:GetParameter on the configured parameter names.

APP_DIR="${APP_DIR:-/opt/digital-cafe}"
ENV_FILE="${ENV_FILE:-$APP_DIR/digital-cafe-backend/.env}"
SSM_PREFIX="${SSM_PREFIX:-/digital-cafe/deployment}"
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

DB_URL="$(get_param "$SSM_PREFIX/DB_URL")"
if [[ "$DB_URL" == *"localhost"* || "$DB_URL" == *"127.0.0.1"* ]]; then
  echo "Refusing to write env: DB_URL points to localhost ($DB_URL)"
  exit 1
fi

cat > "$ENV_FILE" <<EOF
DB_URL=$DB_URL
DB_USERNAME=$(get_param "$SSM_PREFIX/DB_USERNAME")
DB_PASSWORD=$(get_param "$SSM_PREFIX/DB_PASSWORD")
JWT_SECRET=$(get_param "$SSM_PREFIX/JWT_SECRET")
JWT_EXPIRATION=$(get_param "$SSM_PREFIX/JWT_EXPIRATION")
JWT_REFRESH_EXPIRATION=$(get_param "$SSM_PREFIX/JWT_REFRESH_EXPIRATION")
FRONTEND_URL=$(get_param "$SSM_PREFIX/FRONTEND_URL")
PAYMENT_GATEWAY=$(get_param "$SSM_PREFIX/PAYMENT_GATEWAY")
RAZORPAY_KEY_ID=$(get_param "$SSM_PREFIX/RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET=$(get_param "$SSM_PREFIX/RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET=$(get_param "$SSM_PREFIX/RAZORPAY_WEBHOOK_SECRET")
MAIL_USERNAME=$(get_param "$SSM_PREFIX/MAIL_USERNAME")
MAIL_PASSWORD=$(get_param "$SSM_PREFIX/MAIL_PASSWORD")
MAIL_FROM_EMAIL=$(get_param "$SSM_PREFIX/MAIL_FROM_EMAIL")
EMAIL_FROM_NAME=$(get_param_optional "$SSM_PREFIX/MAIL_FROM_NAME" "Digital Cafe Team")
MAIL_ENABLED=$(get_param_optional "$SSM_PREFIX/MAIL_ENABLED" "true")
APP_STORAGE_PROVIDER=$(get_param "$SSM_PREFIX/APP_STORAGE_PROVIDER")
S3_BUCKET=$(get_param "$SSM_PREFIX/S3_BUCKET")
AWS_REGION=$(get_param "$SSM_PREFIX/AWS_REGION")
AWS_ACCESS_KEY_ID=$(get_param "$SSM_PREFIX/AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=$(get_param "$SSM_PREFIX/AWS_SECRET_ACCESS_KEY")
SERVER_PORT=$(get_param "$SSM_PREFIX/SERVER_PORT")
EOF

echo "Wrote $ENV_FILE from SSM parameters."
