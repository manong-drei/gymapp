import { getDatabase } from './database';

export async function getExerciseProgressSummary() {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       exercises.id AS exercise_id,
       exercises.name AS exercise_name,
       COUNT(workout_sets.id) AS total_sets,
       MAX(workout_sets.weight_kg) AS best_weight_kg,
       MAX(workout_sets.reps) AS best_reps,
       MAX(workout_sets.weight_kg * workout_sets.reps) AS best_volume,
       MAX(workout_sessions.date) AS last_trained_at
     FROM exercises
     JOIN workout_sets ON workout_sets.exercise_id = exercises.id
     JOIN workout_sessions ON workout_sessions.id = workout_sets.workout_session_id
     GROUP BY exercises.id, exercises.name
     ORDER BY datetime(last_trained_at) DESC, exercises.name ASC`
  );
}

export async function getExerciseProgressHistory(exerciseId) {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       workout_sets.id,
       workout_sets.set_number,
       workout_sets.weight_kg,
       workout_sets.reps,
       workout_sets.weight_kg * workout_sets.reps AS volume,
       workout_sessions.date,
       workout_plans.name AS workout_plan_name
     FROM workout_sets
     JOIN workout_sessions ON workout_sessions.id = workout_sets.workout_session_id
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     WHERE workout_sets.exercise_id = ?
     ORDER BY datetime(workout_sessions.date) DESC, workout_sets.set_number ASC`,
    [exerciseId]
  );
}

export async function getLastExercisePerformance(exerciseId) {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT
       workout_sets.id,
       workout_sets.set_number,
       workout_sets.weight_kg,
       workout_sets.reps,
       workout_sessions.date,
       workout_sessions.id AS workout_session_id
     FROM workout_sets
     JOIN workout_sessions ON workout_sessions.id = workout_sets.workout_session_id
     WHERE workout_sets.exercise_id = ?
       AND workout_sessions.status = 'Completed'
       AND workout_sessions.id = (
         SELECT latest_sessions.id
         FROM workout_sessions AS latest_sessions
         JOIN workout_sets AS latest_sets
           ON latest_sets.workout_session_id = latest_sessions.id
         WHERE latest_sets.exercise_id = ?
           AND latest_sessions.status = 'Completed'
         ORDER BY datetime(latest_sessions.date) DESC, latest_sessions.id DESC
         LIMIT 1
       )
     ORDER BY workout_sets.set_number ASC`,
    [exerciseId, exerciseId]
  );
}
