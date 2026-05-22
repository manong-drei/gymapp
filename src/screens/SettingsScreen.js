import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import {
  clearAllAppData,
  exportAppData,
  importAppData,
} from '../database/dataManagementQueries';
import { getAppSettings, saveAppSettings } from '../database/settingsQueries';
import { isPositiveInteger } from '../utils/validation';

export default function SettingsScreen() {
  const [defaultRestSeconds, setDefaultRestSeconds] = useState('90');
  const [timerVibrationEnabled, setTimerVibrationEnabled] = useState(true);
  const [backupText, setBackupText] = useState('');
  const [importText, setImportText] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      const settings = await getAppSettings();
      setDefaultRestSeconds(settings.defaultRestSeconds);
      setTimerVibrationEnabled(settings.timerVibrationEnabled === 'true');
    } catch (error) {
      console.error('Failed to load settings', error);
      Alert.alert('Error', 'Could not load settings.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function handleSaveSettings() {
    if (!isPositiveInteger(defaultRestSeconds)) {
      Alert.alert('Invalid Rest Time', 'Default rest time must be a whole number of seconds greater than 0.');
      return;
    }

    try {
      setSaving(true);
      await saveAppSettings({
        defaultRestSeconds: String(Number(defaultRestSeconds)),
        timerVibrationEnabled: timerVibrationEnabled ? 'true' : 'false',
      });
      Alert.alert('Settings Saved', 'Your preferences were saved.');
    } catch (error) {
      console.error('Failed to save settings', error);
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    try {
      const json = await exportAppData();
      setBackupText(json);
    } catch (error) {
      console.error('Failed to export data', error);
      Alert.alert('Error', 'Could not export app data.');
    }
  }

  function confirmImport() {
    if (!importText.trim()) {
      Alert.alert('Missing Backup', 'Paste a backup JSON before importing.');
      return;
    }

    Alert.alert('Import Backup', 'This will replace all current app data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'destructive',
        onPress: async () => {
          try {
            await importAppData(importText);
            setImportText('');
            setBackupText('');
            await loadSettings();
            Alert.alert('Import Complete', 'Backup data was imported.');
          } catch (error) {
            console.error('Failed to import data', error);
            Alert.alert('Import Failed', 'The backup text is invalid or could not be imported.');
          }
        },
      },
    ]);
  }

  function confirmClearAllData() {
    Alert.alert('Clear All Data', 'This permanently deletes workouts, plans, weight logs, and settings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllAppData();
            setBackupText('');
            setImportText('');
            await loadSettings();
            Alert.alert('Data Cleared', 'All local app data was deleted.');
          } catch (error) {
            console.error('Failed to clear data', error);
            Alert.alert('Error', 'Could not clear app data.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage preferences and local offline data.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workout Timer</Text>

        <Text style={styles.label}>Default Rest Time</Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            value={defaultRestSeconds}
            onChangeText={setDefaultRestSeconds}
            placeholder="90"
            placeholderTextColor="#777"
            keyboardType="numeric"
            style={styles.unitInput}
          />
          <Text style={styles.unitText}>sec</Text>
        </View>

        <Pressable
          style={styles.toggleRow}
          onPress={() => setTimerVibrationEnabled((current) => !current)}>
          <View>
            <Text style={styles.toggleTitle}>Timer Vibration</Text>
            <Text style={styles.toggleHint}>Vibrate when the rest timer ends.</Text>
          </View>
          <View style={[styles.toggle, timerVibrationEnabled && styles.toggleEnabled]}>
            <Text style={styles.toggleText}>{timerVibrationEnabled ? 'On' : 'Off'}</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={handleSaveSettings}
          disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export Backup</Text>
        <Text style={styles.helperText}>
          Generate a JSON backup. Keep this text somewhere safe before clearing or moving devices.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={handleExport}>
          <Text style={styles.buttonText}>Generate Backup</Text>
        </Pressable>
        {backupText ? (
          <TextInput
            value={backupText}
            editable={false}
            multiline
            style={styles.backupBox}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Import Backup</Text>
        <Text style={styles.helperText}>
          Paste a SoloFit backup JSON here. Importing replaces all current local data.
        </Text>
        <TextInput
          value={importText}
          onChangeText={setImportText}
          placeholder="Paste backup JSON"
          placeholderTextColor="#777"
          multiline
          style={styles.importBox}
        />
        <Pressable style={styles.secondaryButton} onPress={confirmImport}>
          <Text style={styles.buttonText}>Import Backup</Text>
        </Pressable>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.cardTitle}>Danger Zone</Text>
        <Text style={styles.helperText}>
          Clear all local data from this device. Export a backup first if you want to keep it.
        </Text>
        <Pressable style={styles.dangerButton} onPress={confirmClearAllData}>
          <Text style={styles.buttonText}>Clear All Data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: spacing.page,
    paddingBottom: 40,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.card,
    marginBottom: 14,
  },
  dangerCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.dangerMuted,
    padding: spacing.card,
    marginBottom: 14,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  label: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWithUnit: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  unitInput: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unitText: {
    color: palette.textMuted,
    fontSize: 16,
    fontWeight: '700',
    paddingRight: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  toggleTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleHint: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  toggle: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.sm,
    minWidth: 56,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleEnabled: {
    backgroundColor: palette.successMuted,
  },
  toggleText: {
    color: palette.text,
    fontWeight: '800',
  },
  helperText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: palette.dangerMuted,
    borderColor: palette.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: palette.text,
    fontWeight: '800',
  },
  backupBox: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: palette.textSoft,
    fontSize: 12,
    minHeight: 160,
    marginTop: 14,
    padding: 12,
    textAlignVertical: 'top',
  },
  importBox: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: palette.text,
    fontSize: 12,
    minHeight: 140,
    marginBottom: 14,
    padding: 12,
    textAlignVertical: 'top',
  },
});
