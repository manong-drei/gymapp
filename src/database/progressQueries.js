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
       workout_sets.exercise_id,
       exercises.name AS exercise_name,
       workout_sets.set_number,
       workout_sets.weight_kg,
       workout_sets.reps,
       workout_sets.weight_kg * workout_sets.reps AS volume,
       workout_sessions.date,
       workout_plans.name AS workout_plan_name
     FROM workout_sets
     JOIN workout_sessions ON workout_sessions.id = workout_sets.workout_session_id
     JOIN workout_plans ON workout_plans.id = workout_sessions.workout_plan_id
     JOIN exercises ON exercises.id = workout_sets.exercise_id
     WHERE workout_sets.exercise_id = ?
     ORDER BY datetime(workout_sessions.date) DESC, workout_sets.set_number ASC`,
    [exerciseId]
  );
}

export async function getLastExercisePerformance(exerciseId, workoutPlanId) {
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
     JOIN workout_plans AS logged_plan ON logged_plan.id = workout_sessions.workout_plan_id
     JOIN exercises AS current_exercise ON current_exercise.id = ?
     JOIN workout_plans AS current_plan ON current_plan.id = ?
     JOIN exercises AS logged_exercise ON logged_exercise.id = workout_sets.exercise_id
     WHERE logged_exercise.name = current_exercise.name
       AND logged_plan.name = current_plan.name
       AND workout_sessions.status = 'Completed'
       AND workout_sessions.id = (
         SELECT latest_sessions.id
         FROM workout_sessions AS latest_sessions
         JOIN workout_plans AS latest_plan ON latest_plan.id = latest_sessions.workout_plan_id
         JOIN workout_sets AS latest_sets
           ON latest_sets.workout_session_id = latest_sessions.id
         JOIN exercises AS latest_exercise ON latest_exercise.id = latest_sets.exercise_id
         WHERE latest_exercise.name = current_exercise.name
           AND latest_plan.name = current_plan.name
           AND latest_sessions.status = 'Completed'
         ORDER BY datetime(latest_sessions.date) DESC, latest_sessions.id DESC
         LIMIT 1
       )
     ORDER BY workout_sets.set_number ASC`,
    [exerciseId, workoutPlanId]
  );
}
