#!/usr/bin/env bash
set -euo pipefail

echo "Health checks"
curl -f http://localhost/api/public/health
curl -f http://localhost

echo "All checks passed"
