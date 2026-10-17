import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "product_dimensions"
      ADD COLUMN IF NOT EXISTS "dimensions" jsonb DEFAULT '[{"key":"quantity","label":"Quantity","valueType":"integer","options":[]}]'::jsonb;
    ALTER TABLE "products_variants"
      ADD COLUMN IF NOT EXISTS "attributes" jsonb DEFAULT '{}'::jsonb;
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep custom product dimensions and variant attributes when rolling back.
}
