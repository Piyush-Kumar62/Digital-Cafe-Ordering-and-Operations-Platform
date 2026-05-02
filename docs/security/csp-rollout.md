# CSP Rollout (Safe -> Strict)

This project now uses a two-layer CSP setup in Nginx:

- `Content-Security-Policy` (enforced): compatibility-safe baseline.
- `Content-Security-Policy-Report-Only` (non-blocking): stricter candidate policy.

The goal is to avoid breakage while collecting real violations before tightening.

## Phase 1: Baseline Enforced (Current)

Current baseline keeps:

- `'unsafe-inline'` for `script-src` and `style-src` compatibility.
- `object-src 'none'`.
- `frame-ancestors 'self'`.
- `base-uri 'self'`.
- `form-action 'self'`.

## Phase 2: Observe Violations

Reports are accepted at:

- `/csp-report`

Nginx logs report traffic to:

- `/var/log/nginx/csp_reports.log`

Recommended checks after deployment:

1. Open core flows: login, register, owner dashboard, customer dashboard, payments.
2. Search for CSP report spikes.
3. Identify whether inline scripts/styles or 3rd-party calls are still required.

## Phase 3: Tighten

After violations are understood:

1. Remove `'unsafe-inline'` from `script-src` in enforced policy.
2. Keep strict policy in report-only for one more deploy.
3. If clean, align enforced policy with strict candidate.

## Validation Commands

Use these on deployed domains:

```bash
curl -I https://cafehub.tech
curl -I https://api.cafehub.tech
```

Verify headers include:

- `Content-Security-Policy`
- `Content-Security-Policy-Report-Only`
- `Report-To`

