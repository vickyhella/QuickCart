import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_variants" ALTER COLUMN "length" DROP NOT NULL;
    ALTER TABLE "products_variants" ALTER COLUMN "shape" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL refuses this rollback if size-only variants exist; never replace their values.
  await db.execute(sql`
    ALTER TABLE "products_variants" ALTER COLUMN "length" SET NOT NULL;
    ALTER TABLE "products_variants" ALTER COLUMN "shape" SET NOT NULL;
  `)
}
