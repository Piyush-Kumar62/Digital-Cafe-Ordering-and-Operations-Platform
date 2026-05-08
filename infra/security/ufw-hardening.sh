#!/usr/bin/env bash
set -euo pipefail

# Host firewall baseline for Ubuntu using UFW.
# Review and adjust trusted SSH CIDRs before running in production.

SSH_PORT="${SSH_PORT:-22}"
TRUSTED_SSH_CIDR="${TRUSTED_SSH_CIDR:-0.0.0.0/0}"

echo "[UFW] Resetting to a clean baseline..."
ufw --force reset

echo "[UFW] Default deny incoming, allow outgoing..."
ufw default deny incoming
ufw default allow outgoing

echo "[UFW] Allowing SSH from trusted CIDR: ${TRUSTED_SSH_CIDR} (port ${SSH_PORT})"
ufw allow from "${TRUSTED_SSH_CIDR}" to any port "${SSH_PORT}" proto tcp

echo "[UFW] Allowing HTTP/HTTPS..."
ufw allow 80/tcp
ufw allow 443/tcp

echo "[UFW] Enabling firewall..."
ufw --force enable

echo "[UFW] Current status:"
ufw status verbose

