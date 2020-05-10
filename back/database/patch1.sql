ALTER TABLE "users" ADD COLUMN "share_email" BOOLEAN DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "share_phone" BOOLEAN DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "role" TEXT;
ALTER TABLE "users" ADD COLUMN "theme" TEXT;
ALTER TABLE "users" ADD COLUMN "password_lost" TEXT;
ALTER TABLE "users" ADD COLUMN "notif_new_event" BOOLEAN DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "notif_event_change" BOOLEAN DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "notif_tomorrow_events" BOOLEAN DEFAULT 1;

-- Not possible in sqlite:
-- ALTER TABLE "users" DROP COLUMN "licence";
-- https://www.hwaci.com/sw/sqlite/lang_altertable.html