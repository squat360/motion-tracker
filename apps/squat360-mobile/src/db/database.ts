import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import type { CoachSession } from '../ai/superCoach';
import { mapCue } from '../ai/superCoach';

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
      try {
        await db.execAsync('ALTER TABLE sets ADD COLUMN form_score INTEGER');
      } catch {
        // column already exists on upgraded installs
      }
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
    'INSERT INTO sets (session_id, exercise, reps, load_kg, notes, form_score) VALUES (?, ?, ?, ?, ?, ?)',
    session.id,
    'squat',
    5,
    60,
    'Seed set for Review UI',
    80
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

export async function insertSet(params: {
  sessionId: number;
  exercise?: string;
  reps: number;
  loadKg?: number | null;
  notes?: string;
  formScore?: number | null;
}): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO sets (session_id, exercise, reps, load_kg, notes, form_score) VALUES (?, ?, ?, ?, ?, ?)',
    params.sessionId,
    params.exercise ?? 'squat',
    params.reps,
    params.loadKg ?? null,
    params.notes ?? '',
    params.formScore ?? null
  );
  return result.lastInsertRowId;
}

type CoachHistoryRow = {
  reps: number;
  load_kg: number | null;
  form_score: number | null;
  cues: string | null;
};

/** Last 12 sets in chronological order for Super Coach. */
export async function listCoachHistory(): Promise<CoachSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CoachHistoryRow>(
    `SELECT s.reps, s.load_kg, s.form_score,
            (SELECT GROUP_CONCAT(f.code, ',') FROM feedback f WHERE f.set_id = s.id) AS cues
       FROM sets s
      ORDER BY s.id DESC
      LIMIT 12`
  );
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      reps: Number(row.reps || 0),
      loadKg: row.load_kg == null ? null : Number(row.load_kg),
      formScore: row.form_score == null ? null : Number(row.form_score),
      cueCodes: (row.cues ? row.cues.split(',') : []).map((c) => mapCue(c)).filter(Boolean).slice(0, 8),
    }));
}
