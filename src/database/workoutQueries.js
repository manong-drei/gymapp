import { getDatabase } from './database';

export async function createWorkoutPlan(name, description = '') {
  const db = await getDatabase();
  const now = new Date().toISOString();

  return db.runAsync(
    `INSERT INTO workout_plans (name, description, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [name.trim(), description.trim(), now, now]
  );
}

export async function getWorkoutPlans() {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT id, name, description, created_at, updated_at
     FROM workout_plans
     ORDER BY datetime(created_at) DESC, id DESC`
  );
}

export async function getWorkoutPlanCount() {
  const db = await getDatabase();

  const row = await db.getFirstAsync('SELECT COUNT(*) AS plan_count FROM workout_plans');
  return row?.plan_count ?? 0;
}

export async function getWorkoutPlanById(id) {
  const db = await getDatabase();

  return db.getFirstAsync(
    `SELECT id, name, description, created_at, updated_at
     FROM workout_plans
     WHERE id = ?`,
    [id]
  );
}

export async function updateWorkoutPlan(id, name, description = '') {
  const db = await getDatabase();
  const now = new Date().toISOString();

  return db.runAsync(
    `UPDATE workout_plans
     SET name = ?, description = ?, updated_at = ?
     WHERE id = ?`,
    [name.trim(), description.trim(), now, id]
  );
}

export async function deleteWorkoutPlan(id) {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM workout_plans WHERE id = ?', [id]);
}
