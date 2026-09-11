import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

export type Client = {
  id: number;
  name: string;
  notes: string;
  created_at: string;
};

export type SessionRow = {
  id: number;
  client_id: number | null;
  title: string;
  video_uri: string | null;
  recorded_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('squat360.db');
      await db.execAsync(SCHEMA_SQL);
      await seedIfEmpty(db);
      return db;
    })();
  }
  return dbPromise;
}

async function seedIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM clients');
  if (row && row.c > 0) return;

  await db.runAsync(
    'INSERT INTO clients (name, notes) VALUES (?, ?)',
    'Alex Rivera',
    'Pilot athlete — morning strength block'
  );
  await db.runAsync(
    'INSERT INTO clients (name, notes) VALUES (?, ?)',
    'Jordan Lee',
    'Return-to-lift; coach-led progressions'
  );
  await db.runAsync(
    'INSERT INTO clients (name, notes) VALUES (?, ?)',
    'Sam Okonkwo',
    'Fold7 demo client for gym walkthrough'
  );

  const client = await db.getFirstAsync<{ id: number }>('SELECT id FROM clients LIMIT 1');
  const clientId = client?.id ?? null;

  await db.runAsync(
    'INSERT INTO sessions (client_id, title, video_uri) VALUES (?, ?, ?)',
    clientId,
    'Seed squat session',
    null
  );
  const session = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM sessions ORDER BY id DESC LIMIT 1'
  );
  if (!session) return;

  await db.runAsync(
    'INSERT INTO sets (session_id, exercise, reps, load_kg, notes) VALUES (?, ?, ?, ?, ?)',
    session.id,
    'squat',
    5,
    60,
    'Seed set for Review UI'
  );
  const setRow = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM sets ORDER BY id DESC LIMIT 1'
  );
  if (!setRow) return;

  await db.runAsync(
    'INSERT INTO feedback (set_id, code, severity, message, coach_hint) VALUES (?, ?, ?, ?, ?)',
    setRow.id,
    'DEPTH_CHECK',
    'cue',
    'Seed feedback: discuss depth with coach.',
    'Augments coaching — trainer decides cues.'
  );
}

export async function listClients(): Promise<Client[]> {
  const db = await getDb();
  return db.getAllAsync<Client>('SELECT * FROM clients ORDER BY name');
}

export async function listSessions(): Promise<SessionRow[]> {
  const db = await getDb();
  return db.getAllAsync<SessionRow>('SELECT * FROM sessions ORDER BY recorded_at DESC');
}

export async function insertSession(params: {
  clientId: number | null;
  title: string;
  videoUri: string | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO sessions (client_id, title, video_uri) VALUES (?, ?, ?)',
    params.clientId,
    params.title,
    params.videoUri
  );
  return result.lastInsertRowId;
}
