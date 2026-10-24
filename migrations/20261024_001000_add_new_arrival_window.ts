import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    UPDATE "products" SET "published_at" = "created_at" WHERE "status" = 'published' AND "published_at" IS NULL;
    CREATE INDEX IF NOT EXISTS "products_published_at_idx" ON "products" USING btree ("published_at");
    ALTER TABLE "marketing_settings" ADD COLUMN IF NOT EXISTS "new_arrival_days" integer DEFAULT 30;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "marketing_settings" DROP COLUMN IF EXISTS "new_arrival_days";
    DROP INDEX IF EXISTS "products_published_at_idx";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "published_at";
  `)
}
