import { getDatabase } from './database';

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

export async function createExercise(
  workoutPlanId,
  name,
  targetSets,
  targetReps,
  targetWeight,
  restSeconds
) {
  const db = await getDatabase();
  const orderRow = await db.getFirstAsync(
    'SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM exercises WHERE workout_plan_id = ?',
    [workoutPlanId]
  );

  return db.runAsync(
    `INSERT INTO exercises (
       workout_plan_id,
       name,
       target_sets,
       target_reps,
       target_weight,
       rest_seconds,
       order_index
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      workoutPlanId,
      name.trim(),
      toNumberOrNull(targetSets),
      targetReps.trim(),
      toNumberOrNull(targetWeight),
      toNumberOrNull(restSeconds),
      orderRow?.next_order ?? 1,
    ]
  );
}

export async function getExercisesByWorkoutPlanId(workoutPlanId) {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT id, workout_plan_id, name, target_sets, target_reps, target_weight, rest_seconds, order_index
     FROM exercises
     WHERE workout_plan_id = ?
     ORDER BY order_index ASC, id ASC`,
    [workoutPlanId]
  );
}

export async function getExerciseCountByWorkoutPlanId(workoutPlanId) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS exercise_count FROM exercises WHERE workout_plan_id = ?',
    [workoutPlanId]
  );

  return row?.exercise_count ?? 0;
}

export async function getExerciseById(id) {
  const db = await getDatabase();

  return db.getFirstAsync(
    `SELECT id, workout_plan_id, name, target_sets, target_reps, target_weight, rest_seconds, order_index
     FROM exercises
     WHERE id = ?`,
    [id]
  );
}

export async function updateExercise(id, name, targetSets, targetReps, targetWeight, restSeconds) {
  const db = await getDatabase();

  return db.runAsync(
    `UPDATE exercises
     SET name = ?,
         target_sets = ?,
         target_reps = ?,
         target_weight = ?,
         rest_seconds = ?
     WHERE id = ?`,
    [
      name.trim(),
      toNumberOrNull(targetSets),
      targetReps.trim(),
      toNumberOrNull(targetWeight),
      toNumberOrNull(restSeconds),
      id,
    ]
  );
}

export async function deleteExercise(id) {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}
