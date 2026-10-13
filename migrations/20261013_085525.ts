import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "studio_temporary" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_s_k_u" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "purchase_u_r_l" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "studio_request_i_d" varchar;
    ALTER TABLE "products_variants" ADD COLUMN IF NOT EXISTS "supplier_s_k_u" varchar;
    ALTER TABLE "products_variants" ADD COLUMN IF NOT EXISTS "purchase_u_r_l" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "products_studio_request_i_d_idx" ON "products" USING btree ("studio_request_i_d");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "products_studio_request_i_d_idx";
    ALTER TABLE "products_variants" DROP COLUMN IF EXISTS "purchase_u_r_l";
    ALTER TABLE "products_variants" DROP COLUMN IF EXISTS "supplier_s_k_u";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "studio_request_i_d";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "purchase_u_r_l";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "supplier_s_k_u";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "studio_temporary";
  `)
}
