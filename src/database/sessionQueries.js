import { getDatabase } from './database';

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

export async function createCompletedWorkoutSession(workoutPlanId, setRecords, notes = '') {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.execAsync('BEGIN TRANSACTION;');

  try {
    const sessionResult = await db.runAsync(
      `INSERT INTO workout_sessions (workout_plan_id, date, status, notes)
       VALUES (?, ?, ?, ?)`,
      [workoutPlanId, now, 'Completed', notes.trim() || null]
    );

    const workoutSessionId = sessionResult.lastInsertRowId;

    for (const record of setRecords) {
      await db.runAsync(
        `INSERT INTO workout_sets (
           workout_session_id,
           exercise_id,
           set_number,
           weight_kg,
           reps
         )
         VALUES (?, ?, ?, ?, ?)`,
        [
          workoutSessionId,
          record.exerciseId,
          record.setNumber,
          toNumberOrNull(record.weightKg),
          toNumberOrNull(record.reps),
        ]
      );
    }

    await db.execAsync('COMMIT;');
    return workoutSessionId;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function getWorkoutSessions() {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       workout_sessions.id,
       workout_sessions.workout_plan_id,
       workout_sessions.date,
       workout_sessions.status,
       workout_sessions.notes,
       workout_plans.name AS workout_plan_name
     FROM workout_sessions
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     ORDER BY datetime(workout_sessions.date) DESC, workout_sessions.id DESC`
  );
}

export async function getLatestWorkoutSession() {
  const db = await getDatabase();

  return db.getFirstAsync(
    `SELECT
       workout_sessions.id,
       workout_sessions.workout_plan_id,
       workout_sessions.date,
       workout_sessions.status,
       workout_sessions.notes,
       workout_plans.name AS workout_plan_name
     FROM workout_sessions
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     ORDER BY datetime(workout_sessions.date) DESC, workout_sessions.id DESC
     LIMIT 1`
  );
}

export async function getWorkoutSessionCountSince(date) {
  const db = await getDatabase();

  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS workout_count
     FROM workout_sessions
     WHERE date >= ?`,
    [date]
  );

  return row?.workout_count ?? 0;
}

export async function getWorkoutSessionDates() {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       substr(date, 1, 10) AS workout_date,
       COUNT(*) AS session_count
     FROM workout_sessions
     GROUP BY substr(date, 1, 10)
     ORDER BY workout_date DESC`
  );
}

export async function getWorkoutSessionsByDate(date) {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       workout_sessions.id,
       workout_sessions.workout_plan_id,
       workout_sessions.date,
       workout_sessions.status,
       workout_sessions.notes,
       workout_plans.name AS workout_plan_name
     FROM workout_sessions
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     WHERE substr(workout_sessions.date, 1, 10) = ?
     ORDER BY datetime(workout_sessions.date) DESC, workout_sessions.id DESC`,
    [date]
  );
}

export async function getWorkoutSessionById(workoutSessionId) {
  const db = await getDatabase();

  return db.getFirstAsync(
    `SELECT
       workout_sessions.id,
       workout_sessions.workout_plan_id,
       workout_sessions.date,
       workout_sessions.status,
       workout_sessions.notes,
       workout_plans.name AS workout_plan_name
     FROM workout_sessions
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     WHERE workout_sessions.id = ?`,
    [workoutSessionId]
  );
}

export async function getWorkoutSetsBySessionId(workoutSessionId) {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       workout_sets.id,
       workout_sets.workout_session_id,
       workout_sets.exercise_id,
       workout_sets.set_number,
       workout_sets.weight_kg,
       workout_sets.reps,
       exercises.name AS exercise_name
     FROM workout_sets
     JOIN exercises ON exercises.id = workout_sets.exercise_id
     WHERE workout_sets.workout_session_id = ?
     ORDER BY exercises.order_index ASC, workout_sets.set_number ASC`,
    [workoutSessionId]
  );
}

export async function deleteWorkoutSession(workoutSessionId) {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [workoutSessionId]);
}
