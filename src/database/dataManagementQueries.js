import { getDatabase } from './database';

const BACKUP_VERSION = 1;

async function getTableRows(db, tableName) {
  return db.getAllAsync(`SELECT * FROM ${tableName}`);
}

export async function exportAppData() {
  const db = await getDatabase();

  const data = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    tables: {
      workout_plans: await getTableRows(db, 'workout_plans'),
      exercises: await getTableRows(db, 'exercises'),
      workout_sessions: await getTableRows(db, 'workout_sessions'),
      workout_sets: await getTableRows(db, 'workout_sets'),
      body_weight_logs: await getTableRows(db, 'body_weight_logs'),
      app_settings: await getTableRows(db, 'app_settings'),
    },
  };

  return JSON.stringify(data, null, 2);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export async function clearAllAppData() {
  const db = await getDatabase();

  await db.execAsync(`
    DELETE FROM workout_sets;
    DELETE FROM workout_sessions;
    DELETE FROM exercises;
    DELETE FROM workout_plans;
    DELETE FROM body_weight_logs;
    DELETE FROM app_settings;
  `);
}

export async function importAppData(jsonText) {
  const parsed = JSON.parse(jsonText);

  if (!parsed?.tables) {
    throw new Error('Invalid backup file.');
  }

  const db = await getDatabase();
  const tables = parsed.tables;

  await db.execAsync('BEGIN TRANSACTION;');

  try {
    await clearAllAppData();

    for (const row of ensureArray(tables.workout_plans)) {
      await db.runAsync(
        `INSERT INTO workout_plans (id, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [row.id, row.name, row.description, row.created_at, row.updated_at]
      );
    }

    for (const row of ensureArray(tables.exercises)) {
      await db.runAsync(
        `INSERT INTO exercises (
           id, workout_plan_id, name, target_sets, target_reps,
           target_weight, rest_seconds, order_index
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.workout_plan_id,
          row.name,
          row.target_sets,
          row.target_reps,
          row.target_weight,
          row.rest_seconds,
          row.order_index,
        ]
      );
    }

    for (const row of ensureArray(tables.workout_sessions)) {
      await db.runAsync(
        `INSERT INTO workout_sessions (id, workout_plan_id, date, status, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [row.id, row.workout_plan_id, row.date, row.status, row.notes]
      );
    }

    for (const row of ensureArray(tables.workout_sets)) {
      await db.runAsync(
        `INSERT INTO workout_sets (
           id, workout_session_id, exercise_id, set_number, weight_kg, reps
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.workout_session_id, row.exercise_id, row.set_number, row.weight_kg, row.reps]
      );
    }

    for (const row of ensureArray(tables.body_weight_logs)) {
      await db.runAsync(
        `INSERT INTO body_weight_logs (id, date, weight_kg)
         VALUES (?, ?, ?)`,
        [row.id, row.date, row.weight_kg]
      );
    }

    for (const row of ensureArray(tables.app_settings)) {
      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)`,
        [row.key, row.value]
      );
    }

    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
