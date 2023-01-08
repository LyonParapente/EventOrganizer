ALTER TABLE "users" ADD COLUMN "last_login_datetime" TIMESTAMP;

-- Done manually around release v2.0.5 to avoid "Result: UNIQUE constraint failed" due to a duplicate user with different email case
-- UPDATE users SET email=lower(email) WHERE lower(email)!=email';
