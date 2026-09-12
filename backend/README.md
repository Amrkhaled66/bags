# Bags API

NestJS 12 ecommerce API using PostgreSQL, Drizzle ORM and Zod validation.

## Setup

Requirements: Node.js 22, npm and PostgreSQL.

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run start:dev
```

The API defaults to `http://localhost:3000`. Environment validation stops startup
when a required value is missing or malformed. In production, `CORS_ORIGIN` must
be set explicitly.

`npm run db:migrate` currently uses `drizzle-kit push`. Existing installations
that originally used schema push must apply migration backfills as documented in
the corresponding SQL files; notably `drizzle/0004_rainy_justice.sql` backfills
legacy variant images.

## Commands

```bash
npm run build
npm run lint
npm run start
npm run start:dev
npm run start:prod
npm run db:generate
npm run db:migrate
```

This project intentionally has no permanent automated test files. Backend changes
are verified with temporary HTTP/database flows whose fixtures are removed after
execution.

## Documentation

- [Backend handoff](docs/backend-handoff.md)
- [Access control](docs/access-control.md)
- [List pagination](docs/list-pagination.md)
- [Dashboard overview](docs/dashboard-overview.md)
- [Image uploads](docs/uploads.md)
- [Variant galleries](docs/variant-images.md)
