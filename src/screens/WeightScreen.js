import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import {
  deleteBodyWeightLog,
  getBodyWeightLogs,
  getLatestBodyWeightLog,
  saveBodyWeightLog,
} from '../database/weightQueries';
import { isPositiveDecimal } from '../utils/validation';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getChartLogs(logs) {
  return logs.slice(0, 7).reverse();
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function WeightScreen() {
  const [date, setDate] = useState(getTodayDate());
  const [weightKg, setWeightKg] = useState('');
  const [logs, setLogs] = useState([]);
  const [latestLog, setLatestLog] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadWeightLogs() {
    try {
      setLoading(true);
      const [rows, latest] = await Promise.all([getBodyWeightLogs(), getLatestBodyWeightLog()]);
      setLogs(rows);
      setLatestLog(latest);
    } catch (error) {
      console.error('Failed to load body weight logs', error);
      Alert.alert('Error', 'Could not load body weight logs.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadWeightLogs();
    }, [])
  );

  async function handleSave() {
    if (!isValidDate(date)) {
      Alert.alert('Invalid Date', 'Use YYYY-MM-DD format.');
      return;
    }

    if (!isPositiveDecimal(weightKg)) {
      Alert.alert('Invalid Weight', 'Body weight must be greater than 0 kg.');
      return;
    }

    try {
      setSaving(true);
      await saveBodyWeightLog(date, weightKg);
      setWeightKg('');
      await loadWeightLogs();
    } catch (error) {
      console.error('Failed to save body weight log', error);
      Alert.alert('Error', 'Could not save body weight log.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(log) {
    Alert.alert('Delete Weight Log', `Delete ${log.weight_kg} kg from ${log.date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBodyWeightLog(log.id);
            await loadWeightLogs();
          } catch (error) {
            console.error('Failed to delete body weight log', error);
            Alert.alert('Error', 'Could not delete body weight log.');
          }
        },
      },
    ]);
  }

  function useLogForEditing(log) {
    setDate(log.date);
    setWeightKg(String(log.weight_kg));
  }

  function renderLog({ item }) {
    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>{item.weight_kg} kg</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        <View style={styles.cardActions}>
          <Pressable style={[styles.smallButton, styles.editButton]} onPress={() => useLogForEditing(item)}>
            <Text style={styles.smallButtonText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.smallButton, styles.deleteButton]} onPress={() => confirmDelete(item)}>
            <Text style={styles.smallButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderWeightChart() {
    const chartLogs = getChartLogs(logs);

    if (chartLogs.length === 0) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weight Trend</Text>
          <Text style={styles.chartEmptyText}>Add weight logs to see your trend.</Text>
        </View>
      );
    }

    const weights = chartLogs.map((log) => log.weight_kg);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight || 1;

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weight Trend</Text>
          <Text style={styles.chartSubtitle}>Last {chartLogs.length} logs</Text>
        </View>

        <View style={styles.chartArea}>
          {chartLogs.map((log) => {
            const barHeight = 28 + ((log.weight_kg - minWeight) / weightRange) * 92;

            return (
              <View key={log.id} style={styles.chartItem}>
                <Text style={styles.chartWeight}>{log.weight_kg}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: barHeight }]} />
                </View>
                <Text style={styles.chartDate}>{formatShortDate(log.date)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <Text style={styles.title}>Body Weight</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Latest Weight</Text>
        <Text style={styles.summaryValue}>
          {latestLog ? `${latestLog.weight_kg} kg` : '-- kg'}
        </Text>
        <Text style={styles.summaryDate}>{latestLog ? latestLog.date : 'No logs yet'}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#777"
          style={styles.input}
        />

        <Text style={styles.label}>Weight</Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="70"
            placeholderTextColor="#777"
            keyboardType="decimal-pad"
            style={styles.unitInput}
          />
          <Text style={styles.unitText}>kg</Text>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Weight'}</Text>
        </Pressable>
      </View>

      {renderWeightChart()}

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>History</Text>
        <Pressable
          accessibilityLabel={historyVisible ? 'Hide weight history' : 'Manage weight history'}
          style={[styles.iconButton, historyVisible && styles.iconButtonActive]}
          onPress={() => setHistoryVisible((current) => !current)}>
          <MaterialIcons
            name={historyVisible ? 'keyboard-arrow-up' : 'manage-search'}
            size={22}
            color={palette.text}
          />
        </Pressable>
      </View>

      {historyVisible ? (
        loading ? (
          <ActivityIndicator color="#ffffff" style={styles.loader} />
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderLog}
            contentContainerStyle={logs.length === 0 ? styles.emptyContainer : styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No body weight logs yet.</Text>
            }
          />
        )
      ) : (
        <Text style={styles.collapsedHint}>Tap the icon to edit or delete weight logs.</Text>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.page,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: palette.text,
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 6,
  },
  summaryDate: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chartEmptyText: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  chartArea: {
    height: 170,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  chartItem: {
    flex: 1,
    alignItems: 'center',
  },
  chartWeight: {
    color: palette.textSoft,
    fontSize: 11,
    marginBottom: 6,
  },
  barTrack: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    backgroundColor: palette.primary,
    borderRadius: 6,
  },
  chartDate: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  label: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    color: '#fff',
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
  saveButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
  },
  collapsedHint: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  loader: {
    marginTop: 24,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  dateText: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: palette.surfaceRaised,
  },
  deleteButton: {
    backgroundColor: palette.dangerMuted,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
