import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = process.env.SERAPHIM_DATA_DIR
  ? process.env.SERAPHIM_DATA_DIR
  : join(dirname(fileURLToPath(import.meta.url)), 'data');
const DB_PATH = join(DATA_DIR, 'seraphim.db');

let db = null;

export function loadStore() {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL,
      UNIQUE(collection, id)
    );
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection);');
  return db;
}

function conn() {
  return db || loadStore();
}

// Writes are committed immediately by SQLite; kept for interface compatibility.
export function saveStore() {}

export function list(name) {
  const rows = conn()
    .prepare('SELECT data FROM records WHERE collection = ? ORDER BY seq DESC')
    .all(name);
  return rows.map((r) => JSON.parse(r.data));
}

export function filter(name, query = {}) {
  const entries = Object.entries(query || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  return list(name).filter((row) => entries.every(([k, v]) => row[k] === v));
}

export function create(name, data = {}) {
  const now = new Date().toISOString();
  const row = {
    ...data,
    id: data.id || randomUUID(),
    created_date: data.created_date || now,
    updated_date: now,
  };
  conn()
    .prepare(
      'INSERT INTO records (collection, id, data, created_date, updated_date) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, row.id, JSON.stringify(row), row.created_date, row.updated_date);
  return row;
}

function findRow(name, id) {
  const direct = conn()
    .prepare('SELECT data FROM records WHERE collection = ? AND id = ?')
    .get(name, id);
  if (direct) return JSON.parse(direct.data);
  // Legacy behavior: some callers pass a beacon_id instead of the row id.
  const match = list(name).find((r) => r.beacon_id === id);
  return match || null;
}

export function update(name, id, data = {}) {
  const existing = findRow(name, id);
  if (!existing) return null;
  const merged = {
    ...existing,
    ...data,
    id: existing.id,
    created_date: existing.created_date,
    updated_date: new Date().toISOString(),
  };
  conn()
    .prepare(
      'UPDATE records SET data = ?, updated_date = ? WHERE collection = ? AND id = ?',
    )
    .run(JSON.stringify(merged), merged.updated_date, name, existing.id);
  return merged;
}

export function remove(name, id) {
  const result = conn()
    .prepare('DELETE FROM records WHERE collection = ? AND id = ?')
    .run(name, id);
  return result.changes > 0;
}

export function hasAnyRows() {
  const row = conn().prepare('SELECT COUNT(*) AS n FROM records').get();
  return (row?.n || 0) > 0;
}

export { DATA_DIR };
