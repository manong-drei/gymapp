import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import { getWorkoutSessionById, getWorkoutSetsBySessionId } from '../database/sessionQueries';
import { getNumericParam } from '../utils/routeParams';

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

function groupSetsByExercise(sets) {
  const groupsByKey = {};

  for (const set of sets) {
    const exerciseKey = String(set.exercise_id ?? set.exercise_name);

    if (!groupsByKey[exerciseKey]) {
      groupsByKey[exerciseKey] = {
        exerciseKey,
        exerciseName: set.exercise_name,
        sets: [],
      };
    }

    groupsByKey[exerciseKey].sets.push(set);
  }

  return Object.values(groupsByKey).map((group) => ({
    ...group,
    sets: group.sets.sort((first, second) => first.set_number - second.set_number),
  }));
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const sessionId = getNumericParam(id);
  const [session, setSession] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        if (!sessionId) {
          Alert.alert('Missing Workout', 'Could not find the workout session id.');
          router.back();
          return;
        }

        const [sessionRow, setRows] = await Promise.all([
          getWorkoutSessionById(sessionId),
          getWorkoutSetsBySessionId(sessionId),
        ]);

        if (!sessionRow) {
          Alert.alert('Not Found', 'Workout session was not found.');
          router.back();
          return;
        }

        setSession(sessionRow);
        setSets(setRows);
      } catch (error) {
        console.error('Failed to load workout session', error);
        Alert.alert('Error', 'Could not load workout session.');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  const groupedSets = groupSetsByExercise(sets);

  function renderExerciseGroup({ item }) {
    return (
      <View style={styles.setCard}>
        <Text style={styles.exerciseName}>{item.exerciseName}</Text>
        {item.sets.map((set) => (
          <Text key={set.id} style={styles.setLine}>
            Set {set.set_number}: {formatValue(set.weight_kg, ' kg')} x{' '}
            {formatValue(set.reps, ' reps')}
          </Text>
        ))}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session?.workout_plan_name}</Text>
      <Text style={styles.date}>{formatDateTime(session?.date)}</Text>
      {session?.notes ? <Text style={styles.notes}>{session.notes}</Text> : null}

      <Text style={styles.sectionTitle}>Sets</Text>

      <FlatList
        data={groupedSets}
        keyExtractor={(item) => item.exerciseKey}
        renderItem={renderExerciseGroup}
        contentContainerStyle={groupedSets.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No sets were saved.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.page,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: 'bold',
  },
  date: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  notes: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 112,
  },
  setCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exerciseName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  setLine: {
    color: palette.textSoft,
    fontSize: 14,
    marginTop: 6,
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
