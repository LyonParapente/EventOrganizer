CREATE TABLE IF NOT EXISTS "users" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"firstname" TEXT,
"lastname" TEXT,
"email" TEXT NOT NULL UNIQUE,
"share_email" BOOLEAN DEFAULT 0,
"password" TEXT NOT NULL,
"password_lost" TEXT,
"phone" TEXT,
"share_phone" BOOLEAN DEFAULT 0,
"theme" TEXT,
"role" TEXT,
"creation_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "events" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"title" TEXT NOT NULL,
"start_date" TEXT NOT NULL,
"end_date" TEXT,
"time" TEXT,
"description" TEXT,
"location" TEXT,
"gps" TEXT,
"gps_location" TEXT,
"category" TEXT,
"color" TEXT,
"creator_id" INTEGER NOT NULL,
"creation_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "start_date_idx" ON "events" (
	"start_date"
);

CREATE TABLE IF NOT EXISTS "events_registrations" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"event_id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"interest" INTEGER DEFAULT 2,
"lastupdate_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "registration_user_idx" ON "events_registrations"(
	"event_id",
	"user_id"
);

CREATE TABLE IF NOT EXISTS "messages" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"comment" TEXT NOT NULL,
"author_id" INTEGER NOT NULL,
"event_id" INTEGER NOT NULL,
"creation_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

/*
CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq);
INSERT INTO sqlite_sequence VALUES(events, 10000);
INSERT INTO sqlite_sequence VALUES(users, 100);
INSERT INTO sqlite_sequence VALUES(events_registration, 0);
INSERT INTO sqlite_sequence VALUES(messages, 0);
*/
