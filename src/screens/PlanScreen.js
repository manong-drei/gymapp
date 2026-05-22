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
import { router, useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import { deleteWorkoutPlan, getWorkoutPlans } from '../database/workoutQueries';

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString();
}

export default function PlanScreen() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadWorkoutPlans() {
    try {
      setLoading(true);
      const rows = await getWorkoutPlans();
      setPlans(rows);
    } catch (error) {
      console.error('Failed to load workout plans', error);
      Alert.alert('Error', 'Could not load workout plans.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadWorkoutPlans();
    }, [])
  );

  function confirmDelete(plan) {
    Alert.alert('Delete Workout Plan', `Delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkoutPlan(plan.id);
            await loadWorkoutPlans();
          } catch (error) {
            console.error('Failed to delete workout plan', error);
            Alert.alert('Error', 'Could not delete workout plan.');
          }
        },
      },
    ]);
  }

  function renderPlan({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
        <Text style={styles.date}>Created: {formatDate(item.created_at)}</Text>

        <Pressable
          style={styles.startButton}
          onPress={() => router.push({ pathname: '/start-workout', params: { planId: item.id } })}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>

        <View style={styles.cardActions}>
          <Pressable
            style={[styles.smallButton, styles.exerciseButton]}
            onPress={() =>
              router.push({ pathname: '/plan-exercises', params: { planId: item.id } })
            }>
            <Text style={styles.smallButtonText}>Exercises</Text>
          </Pressable>

          <Pressable
            style={[styles.smallButton, styles.editButton]}
            onPress={() => router.push({ pathname: '/edit-plan', params: { id: item.id } })}>
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

  function renderEmptyPlans() {
    return (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyTitle}>No workout plans yet</Text>
        <Text style={styles.emptyText}>
          Create your first plan, then add exercises and start tracking workouts.
        </Text>
        <Pressable style={styles.emptyActionButton} onPress={() => router.push('/add-plan')}>
          <Text style={styles.emptyActionText}>Create Plan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Plans</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/add-plan')}>
          <Text style={styles.addButtonText}>Add Workout Plan</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPlan}
          contentContainerStyle={plans.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={renderEmptyPlans}
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
  header: {
    gap: 16,
    marginBottom: 20,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
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
  description: {
    color: palette.textSoft,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  date: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  startButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  exerciseButton: {
    backgroundColor: palette.successMuted,
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
  emptyStateCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.card,
    alignItems: 'center',
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyActionButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 16,
  },
  emptyActionText: {
    color: palette.text,
    fontWeight: '800',
  },
});
