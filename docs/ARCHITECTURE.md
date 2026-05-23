# Architecture

## Overview

Forge is a multi-tenant SaaS starter with a React frontend, NestJS API, PostgreSQL, and AWS deployment.

```
React (Vite) → ALB → ECS (NestJS) → RDS PostgreSQL
                      ↓
                   Stripe webhooks
```

## Backend modules

| Module | Responsibility |
|--------|----------------|
| `auth` | Signup, login, JWT refresh, logout |
| `users` | CRUD users scoped by `tenant_id` |
| `tenants` | Workspace settings, invites |
| `billing` | Stripe Checkout, Portal, webhooks |
| `health` | Liveness + DB ping |

## Multi-tenancy

Row-level isolation: every business table includes `tenant_id`. The `TenantInterceptor` sets AsyncLocalStorage after JWT validation. Services use `withTenantFilter(tenantId)` for queries.

## Auth flow

1. Signup creates `Tenant` + admin `User` + inactive `Subscription`.
2. Login returns access + refresh JWTs.
3. Access token payload: `{ sub, email, tenant_id, role }`.
4. `@Roles('admin')` + `RolesGuard` enforce RBAC.

## Billing flow

1. Admin opens Billing → `POST /api/billing/checkout`.
2. Stripe Checkout redirects back to `/billing?checkout=success`.
3. Webhook `checkout.session.completed` syncs subscription to DB and updates `tenant.plan`.

## Observability

- Prometheus metrics at `GET /metrics`
- Optional Datadog via `dd-trace` when `DATADOG_API_KEY` is set
- CloudWatch logs from ECS task definition
