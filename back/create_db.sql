CREATE TABLE IF NOT EXISTS "users" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"firstname" TEXT,
"lastname" TEXT,
"email" TEXT NOT NULL UNIQUE,
"password" TEXT NOT NULL,
"phone" TEXT,
"licence" TEXT,
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
FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS "start_date_idx" ON "events" (
	"start_date"
);

CREATE TABLE IF NOT EXISTS "events_registration" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"event_id" INTEGER NOT NULL,
"user_id" INTEGER NOT NULL,
"interest" INTEGER DEFAULT 2,
"lastupdate_datetime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (event_id) REFERENCES events(id),
FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS "messages" (
"id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
"time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
"comment" TEXT NOT NULL,
"author_id" INTEGER NOT NULL,
"event_id" INTEGER NOT NULL,
FOREIGN KEY (author_id) REFERENCES users(id)
FOREIGN KEY (event_id) REFERENCES events(id)
);

/*
CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq);
INSERT INTO sqlite_sequence VALUES(events, 10000);
INSERT INTO sqlite_sequence VALUES(users, 100);
INSERT INTO sqlite_sequence VALUES(events_registration, 0);
INSERT INTO sqlite_sequence VALUES(comments, 0);
*/