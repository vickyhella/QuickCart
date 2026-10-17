import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "linked_products_count" numeric DEFAULT 0 NOT NULL;
    UPDATE "suppliers" AS supplier
    SET "linked_products_count" = COALESCE(counts.total, 0)
    FROM (
      SELECT "suppliers_id", COUNT(DISTINCT "parent_id") AS total
      FROM "products_rels"
      WHERE "suppliers_id" IS NOT NULL AND "path" = 'suppliers'
      GROUP BY "suppliers_id"
    ) AS counts
    WHERE supplier."id" = counts."suppliers_id";
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep supplier counts when rolling back this migration.
}
