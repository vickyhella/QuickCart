import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "suppliers" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "purchase_u_r_l" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "suppliers_name_unique" UNIQUE("name")
    );
    CREATE INDEX IF NOT EXISTS "suppliers_updated_at_idx" ON "suppliers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "suppliers_created_at_idx" ON "suppliers" USING btree ("created_at");
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "chinese_name" varchar;
    ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "suppliers_id" integer;
    DO $$ BEGIN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_suppliers_fk"
        FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "products_rels_suppliers_id_idx" ON "products_rels" USING btree ("suppliers_id");
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "suppliers_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suppliers_fk"
        FOREIGN KEY ("suppliers_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_suppliers_id_idx" ON "payload_locked_documents_rels" USING btree ("suppliers_id");
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep supplier relationships intact if this migration is rolled back.
}
