# Deployment

## Prerequisites

- AWS account with OIDC GitHub Actions role
- Stripe account (test + live keys)
- Domain + ACM certificate (optional HTTPS)

## Local development

```bash
cp .env.example backend/.env
docker compose -f infra/docker-compose.yml up -d postgres redis
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Stripe setup

1. Create products/prices in Stripe Dashboard.
2. Set `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO` in `backend/.env`.
3. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## Terraform (AWS)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit db_password, api_image, frontend_url

terraform init
terraform plan
terraform apply
```

### Remote state (recommended)

Uncomment the `backend "s3"` block in `main.tf` and create:

- S3 bucket for state
- DynamoDB table for locks

### Secrets

Update AWS Secrets Manager secret `${project}/${environment}/app` with real values for:

- `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## CI/CD

Two workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|----------------|
| **`ci.yml`** | Push / PR to `main` | Unit + E2E tests (Postgres service). No AWS required. |
| **`deploy.yml`** | **Manual only** (`workflow_dispatch`) | Build image → ECR → `terraform apply` |

### Run CI locally (same as GitHub)

```bash
cd backend && npm test && npm run test:e2e
```

### Deploy manually (when AWS is ready)

1. Configure OIDC role + GitHub secrets (below).
2. GitHub → **Actions** → **Deploy to AWS** → **Run workflow**.

Required **secrets**: `AWS_ROLE_ARN`, `DB_PASSWORD`.

Required **variable**: `FRONTEND_URL` (repository or `production` environment).

Optional: create GitHub Environment `production` with required reviewers.

## Production checklist

- [ ] RDS automated backups (7 days, enabled in Terraform)
- [ ] JWT secrets in Secrets Manager
- [ ] Rate limiting enabled (`ThrottlerModule`)
- [ ] CORS set to production frontend URL
- [ ] HTTPS via ACM on ALB
- [ ] Stripe webhook URL points to `https://<alb>/api/billing/webhook`
- [ ] CloudWatch alarms on ECS CPU / 5xx
