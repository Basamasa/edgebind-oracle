import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"

import type { UserSummary } from "@/lib/domain"

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">

const SEEDED_USERS: UserSummary[] = [
  { id: "owner-ava", name: "Ava Agent Ops", role: "owner", isHumanVerified: false },
  { id: "owner-jules", name: "Jules Dispatch", role: "owner", isHumanVerified: false },
  { id: "worker-lina", name: "Lina Verified", role: "worker", isHumanVerified: true },
  { id: "worker-marcus", name: "Marcus Runner", role: "worker", isHumanVerified: true },
  { id: "admin-rhea", name: "Rhea Approver", role: "admin", isHumanVerified: true },
]

declare global {
  var __edgebindPoolPromise: Promise<Pool> | undefined
  var __edgebindSchemaPromise: Promise<void> | undefined
}

function databaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

  if (!value) {
    throw new Error("DATABASE_URL is required for the production-safe task runtime")
  }

  return value
}

async function createPool() {
  if (databaseUrl() === "pgmem") {
    const { newDb } = await import("pg-mem")
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true })
    const { Pool: MemoryPool } = memoryDb.adapters.createPg()
    return new MemoryPool()
  }

  return new Pool({
    connectionString: databaseUrl(),
    max: 10,
  })
}

async function getPool() {
  if (!globalThis.__edgebindPoolPromise) {
    globalThis.__edgebindPoolPromise = createPool()
  }

  return globalThis.__edgebindPoolPromise
}

async function runBootstrap(executor: Queryable) {
  const statements = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_human_verified BOOLEAN NOT NULL DEFAULT FALSE,
        world_nullifier TEXT,
        payout_account_id TEXT
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reward_amount DOUBLE PRECISION NOT NULL,
        reward_currency TEXT NOT NULL,
        deadline TIMESTAMPTZ NOT NULL,
        proof_type TEXT NOT NULL,
        location_label TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        location_radius_meters DOUBLE PRECISION,
        status TEXT NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id),
        agent_ref TEXT NOT NULL,
        worker_id TEXT REFERENCES users(id),
        request_code TEXT NOT NULL,
        approval_threshold_amount DOUBLE PRECISION NOT NULL,
        accepted_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        worker_id TEXT NOT NULL REFERENCES users(id),
        submitted_at TIMESTAMPTZ NOT NULL,
        image_url TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        location_accuracy_meters DOUBLE PRECISION,
        request_code TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS validations (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
        valid BOOLEAN NOT NULL,
        reason TEXT NOT NULL,
        requires_approval BOOLEAN NOT NULL,
        agent_decision TEXT,
        created_at TIMESTAMPTZ NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT NOT NULL,
        rail TEXT NOT NULL DEFAULT 'internal',
        reference TEXT,
        released_at TIMESTAMPTZ,
        approved_by TEXT REFERENCES users(id),
        approval_note TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS agent_handoffs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        token TEXT,
        owner_id TEXT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ
      )
    `,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS world_nullifier TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_id TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_world_nullifier_idx ON users(world_nullifier) WHERE world_nullifier IS NOT NULL`,
    `ALTER TABLE payouts ADD COLUMN IF NOT EXISTS rail TEXT NOT NULL DEFAULT 'internal'`,
    `ALTER TABLE payouts ADD COLUMN IF NOT EXISTS reference TEXT`,
    `CREATE INDEX IF NOT EXISTS tasks_owner_id_idx ON tasks(owner_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_worker_id_idx ON tasks(worker_id)`,
    `CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS submissions_task_created_at_idx ON submissions(task_id, created_at DESC)`,
  ]

  for (const statement of statements) {
    await executor.query(statement)
  }

  for (const user of SEEDED_USERS) {
    await executor.query(
      `
        INSERT INTO users (id, name, role, is_human_verified)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            role = EXCLUDED.role,
            is_human_verified = users.is_human_verified OR EXCLUDED.is_human_verified
      `,
      [user.id, user.name, user.role, user.isHumanVerified],
    )
  }
}

export async function ensureDatabase() {
  if (!globalThis.__edgebindSchemaPromise) {
    globalThis.__edgebindSchemaPromise = (async () => {
      const pool = await getPool()
      await runBootstrap(pool)
    })().catch((error) => {
      globalThis.__edgebindSchemaPromise = undefined
      throw error
    })
  }

  await globalThis.__edgebindSchemaPromise
}

export async function dbQuery<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
  executor?: Queryable,
) {
  await ensureDatabase()
  const client = executor ?? (await getPool())
  return client.query<T>(text, params)
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  await ensureDatabase()
  const pool = await getPool()
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function resetDatabaseForTests() {
  if (globalThis.__edgebindPoolPromise) {
    const pool = await globalThis.__edgebindPoolPromise
    await pool.end()
  }

  globalThis.__edgebindPoolPromise = undefined
  globalThis.__edgebindSchemaPromise = undefined
}

export async function databaseHealth() {
  const result: QueryResult<{ now: string | Date }> = await dbQuery(`SELECT NOW() AS now`)
  const current = result.rows[0]?.now

  return {
    status: "ok" as const,
    now: current ? new Date(current).toISOString() : new Date().toISOString(),
  }
}
