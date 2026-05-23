# Forge

> Production-ready SaaS starter with multi-tenancy, observability, and AWS deployment. Built for startups that need to ship fast without cutting corners on infrastructure.

## Overview

Start a SaaS in a weekend with production patterns. Everything you need:
- **Backend:** NestJS + multi-tenant architecture
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL with migrations
- **Multi-tenancy:** Row-level isolation + schema separation patterns
- **Deployment:** Docker + ECS (Terraform ready)
- **Auth:** JWT + RBAC (role-based access control)
- **Observability:** Prometheus metrics + Datadog hooks
- **Billing:** Stripe Checkout, Customer Portal, webhooks

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/faharid/forge
cd forge

cp .env.docker.example .env.docker   # optional: Stripe keys
docker compose up -d --build

# App:  http://localhost:3000
# API:  http://localhost:3001/api
# Docs: docs/DOCKER.md
```

### Seed demo users

```bash
npm run seed          # idempotent
npm run seed:fresh    # wipe + re-seed
```

| Email | Password | Role |
|-------|----------|------|
| admin@acme.dev | password123 | admin (Acme) |
| member@acme.dev | password123 | member (Acme) |
| admin@beta.dev | password123 | admin (Beta Labs) |

### Option B — Native dev

```bash
git clone https://github.com/faharid/forge
cd forge
make install

docker compose up -d postgres redis   # DB only
cp backend/.env.example backend/.env
npm run seed
npm run dev

# App: http://localhost:5173
# API: http://localhost:3001
```

### Docker profiles

```bash
make docker-dev      # hot-reload API + Vite
make docker-obs      # + Prometheus
make docker-stripe   # Stripe webhook forwarding
make docker-reset    # wipe volumes
```

## Architecture

```
┌─────────────────────────────────────┐
│        React Frontend               │
│   - Authentication                  │
│   - Multi-tenant UI                 │
│   - Settings, Billing               │
└────────────┬────────────────────────┘
             │ HTTP/GraphQL
┌────────────▼────────────────────────┐
│       NestJS Backend                │
│   - Multi-tenant middleware         │
│   - Auth guards                     │
│   - Tenant isolation                │
└────────────┬────────────────────────┘
             │ Row-level queries
┌────────────▼────────────────────────┐
│     PostgreSQL Database             │
│   - Shared DB (row-level)           │
│   - Migrations                      │
└─────────────────────────────────────┘

Deployment:
Docker → ECR → ECS on AWS
  + CloudWatch Logs
  + Prometheus metrics
  + Auto-scaling
```

## Directory Structure

```
forge/
├── backend/
│   ├── src/
│   │   ├── main.ts                       # App entry
│   │   ├── app.module.ts                 # Root module
│   │   ├── common/
│   │   │   ├── middleware/
│   │   │   │   └── tenant.middleware.ts  # Extract tenant from request
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts         # JWT validation
│   │   │   │   └── rbac.guard.ts         # Role-based access
│   │   │   ├── decorators/
│   │   │   │   ├── tenant.decorator.ts   # @CurrentTenant()
│   │   │   │   └── roles.decorator.ts    # @Roles('admin')
│   │   │   └── pipes/
│   │   │       └── validation.pipe.ts    # Request validation
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts           # Login, signup, JWT
│   │   │   ├── auth.controller.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── user.entity.ts            # TypeORM entity
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   ├── tenants/
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.service.ts        # Create/manage tenants
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenant.entity.ts          # TypeORM entity
│   │   │   └── dto/
│   │   │       └── create-tenant.dto.ts
│   │   ├── database/
│   │   │   ├── database.module.ts        # TypeORM config
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── tenant.entity.ts
│   │   │   │   └── subscription.entity.ts
│   │   │   └── migrations/
│   │   │       ├── 001-initial.ts
│   │   │       └── 002-add-rbac.ts
│   │   └── config/
│   │       ├── database.config.ts
│   │       ├── auth.config.ts
│   │       └── app.config.ts
│   ├── test/
│   │   ├── auth.e2e.ts                  # E2E tests
│   │   └── multi-tenant.e2e.ts
│   ├── Dockerfile
│   ├── docker-compose.yml               # Local dev environment
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx             # Authentication
│   │   │   ├── SignupPage.tsx
│   │   │   ├── DashboardPage.tsx         # Main app
│   │   │   ├── SettingsPage.tsx          # Tenant settings
│   │   │   └── BillingPage.tsx           # Subscription management
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx             # Protected routes
│   │   │   ├── TenantSwitcher.tsx        # Switch between tenants
│   │   │   ├── Navigation.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                # Authentication hook
│   │   │   ├── useTenant.ts              # Current tenant hook
│   │   │   └── useApi.ts                 # API client
│   │   ├── services/
│   │   │   ├── api.ts                    # Axios client with auth
│   │   │   ├── auth.service.ts
│   │   │   └── tenant.service.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── infra/
│   ├── terraform/
│   │   ├── main.tf                       # VPC, ALB, RDS, ECS
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── ecs.tf                        # ECS cluster config
│   │   ├── rds.tf                        # RDS PostgreSQL
│   │   └── terraform.tfvars.example
│   └── docker-compose.yml                # Local: postgres, redis
├── docs/
│   ├── ARCHITECTURE.md                   # Detailed architecture
│   ├── MULTI_TENANCY.md                  # Tenancy patterns explained
│   ├── DEPLOYMENT.md                     # AWS deployment guide
│   └── API.md                            # API endpoints
├── .github/
│   └── workflows/
│       └── deploy.yml                    # CI/CD pipeline
└── README.md (this file)
```

## Key Features Explained

### 1. Multi-Tenancy (Row-Level Isolation)

All tenants share the same database, separated by row-level queries:

```typescript
// In tenant.middleware.ts
// Extract tenant_id from JWT or URL param
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user.tenant_id; // From JWT
    req.tenant_id = tenantId;
    next();
  }
}

