# EdgeBind — Backend

Node.js / TypeScript backend for the EdgeBind verification flow.
Uses Drizzle ORM with SQLite locally — swap `DB_URL` to a Postgres URL for prod.

## Setup

```bash
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

## DB commands

```bash
npm run db:studio    # visual DB browser
npm run db:generate  # generate migrations after schema changes
npm run db:migrate   # apply pending migrations
```
