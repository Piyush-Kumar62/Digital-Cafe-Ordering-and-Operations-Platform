# DB TLS Hardening (Production)

This project now defaults production MySQL connections to TLS:

- `DB_SSL_MODE=REQUIRED` (default in `application-prod.properties`)
- `DB_ALLOW_PUBLIC_KEY_RETRIEVAL=false` (default in `application-prod.properties`)

## Current Production JDBC Pattern

`application-prod.properties` uses:

```properties
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?createDatabaseIfNotExist=true&sslMode=${DB_SSL_MODE:REQUIRED}&allowPublicKeyRetrieval=${DB_ALLOW_PUBLIC_KEY_RETRIEVAL:false}&serverTimezone=UTC
```

## Recommended Values

For strong production security:

1. Set `DB_SSL_MODE=VERIFY_IDENTITY` when server certificate hostname validation is properly configured.
2. Keep `DB_ALLOW_PUBLIC_KEY_RETRIEVAL=false`.
3. Use a managed DB endpoint with valid TLS cert chain.

## Rollout Steps

1. Deploy with default `REQUIRED` and verify app startup.
2. Monitor DB connection errors.
3. Move to `VERIFY_IDENTITY` after cert/hostname validation is confirmed.

