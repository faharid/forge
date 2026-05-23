<div align="center">
  
# Forge

<img width="150" height="150" alt="forge_triangle_icon" src="https://github.com/user-attachments/assets/443b6ca5-5fb1-477d-97a5-b780b1275d2a" />


### SaaS Starter Kit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status: Stable](https://img.shields.io/badge/Status-Stable-green)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2.24+-blue)
![NestJS](https://img.shields.io/badge/NestJS-11-red)
![React](https://img.shields.io/badge/React-19-61dafb)

</div>

> Production-ready SaaS starter with **multi-tenancy**, **Stripe billing**, **observability**, and **AWS deployment**. Ship fast without cutting corners on infrastructure.

**Perfect for:** SaaS MVPs, B2B workspaces, teams learning multi-tenant patterns, and projects that need auth + billing + deploy out of the box.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Layout](#project-layout)
- [API & Tools](#api--tools)
- [Verification & Testing](#verification--testing)
- [Configuration](#configuration)
- [Stripe Setup](#stripe-setup)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Production Checklist](#production-checklist)
- [License](#license)

---

## Overview

Start a SaaS in a weekend with production patterns: row-level multi-tenancy, JWT + RBAC, subscription billing, Docker locally, Terraform on AWS.

### What You Get

| Area | Stack | Version |
|------|-------|---------|
| **API** | NestJS + TypeORM | NestJS 11, TypeORM 0.3 |
| **Frontend** | React + Vite + Tailwind | React 19, Vite 6 |
| **Database** | PostgreSQL + migrations | PostgreSQL 15 |
| **Auth** | JWT access/refresh + RBAC | `admin` \| `member` |
| **Billing** | Stripe Checkout + Portal + webhooks | Stripe API |
| **Cache** | Redis (local / rate-limit ready) | Redis 7 |
| **Metrics** | Prometheus (`/metrics`) | prom-client 15 |
| **Deploy** | Docker → ECR → ECS + RDS + ALB | Terraform |
| **CI/CD** | GitHub Actions | CI on push/PR · deploy manual |

---

## Quick Start

### Prerequisites

- **Node.js** 22+
- **Docker** & **Docker Compose** v2.24+ (recommended)
- 2 GB+ free RAM
- Ports **3000**, **3001**, **5173**, **5432**, **6379** available

### Option A — Docker (recommended)

```bash
git clone https://github.com/faharid/forge
cd forge

cp .env.docker.example .env.docker   # optional: Stripe keys
docker compose up -d --build
```

Wait ~30s for Postgres + API healthchecks, then open:

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | http://localhost:3000 | React UI (nginx) |
| **API** | http://localhost:3001/api | REST backend |
| **Health** | http://localhost:3001/api/health | Liveness + DB |
| **Metrics** | http://localhost:3001/metrics | Prometheus scrape |
| **Postgres** | `localhost:5432` | `forge_dev` / `postgres` / `dev` |
| **Redis** | `localhost:6379` | Sessions / cache ready |

```bash
# Seed demo users (host machine, Postgres must be up)
npm run seed
```

| Email | Password | Workspace |
|-------|----------|-----------|
| admin@acme.dev | password123 | Acme Inc (admin) |
| member@acme.dev | password123 | Acme Inc (member) |
| admin@beta.dev | password123 | Beta Labs (admin) |

### Option B — Native dev

```bash
git clone https://github.com/faharid/forge
cd forge
make install

docker compose up -d postgres redis
cp backend/.env.example backend/.env
npm run seed
npm run dev
```

| Service | URL |
|---------|-----|
| **App** | http://localhost:5173 |
| **API** | http://localhost:3001/api |

### Docker profiles

```bash
make docker-dev      # hot-reload API + Vite (profile: dev)
make docker-obs      # + Prometheus on :9090
make docker-stripe   # Stripe CLI → webhook forwarding
make docker-reset    # down -v (wipes DB volume)
```

More detail: [docs/DOCKER.md](docs/DOCKER.md)

---

## Architecture

<div align="center">

</div>

---

## Project Layout

```
forge/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/            # signup, login, JWT
│   │   ├── users/           # tenant-scoped CRUD
│   │   ├── tenants/         # workspace + invites
│   │   ├── billing/         # Stripe Checkout, webhooks
│   │   ├── database/        # entities, migrations, seeds
│   │   └── common/          # guards, metrics, interceptors
│   ├── test/                # E2E specs
│   └── Dockerfile
├── frontend/                # React + Vite + Tailwind
│   ├── src/pages/           # Login, Dashboard, Billing…
│   └── Dockerfile
├── infra/
│   ├── terraform/           # VPC, ALB, RDS, ECS
│   ├── docker-compose.yml   # legacy path (see root compose)
│   └── prometheus.yml
├── docs/                    # Architecture, API, deploy…
├── insomnia/                # Insomnia collection (import JSON)
├── docker-compose.yml       # full local stack
├── Makefile
└── .github/workflows/       # ci.yml (auto) · deploy.yml (manual)
```

---

## API & Tools

### REST endpoints (summary)

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /api/auth/signup`, `login`, `refresh`, `logout` |
| **Users** | `GET/POST/PUT/DELETE /api/users` (admin for write) |
| **Tenants** | `GET/PUT /api/tenants/me`, `POST …/invite` |
| **Billing** | `GET /api/billing/subscription`, `POST …/checkout`, `…/portal`, `…/webhook` |

Full reference: [docs/API.md](docs/API.md)

### Insomnia

Import [`insomnia/Forge-API.insomnia.json`](insomnia/Forge-API.insomnia.json) → **Application → Import Data**.

Preconfigured environment: `base_url`, `access_token`, seed user emails.

---

## Verification & Testing

```bash
# Unit tests
cd backend && npm test

# E2E (requires Postgres on :5432)
cd backend && npm run test:e2e

# Or from repo root
npm run test:e2e
```

E2E coverage:

- Auth: signup, login, refresh
- Multi-tenant isolation (Acme vs Beta)
- RBAC: admin can create users
- Billing: subscription + webhook rejection without signature

### Quick smoke test

```bash
curl http://localhost:3001/api/health
# {"status":"ok","database":"connected"}

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.dev","password":"password123"}'
```

---

## Configuration

Copy examples and adjust:

```bash
cp backend/.env.example backend/.env
cp .env.docker.example .env.docker   # Docker Compose only
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `REFRESH_SECRET` | Token signing (use strong values in prod) |
| `FRONTEND_URL` | CORS + Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | Stripe API (test mode for dev) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe CLI or Dashboard |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | Price IDs |
| `SEED_PASSWORD` | Demo users password (`npm run seed`) |
| `DATADOG_API_KEY` | Optional APM (enables `dd-trace`) |

```bash
# Migrations (production / explicit schema)
cd backend && npm run migration:run

# Seed
npm run seed          # idempotent
npm run seed:fresh    # truncate + re-seed
```

---

## Stripe Setup

1. Create **Starter** and **Pro** products in the [Stripe Dashboard](https://dashboard.stripe.com/test/products).
2. Copy Price IDs to `backend/.env` (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`).
3. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

4. Copy `whsec_…` into `STRIPE_WEBHOOK_SECRET` and restart the API.

With Docker: `make docker-stripe` (requires `STRIPE_SECRET_KEY` in `.env.docker`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Port 5432 in use** | Stop local Postgres or change the compose port mapping |
| **API container unhealthy** | `docker compose logs api` — wait for Postgres healthy; check `DATABASE_URL` |
| **Frontend 502 on `/api`** | Ensure `forge-api` is healthy: `docker compose ps` |
| **Login fails after seed** | Run `npm run seed` with Postgres up; use `admin@acme.dev` / `password123` |
| **Stripe checkout 400** | Set `STRIPE_SECRET_KEY` and price IDs; billing lazy-loads Stripe only when configured |
| **E2E `supertest` TS error** | Use `import request from 'supertest'` (already fixed in repo) |
| **Empty database** | `docker compose down -v && docker compose up -d` then `npm run seed` |

Logs:

```bash
docker compose logs -f api
docker compose logs -f frontend
```

---

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, auth & billing flows |
| [docs/MULTI_TENANCY.md](docs/MULTI_TENANCY.md) | Row-level isolation checklist |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Terraform, AWS, secrets, Stripe prod URL |
| [docs/API.md](docs/API.md) | Endpoints, seed users, curl examples |
| [docs/DOCKER.md](docs/DOCKER.md) | Compose profiles, seed in Docker |

---

## Production Checklist

- [ ] RDS automated backups enabled (Terraform: 7-day retention)
- [ ] JWT / Stripe secrets in AWS Secrets Manager
- [ ] `ENVIRONMENT=production` + migrations on deploy
- [ ] CORS `FRONTEND_URL` set to production domain
- [ ] HTTPS on ALB (ACM certificate)
- [ ] Stripe webhook URL → `https://<domain>/api/billing/webhook`
- [ ] Rate limiting verified (`ThrottlerModule`)
- [ ] Prometheus / Datadog / CloudWatch alerting configured
- [ ] Load testing completed

---

## License

MIT — see [LICENSE](LICENSE).

---

**Built for startups that ship. Production-ready patterns, minimal glue code.**
