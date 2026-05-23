# Multi-Tenancy

Forge uses **row-level isolation**: all tenants share one PostgreSQL database, separated by `tenant_id` on every query.

## Rules

1. **Always** filter by `tenant_id` from the JWT — never trust client-supplied tenant IDs alone.
2. Use `withTenantFilter(tenantId, where)` in services.
3. Unique constraints are scoped: `(tenant_id, email)` on users.
4. E2E tests verify tenant A cannot read tenant B data.

## Schema separation (not implemented)

For enterprise customers, you can migrate high-value tenants to dedicated schemas or databases. See TypeORM multi-database connections for that pattern.

## Checklist for new features

- [ ] Entity has `tenant_id` column
- [ ] Service methods accept `tenantId` as first argument
- [ ] Controller uses `@CurrentTenant()`
- [ ] E2E test covers cross-tenant denial
