# Docker Build Definitions

This directory is the single source of truth for container build files.

- `backend.Dockerfile`: Spring Boot API image build.
- `frontend.Dockerfile`: Angular static build + Nginx runtime image.

## CI/CD usage

GitHub Actions uses these files directly from `.github/workflows/ci-cd.yml`.

## Local build examples

```bash
docker build -f infra/docker/backend.Dockerfile -t digital-cafe-backend:local digital-cafe-backend
docker build -f infra/docker/frontend.Dockerfile -t digital-cafe-frontend:local digital-cafe-frontend
```
