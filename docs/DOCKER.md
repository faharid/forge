# Docker

Forge ships with a full Docker setup for local development and production-like testing.

## Prerequisites

- Docker Desktop 4.x+ (or Docker Engine + Compose v2)
- 2 GB+ free RAM

## Quick start (full stack)

From the repo root:

```bash
cp .env.docker.example .env.docker   # optional: Stripe keys
docker compose up -d --build
```

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| API        | http://localhost:3001/api    |
| Health     | http://localhost:3001/api/health |
| Metrics    | http://localhost:3001/metrics |
| Postgres   | localhost:5432               |
| Redis      | localhost:6379               |

## Compose profiles

```bash
# Default: postgres + redis + api + frontend
docker compose up -d --build

# Hot-reload dev (API + Vite on host ports 3001 / 5173)
docker compose --profile dev up -d --build

# Prometheus metrics UI
docker compose --profile obs up -d

# Stripe webhook forwarding (requires STRIPE_SECRET_KEY in .env.docker)
docker compose --profile stripe up -d
```

## Seed demo data

With Postgres running (Docker or local):

```bash
cp backend/.env.example backend/.env
cd backend && npm run migration:run   # if not using synchronize
npm run seed
```

Uses `admin@acme.dev` / `password123` (see `docs/API.md`).

## Database only (native Node dev)

Run API/frontend on the host with `npm run dev`:

```bash
docker compose up -d postgres redis
cp backend/.env.example backend/.env
npm run dev
```

## Useful commands

```bash
make docker-up          # build + start
make docker-down        # stop and remove containers
make docker-logs        # follow all logs
make docker-ps          # status
make docker-reset       # down -v (wipes DB volume)
```

## Environment

Copy `.env.docker.example` to `.env.docker` for Stripe and secrets. Compose loads it automatically via `env_file`.

For production images:

```bash
docker build -t forge-api:latest ./backend
docker build -t forge-frontend:latest ./frontend
```

Set `ENVIRONMENT=production` on the API container to run TypeORM migrations on startup.

## Stripe webhooks in Docker

**Option A — Stripe CLI profile**

```bash
# Add STRIPE_SECRET_KEY to .env.docker
docker compose --profile stripe up -d
docker compose logs -f stripe-cli   # copy whsec_ to .env.docker
docker compose up -d api --force-recreate
```

**Option B — Host CLI**

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5432 in use | Stop local Postgres or change port mapping |
| API unhealthy | `docker compose logs api` — wait for Postgres healthy |
| Frontend 502 on /api | Ensure `api` container is healthy |
| Empty DB after reset | `docker compose down -v` then `up` again |
