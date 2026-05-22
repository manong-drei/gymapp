import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'liftlog.db';

let database: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase() {
  if (database) {
    return database;
  }

  database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return database;
}

export async function initialiseDatabase() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await openDatabase();

    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS workout_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_plan_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_sets INTEGER,
        target_reps TEXT,
        target_weight REAL,
        rest_seconds INTEGER,
        order_index INTEGER,
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_plan_id INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_session_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight_kg REAL,
        reps INTEGER,
        FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS body_weight_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TIMESTAMP NOT NULL UNIQUE,
        weight_kg REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exercises_workout_plan_id
        ON exercises(workout_plan_id);

      CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_plan_id
        ON workout_sessions(workout_plan_id);

      CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_session_id
        ON workout_sets(workout_session_id);

      CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id
        ON workout_sets(exercise_id);
    `);

    const workoutPlanColumns = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(workout_plans);'
    );
    const workoutPlanColumnNames = workoutPlanColumns.map((column) => column.name);

    if (!workoutPlanColumnNames.includes('description')) {
      await db.execAsync('ALTER TABLE workout_plans ADD COLUMN description TEXT;');
    }

    if (!workoutPlanColumnNames.includes('updated_at')) {
      await db.execAsync('ALTER TABLE workout_plans ADD COLUMN updated_at TIMESTAMP;');
    }

    return db;
  })();

  return initPromise;
}

export async function getDatabase() {
  return initialiseDatabase();
}

export async function executeSql(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDatabase();
  return db.runAsync(sql, params);
}

export async function getAllRows<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDatabase();
  return db.getAllAsync<T>(sql, params);
}

export async function getFirstRow<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDatabase();
  return db.getFirstAsync<T>(sql, params);
}
