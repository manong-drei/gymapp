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

export default function ProgressTrackingScreen() {
  const [summaries, setSummaries] = useState([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
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
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
      return;
    }

    setExpandedExerciseId(exerciseId);

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

  function renderHistoryRow(item) {
    return (
      <View key={item.id} style={styles.historyRow}>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
        <Text style={styles.historyText}>
          Set {item.set_number}: {formatValue(item.weight_kg, ' kg')} x{' '}
          {formatValue(item.reps, ' reps')}
        </Text>
        <Text style={styles.historyVolume}>Volume: {formatValue(item.volume, ' kg')}</Text>
      </View>
    );
  }

  function renderSummary({ item }) {
    const isExpanded = expandedExerciseId === item.exercise_id;
    const history = historyByExercise[item.exercise_id] || [];

    return (
      <View style={styles.card}>
        <Pressable onPress={() => toggleExercise(item.exercise_id)}>
          <Text style={styles.cardTitle}>{item.exercise_name}</Text>
          <Text style={styles.lastTrained}>Last trained: {formatDate(item.last_trained_at)}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Best Weight</Text>
              <Text style={styles.statValue}>{formatValue(item.best_weight_kg, ' kg')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Best Reps</Text>
              <Text style={styles.statValue}>{formatValue(item.best_reps)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Best Volume</Text>
              <Text style={styles.statValue}>{formatValue(item.best_volume, ' kg')}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Sets</Text>
              <Text style={styles.statValue}>{formatValue(item.total_sets)}</Text>
            </View>
          </View>

          <Text style={styles.expandText}>{isExpanded ? 'Hide History' : 'Show History'}</Text>
        </Pressable>

        {isExpanded ? (
          <View style={styles.historyContainer}>
            {historyLoading && history.length === 0 ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              history.slice(0, 10).map(renderHistoryRow)
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
    backgroundColor: '#111',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1d1d1d',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  lastTrained: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    width: '47%',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  expandText: {
    color: '#7bd88f',
    fontWeight: '700',
    marginTop: 14,
  },
  historyContainer: {
    borderTopColor: '#333',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    gap: 10,
  },
  historyRow: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
  },
  historyDate: {
    color: '#aaa',
    fontSize: 12,
  },
  historyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  historyVolume: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 4,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
