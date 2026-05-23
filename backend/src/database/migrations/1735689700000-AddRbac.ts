import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbac1735689700000 implements MigrationInterface {
  name = 'AddRbac1735689700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "token" character varying NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "accepted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenant_invites_token" UNIQUE ("token"),
        CONSTRAINT "PK_tenant_invites" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_invites_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_invites_tenant_id" ON "tenant_invites" ("tenant_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant_invites"`);
  }
}
