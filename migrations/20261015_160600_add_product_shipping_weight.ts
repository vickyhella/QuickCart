import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "shipping_weight" numeric DEFAULT 0.2;
    UPDATE "products"
      SET "shipping_weight" = 0.2
      WHERE "shipping_weight" IS NULL;
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep product weights when rolling back this migration.
}