// In any service
async getUsers(tenantId: string) {
  return this.userRepository.find({
    where: { tenant_id: tenantId } // Only this tenant's users
  });
}
```

**Benefits:** Simple, scalable, cost-effective
**Tradeoff:** Requires discipline (always filter by tenant_id)

### 2. Authentication & RBAC

JWT-based auth with role-based access control:

```typescript
// Sign up creates a tenant + user
async signup(email: string, password: string) {
  const tenant = await this.tenantsService.create();
  const user = await this.usersService.create({
    email,
    password: hashPassword(password),
    tenant_id: tenant.id,
    role: 'admin' // Owner gets admin role
  });
  return { user, token: generateJWT(user) };
}

// Protect routes by role
@UseGuards(AuthGuard)
@UseGuards(RolesGuard)
@Roles('admin')
@Post('users')
async createUser(@Body() dto: CreateUserDto) { ... }
```

### 3. Database Migrations

TypeORM migrations for schema management:

```bash
# Generate migration
npm run typeorm migration:generate -- -n AddRBAC

# Run migrations
npm run typeorm migration:run

# Files auto-created in src/database/migrations/
```

### 4. Observability Hooks

Prometheus metrics + Datadog instrumentation:

```typescript
// Request latency tracking
import { Counter, Histogram } from 'prom-client';

const httpRequests = new Counter({
  name: 'saas_http_requests_total',
  labelNames: ['method', 'route', 'status']
});

// Use in middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    httpRequests.inc({
      method: req.method,
      route: req.route?.path,
      status: res.statusCode
    });
  });
  next();
});
```

### 5. Docker & Deployment

Local development with Docker:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: saas_dev
  api:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres
```

AWS deployment with Terraform:

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply

# Creates: ECS cluster, ALB, RDS, auto-scaling
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account + tenant
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - List users in current tenant
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tenants
- `GET /api/tenants/me` - Get current tenant details
- `PUT /api/tenants/me` - Update tenant
- `POST /api/tenants/me/invite` - Invite user

### Billing (example)
- `GET /api/billing/subscription` - Get current subscription
- `POST /api/billing/upgrade` - Upgrade plan

## Testing

```bash
# Run tests
npm run test

# E2E tests (with real DB)
npm run test:e2e

# Examples included:
# - signup + login flow
# - multi-tenant isolation
# - RBAC enforcement
# - Database constraints
```

## Configuration

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/saas_dev
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
ENVIRONMENT=development

# Datadog (optional)
DATADOG_API_KEY=xxx
DATADOG_SITE=datadoghq.com
```

### Change Database

Default: PostgreSQL + TypeORM
- Switch to MongoDB: Update database.module.ts
- Switch to Prisma: Install @prisma/client, update schema.prisma

## Production Checklist

- [ ] Database backups enabled (RDS automated backups)
- [ ] JWT secret in secrets manager (AWS Secrets Manager)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] HTTPS enforced
- [ ] Monitoring + alerting set up (CloudWatch/Datadog)
- [ ] Database indexes created (migrations run)
- [ ] Error tracking enabled (Sentry/Datadog)
- [ ] Load testing done
- [ ] Database scaling strategy (read replicas, partitioning)

## Files to Create with Cursor

```
forge/
├── backend/src/app.module.ts
├── backend/src/common/middleware/tenant.middleware.ts
├── backend/src/common/guards/auth.guard.ts
├── backend/src/auth/auth.service.ts
├── backend/src/users/users.service.ts
├── backend/src/tenants/tenants.service.ts
├── backend/src/database/database.module.ts
├── backend/Dockerfile
├── frontend/src/App.tsx
├── frontend/src/pages/LoginPage.tsx
├── frontend/src/hooks/useAuth.ts
├── frontend/src/services/api.ts
├── infra/terraform/main.tf
├── infra/docker-compose.yml
└── README.md (this file)
```

## Stripe Setup

1. Create Starter and Pro prices in [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Add price IDs to `backend/.env`
3. Forward webhooks locally: `stripe listen --forward-to localhost:3001/api/billing/webhook`

## Next Steps

1. **Clone & setup:** Follow Quick Start above
2. **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Multi-tenancy:** [docs/MULTI_TENANCY.md](docs/MULTI_TENANCY.md)
4. **Deploy to AWS:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
5. **API reference:** [docs/API.md](docs/API.md)

## License

MIT

---

**Built for startups that ship. No technical debt. Production-ready.**
