# VPN Baseline (WireGuard)

Use this baseline to enforce VPN-only access to sensitive operational surfaces (admin SSH, DB consoles, internal dashboards).

## Objectives

1. Admin access only via VPN.
2. No direct public exposure of private services.
3. Auditable key rotation and user offboarding.

## Baseline Controls

1. Deploy WireGuard on a hardened jump host.
2. Restrict backend/admin ports to VPN CIDR only.
3. Keep public ingress limited to `80/443` through reverse proxy.
4. Rotate peer keys quarterly.
5. Revoke keys immediately on team member offboarding.

## Example Network Policy (Concept)

- Public:
  - `80/tcp`, `443/tcp` -> reverse proxy
- Private (VPN CIDR only):
  - `22/tcp` SSH
  - DB ports (`3306/tcp`) if needed
  - Admin dashboards

## Operational Checklist

1. Generate unique key pair per admin.
2. Map peer to person/team in an access registry.
3. Enable server-side logging for VPN connect/disconnect events.
4. Test emergency break-glass procedure.
5. Review inactive peers monthly.

