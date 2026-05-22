import { useCallback, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, spacing } from '../constants/design';
import { deleteExercise, getExercisesByWorkoutPlanId } from '../database/exerciseQueries';
import { getWorkoutPlanById } from '../database/workoutQueries';
import { getNumericParam } from '../utils/routeParams';

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {value}
      </Text>
    </View>
  );
}

export default function PlanExercisesScreen() {
  const { planId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const workoutPlanId = getNumericParam(planId);
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExercises = useCallback(async () => {
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
  }, [workoutPlanId]);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
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

        <View style={styles.statsRow}>
          <StatPill label="Sets" value={formatValue(item.target_sets)} />
          <StatPill label="Reps" value={formatValue(item.target_reps)} />
          <StatPill label="Weight" value={formatValue(item.target_weight, 'kg')} />
          <StatPill label="Rest" value={formatValue(item.rest_seconds, 's')} />
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

      <Pressable
        style={[styles.addButton, { bottom: Math.max(insets.bottom, 16) }]}
        onPress={() =>
          router.push({ pathname: '/add-exercise', params: { planId: workoutPlanId } })
        }>
        <MaterialIcons name="add" color="#fff" size={22} />
        <Text style={styles.addButtonText}>Add Exercise</Text>
      </Pressable>
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
    gap: 8,
    marginBottom: 18,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 96,
    gap: 12,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 7,
    minWidth: 0,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  smallButton: {
    minWidth: 82,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: palette.surfaceRaised,
  },
  deleteButton: {
    backgroundColor: palette.dangerMuted,
  },
  smallButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
