import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
    ALTER TABLE "media_originals" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  `);
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep storage keys intact if this migration is rolled back.
}
