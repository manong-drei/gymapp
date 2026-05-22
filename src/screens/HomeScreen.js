import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import {
  getLatestWorkoutSession,
  getWorkoutSessionCountSince,
} from '../database/sessionQueries';
import { getLatestBodyWeightLog } from '../database/weightQueries';
import { getWorkoutPlanCount } from '../database/workoutQueries';

function getSevenDaysAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString();
}

export default function HomeScreen() {
  const [latestWorkout, setLatestWorkout] = useState(null);
  const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(0);
  const [latestWeight, setLatestWeight] = useState(null);
  const [planCount, setPlanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [latestWorkoutRow, weeklyCount, latestWeightRow, planCountValue] =
        await Promise.all([
          getLatestWorkoutSession(),
          getWorkoutSessionCountSince(getSevenDaysAgoIso()),
          getLatestBodyWeightLog(),
          getWorkoutPlanCount(),
        ]);

      setLatestWorkout(latestWorkoutRow);
      setWeeklyWorkoutCount(weeklyCount);
      setLatestWeight(latestWeightRow);
      setPlanCount(planCountValue);
    } catch (error) {
      console.error('Failed to load dashboard', error);
      Alert.alert('Error', 'Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>SoloFit</Text>
      <Text style={styles.subtitle}>Offline workout tracker</Text>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.cardLabel}>Last Workout</Text>
            <Text style={styles.heroTitle}>
              {latestWorkout ? latestWorkout.workout_plan_name : 'No workouts yet'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {latestWorkout
                ? `${formatDate(latestWorkout.date)} • ${latestWorkout.status}`
                : 'Start a workout from your Plans tab.'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.cardLabel}>This Week</Text>
              <Text style={styles.statValue}>{weeklyWorkoutCount}</Text>
              <Text style={styles.statHint}>workouts</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.cardLabel}>Plans</Text>
              <Text style={styles.statValue}>{planCount}</Text>
              <Text style={styles.statHint}>saved</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.cardLabel}>Latest Body Weight</Text>
            <Text style={styles.heroTitle}>
              {latestWeight ? `${latestWeight.weight_kg} kg` : '-- kg'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {latestWeight ? latestWeight.date : 'No body weight logs yet.'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <Pressable style={styles.actionButton} onPress={() => router.push('/plan')}>
              <Text style={styles.actionText}>Plans</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => router.push('/add-plan')}>
              <Text style={styles.actionText}>Add Plan</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => router.push('/progress')}>
              <Text style={styles.actionText}>History</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => router.push('/weight')}>
              <Text style={styles.actionText}>Weight</Text>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => router.push('/calendar')}>
              <Text style={styles.actionText}>Calendar</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/progress-tracking')}>
              <Text style={styles.actionText}>Progress</Text>
            </Pressable>
          </View>
        </>
      )}
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
  appName: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  heroCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
  },
  cardLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: {
    color: palette.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statHint: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: palette.primaryMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.primary,
    paddingVertical: 14,
    alignItems: 'center',
    width: '48%',
  },
  actionText: {
    color: palette.text,
    fontWeight: '700',
  },
});
