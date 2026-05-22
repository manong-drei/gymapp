import { getDatabase } from './database';

const DEFAULT_SETTINGS = {
  defaultRestSeconds: '90',
  timerVibrationEnabled: 'true',
};

export async function getAppSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT key, value FROM app_settings');
  const savedSettings = {};

  for (const row of rows) {
    savedSettings[row.key] = row.value;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...savedSettings,
  };
}

export async function setAppSetting(key, value) {
  const db = await getDatabase();

  return db.runAsync(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value)]
  );
}

export async function saveAppSettings(settings) {
  await Promise.all(
    Object.entries(settings).map(([key, value]) => setAppSetting(key, value))
  );
}
