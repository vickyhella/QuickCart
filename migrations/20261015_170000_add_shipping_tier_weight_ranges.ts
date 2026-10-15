import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "store_settings_shipping_tiers"
      ADD COLUMN IF NOT EXISTS "minimum_weight_kg" numeric,
      ADD COLUMN IF NOT EXISTS "maximum_weight_kg" numeric;
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep configured shipping ranges when rolling back this migration.
}
