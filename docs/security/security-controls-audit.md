# Security Controls Audit (April 26, 2026)

Scope reviewed: backend (`digital-cafe-backend`), frontend (`digital-cafe-frontend`), infra baselines (`infra/security`).

## 1) Rate Limiting

Status: Implemented.

- Backend request throttling via `RateLimitFilter` (Bucket4j).
- Separate stricter limits for auth-sensitive endpoints.
- Configurable with `app.rate-limit.*` properties.

## 2) CORS

Status: Implemented.

- CORS configured in `SecurityConfig` via `CorsConfigurationSource`.
- Allowed origins are environment-driven (`app.cors.allowed-origins`).
- Credentials enabled to support cookie-based flows.

## 3) SQL & NoSQL Injection

Status: Implemented for current stack, with hardening applied.

- Primary data access uses Spring Data JPA repositories with parameterized bindings.
- No NoSQL data store is present in current codebase (NoSQL injection surface is not applicable).
- Hardening update: duplicate-report SQL execution moved from service-level dynamic native SQL calls to fixed repository queries.

## 4) Firewalls

Status: Implemented as infrastructure baseline (operational control).

- `infra/security/ufw-hardening.sh` provides host firewall bootstrap.
- Baseline enforces deny-incoming by default and opens only required ports.

## 5) VPNs

Status: Implemented as infrastructure baseline (operational control).

- `infra/security/vpn-wireguard-baseline.md` defines WireGuard access model and operational checklist.
- Documents VPN-only access for admin/private surfaces.

## 6) CSRF

Status: Implemented.

- Double-submit CSRF defense via `CsrfDoubleSubmitFilter`.
- Frontend interceptor sends `X-XSRF-TOKEN` for unsafe methods.
- CSRF token cookie managed by `CookieUtil`.

## 7) XSS

Status: Implemented with additional hardening applied.

- Angular templates benefit from framework escaping by default.
- Added backend security headers filter to enforce:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security` (HTTPS requests)

## Notes

- Firewall and VPN controls are intentionally infra/operator-managed and not auto-applied by app runtime.
- Security header values are configurable via `app.security.headers.*` properties.
- MySQL-only policy is enforced at runtime (non-test profiles) via `DatabaseSecurityValidator`.
- Flyway/Liquibase are explicitly disabled (`spring.flyway.enabled=false`, `spring.liquibase.enabled=false`).
