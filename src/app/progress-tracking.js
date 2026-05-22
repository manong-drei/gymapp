import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import {
  getExerciseProgressHistory,
  getExerciseProgressSummary,
} from '../database/progressQueries';
import { palette, radius, spacing } from '../constants/design';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString();
}

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

function getBestSet(sets) {
  return sets.reduce((bestSet, set) => {
    if (!bestSet) {
      return set;
    }

    const setWeight = Number(set.weight_kg ?? 0);
    const bestWeight = Number(bestSet.weight_kg ?? 0);
    const setReps = Number(set.reps ?? 0);
    const bestReps = Number(bestSet.reps ?? 0);

    if (setWeight > bestWeight || (setWeight === bestWeight && setReps > bestReps)) {
      return set;
    }

    return bestSet;
  }, null);
}

function groupSetsByExercise(records, fallbackExercise) {
  const groupsByKey = {};

  for (const record of records) {
    const exerciseKey = String(record.exercise_id ?? fallbackExercise.exercise_id);

    if (!groupsByKey[exerciseKey]) {
      groupsByKey[exerciseKey] = {
        exerciseKey,
        exerciseName: record.exercise_name ?? fallbackExercise.exercise_name,
        sets: [],
      };
    }

    groupsByKey[exerciseKey].sets.push(record);
  }

  return Object.values(groupsByKey).map((group) => ({
    ...group,
    sets: group.sets.sort((first, second) => first.set_number - second.set_number),
    bestSet: getBestSet(group.sets),
  }));
}

export default function ProgressTrackingScreen() {
  const [summaries, setSummaries] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState({});
  const [historyByExercise, setHistoryByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadProgress() {
    try {
      setLoading(true);
      const rows = await getExerciseProgressSummary();
      setSummaries(rows);
    } catch (error) {
      console.error('Failed to load progress', error);
      Alert.alert('Error', 'Could not load progress tracking.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  async function toggleExercise(exerciseId) {
    setExpandedExercises((current) => ({
      ...current,
      [exerciseId]: !current[exerciseId],
    }));

    if (historyByExercise[exerciseId]) {
      return;
    }

    try {
      setHistoryLoading(true);
      const rows = await getExerciseProgressHistory(exerciseId);
      setHistoryByExercise((current) => ({ ...current, [exerciseId]: rows }));
    } catch (error) {
      console.error('Failed to load exercise progress history', error);
      Alert.alert('Error', 'Could not load exercise history.');
    } finally {
      setHistoryLoading(false);
    }
  }

  function renderSetLine(item) {
    return (
      <Text key={item.id} style={styles.setLine}>
        {formatDate(item.date)} -{' '}
          Set {item.set_number}: {formatValue(item.weight_kg, ' kg')} x{' '}
          {formatValue(item.reps, ' reps')}
      </Text>
    );
  }

  function renderSummary({ item }) {
    const isExpanded = Boolean(expandedExercises[item.exercise_id]);
    const history = historyByExercise[item.exercise_id] || [];
    const groupedHistory = groupSetsByExercise(history, item);
    const bestText = `Best: ${formatValue(item.best_weight_kg, 'kg')} x ${formatValue(
      item.best_reps,
      ' reps'
    )}`;

    return (
      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => toggleExercise(item.exercise_id)}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{item.exercise_name}</Text>
            <Text style={styles.summaryText}>
              {formatValue(item.total_sets)} sets - {bestText}
            </Text>
            <Text style={styles.lastTrained}>Last trained: {formatDate(item.last_trained_at)}</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '^' : 'v'}</Text>
        </Pressable>

        {isExpanded ? (
          <View style={styles.historyContainer}>
            {historyLoading && history.length === 0 ? (
              <ActivityIndicator color="#ffffff" />
            ) : history.length === 0 ? (
              <Text style={styles.setLine}>No set history found.</Text>
            ) : (
              groupedHistory.map((group) => (
                <View key={group.exerciseKey} style={styles.setGroup}>
                  {group.sets.map(renderSetLine)}
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Tracking</Text>
      <Text style={styles.subtitle}>Track best lifts and recent set history per exercise.</Text>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={summaries}
          keyExtractor={(item) => String(item.exercise_id)}
          renderItem={renderSummary}
          contentContainerStyle={summaries.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No progress yet. Finish workouts with saved sets to see progress here.
            </Text>
          }
        />
      )}
    </View>
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
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 12,
    paddingBottom: 112,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryText: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  lastTrained: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  expandIcon: {
    color: palette.textMuted,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  historyContainer: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  setGroup: {
    gap: 6,
  },
  setLine: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
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
