import { getDatabase } from './database';

export async function saveBodyWeightLog(date, weightKg) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO body_weight_logs (date, weight_kg)
     VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg`,
    [date, Number(weightKg)]
  );
}

export async function getBodyWeightLogs() {
  const db = await getDatabase();

  return db.getAllAsync(
    `SELECT id, date, weight_kg
     FROM body_weight_logs
     ORDER BY date DESC`
  );
}

export async function getLatestBodyWeightLog() {
  const db = await getDatabase();

  return db.getFirstAsync(
    `SELECT id, date, weight_kg
     FROM body_weight_logs
     ORDER BY date DESC
     LIMIT 1`
  );
}

export async function deleteBodyWeightLog(id) {
  const db = await getDatabase();

  return db.runAsync('DELETE FROM body_weight_logs WHERE id = ?', [id]);
}
