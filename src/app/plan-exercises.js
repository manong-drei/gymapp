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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { deleteExercise, getExercisesByWorkoutPlanId } from '../database/exerciseQueries';
import { getWorkoutPlanById } from '../database/workoutQueries';
import { getNumericParam } from '../utils/routeParams';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

export default function PlanExercisesScreen() {
  const { planId } = useLocalSearchParams();
  const workoutPlanId = getNumericParam(planId);
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadExercises() {
    try {
      if (!workoutPlanId) {
        Alert.alert('Missing Plan', 'Could not find the workout plan id.');
        router.back();
        return;
      }

      setLoading(true);
      const [planRow, exerciseRows] = await Promise.all([
        getWorkoutPlanById(workoutPlanId),
        getExercisesByWorkoutPlanId(workoutPlanId),
      ]);

      setPlan(planRow);
      setExercises(exerciseRows);
    } catch (error) {
      console.error('Failed to load exercises', error);
      Alert.alert('Error', 'Could not load exercises.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [workoutPlanId])
  );

  function confirmDelete(exercise) {
    Alert.alert('Delete Exercise', `Delete "${exercise.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExercise(exercise.id);
            await loadExercises();
          } catch (error) {
            console.error('Failed to delete exercise', error);
            Alert.alert('Error', 'Could not delete exercise.');
          }
        },
      },
    ]);
  }

  function renderExercise({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.name}</Text>

        <View style={styles.statsGrid}>
          <Text style={styles.statText}>Sets: {formatValue(item.target_sets)}</Text>
          <Text style={styles.statText}>Reps: {formatValue(item.target_reps)}</Text>
          <Text style={styles.statText}>Weight: {formatValue(item.target_weight, ' kg')}</Text>
          <Text style={styles.statText}>Rest: {formatValue(item.rest_seconds, ' sec')}</Text>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            style={[styles.smallButton, styles.editButton]}
            onPress={() =>
              router.push({
                pathname: '/edit-exercise',
                params: { id: item.id, planId: workoutPlanId },
              })
            }>
            <Text style={styles.smallButtonText}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.smallButton, styles.deleteButton]}
            onPress={() => confirmDelete(item)}>
            <Text style={styles.smallButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{plan?.name || 'Exercises'}</Text>
        <Text style={styles.subtitle}>Manage exercises for this workout plan.</Text>

        <Pressable
          style={styles.addButton}
          onPress={() =>
            router.push({ pathname: '/add-exercise', params: { planId: workoutPlanId } })
          }>
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderExercise}
          contentContainerStyle={
            exercises.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No exercises yet. Add your first exercise.</Text>
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
  header: {
    gap: 10,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#2f80ed',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
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
  statsGrid: {
    gap: 6,
    marginTop: 12,
  },
  statText: {
    color: '#ccc',
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#333',
  },
  deleteButton: {
    backgroundColor: '#8a2424',
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
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
