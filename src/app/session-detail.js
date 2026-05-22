import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

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

  function renderSet({ item }) {
    return (
      <View style={styles.setCard}>
        <Text style={styles.exerciseName}>{item.exercise_name}</Text>
        <Text style={styles.setLine}>
          Set {item.set_number}: {formatValue(item.weight_kg, ' kg')} x{' '}
          {formatValue(item.reps, ' reps')}
        </Text>
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
        data={sets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSet}
        contentContainerStyle={sets.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No sets were saved.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  date: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
  },
  notes: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
  },
  setCard: {
    backgroundColor: '#1d1d1d',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  setLine: {
    color: '#ccc',
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
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
