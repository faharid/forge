# API Reference

Base URL: `http://localhost:3001/api` (dev)

**Insomnia collection:** import [`insomnia/Forge-API.insomnia.json`](../insomnia/Forge-API.insomnia.json) (Application → Import/Export → Import Data).

## Seed data (dev)

```bash
# From repo root (requires Postgres + migrations or synchronize)
npm run seed

# Wipe tenants/users and re-seed
npm run seed:fresh
```

| Email | Password | Tenant | Role |
|-------|----------|--------|------|
| admin@acme.dev | password123 | Acme Inc | admin |
| member@acme.dev | password123 | Acme Inc | member |
| admin@beta.dev | password123 | Beta Labs | admin |
| member@beta.dev | password123 | Beta Labs | member |

Override password: `SEED_PASSWORD=yourpass npm run seed`

## Authentication

### POST /auth/signup

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123","tenantName":"Acme"}'
```

### POST /auth/login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'
```

### POST /auth/refresh

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh>"}'
```

## Users (Bearer token required)

| Method | Path | Role |
|--------|------|------|
| GET | /users | any |
| POST | /users | admin |
| PUT | /users/:id | admin |
| DELETE | /users/:id | admin |

## Tenants

| Method | Path | Role |
|--------|------|------|
| GET | /tenants/me | any |
| PUT | /tenants/me | any |
| POST | /tenants/me/invite | admin |

## Billing

| Method | Path | Role |
|--------|------|------|
| GET | /billing/subscription | any |
| POST | /billing/checkout | admin |
| POST | /billing/portal | admin |
| POST | /billing/webhook | Stripe signature |

### Checkout example

```bash
curl -X POST http://localhost:3001/api/billing/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"plan":"starter"}'
```

## Health & metrics

- `GET /api/health` — database connectivity
- `GET /metrics` — Prometheus scrape endpoint
