ALTER TABLE "users" ADD COLUMN "share_email" BOOLEAN DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "share_phone" BOOLEAN DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "role" text;
ALTER TABLE "users" ADD COLUMN "theme" text;

-- Not possible in sqlite:
-- ALTER TABLE "users" DROP COLUMN "licence";
-- https://www.hwaci.com/sw/sqlite/lang_altertable.html