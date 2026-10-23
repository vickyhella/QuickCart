import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "placement" varchar DEFAULT 'hidden';
    UPDATE "pages"
    SET "placement" = CASE
      WHEN "slug" IN ('privacy-policy', 'terms-conditions', 'refunds-returns', 'shipping-policy') THEN 'footer-customer-care'
      WHEN "slug" IN ('about-us', 'contact-us') THEN 'footer-explore'
      ELSE 'hidden'
    END
    WHERE "placement" IS NULL OR "placement" = 'hidden';
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep storefront page placement values when rolling back.
}
