# Infrastructure Security Baseline

This folder contains operational security baselines for environments hosting Digital Cafe.

## Included

1. Host firewall bootstrap script (`ufw-hardening.sh`)
2. VPN baseline notes (`vpn-wireguard-baseline.md`)

These are infra/operator controls and are not auto-applied by the application runtime.

## Recommended Order

1. Apply host firewall baseline.
2. Restrict SSH to known admin IP ranges.
3. Enforce VPN-only access for private/admin surfaces.
4. Keep only ports `80/443` publicly reachable for app traffic.

