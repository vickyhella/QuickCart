import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "homepage_featured" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Preserve saved selections when rolling back application code.
  await db.execute(sql`SELECT 1;`)
}
