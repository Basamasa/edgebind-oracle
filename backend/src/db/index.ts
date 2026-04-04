import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { env } from "../config/env"
import { seedDemoData } from "../services/demo-data.service"
import * as schema from "./schema"

const sqlite = new Database(env.DB_URL)

sqlite.pragma("foreign_keys = ON")
sqlite.pragma("journal_mode = WAL")

export const db = drizzle(sqlite, { schema })

const createTablesSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_human_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_amount REAL NOT NULL,
  reward_currency TEXT NOT NULL,
  deadline TEXT NOT NULL,
  proof_type TEXT NOT NULL,
  location_label TEXT,
  location_lat REAL,
  location_lng REAL,
  location_radius_meters REAL,
  status TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  agent_ref TEXT NOT NULL,
  worker_id TEXT,
  request_code TEXT NOT NULL,
  approval_threshold_amount REAL NOT NULL,
  accepted_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  image_url TEXT,
  location_lat REAL,
  location_lng REAL,
  location_accuracy_meters REAL,
  request_code TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS validation_results (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  valid INTEGER NOT NULL,
  reason TEXT NOT NULL,
  requires_approval INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  released_at TEXT,
  approved_by TEXT,
  approval_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_payouts_task_id ON payouts(task_id);
`

let initialized = false

export function initializeDatabase() {
  if (initialized) {
    return
  }

  sqlite.exec(createTablesSql)
  seedDemoData()
  initialized = true
}
