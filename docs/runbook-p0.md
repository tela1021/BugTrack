# P0 local PostgreSQL runbook

## Local and test profiles

- `bugtrack_dev` is the local development database; `.env` contains only its local connection URLs and is ignored by Git.
- `bugtrack_test` is an isolated local test database. Run the same tracked migrations with its `DATABASE_URL` and `DIRECT_URL` values before database integration tests.
- Staging and production require independent databases, non-committed secrets, a private application network, and separate application/migration roles. They are not created by this repository.

## Start and verify

1. Copy `.env.example` to `.env` and set PostgreSQL, NextAuth and `SEED_ADMIN_PASSWORD` values.
2. Run `npm run db:validate`, then `npm run db:migrate`.
3. For optional sample users, run `npm run seed`; it refuses weak or missing passwords and is idempotent.
4. Run `npm test`, `npm run lint -- --quiet`, `npm run typecheck`, and `npm run build`.

## Backup and restore drill

Before each production migration, create a timestamped `pg_dump --format=custom` with the migration role, restore it into an empty isolated database with `pg_restore`, run `npm run db:migrate`, and verify `SELECT 1`, Prisma migration status, issue count, and a private attachment download. Record the operator, timestamps and result. This repository cannot perform staging/production backups without the corresponding server credentials.

## Rollback

P0 migrations are additive. If application readiness fails after deploy, reload the prior application version while preserving the database; do not run schema rollback SQL automatically. Restore from the verified backup only when a data incident requires it.
