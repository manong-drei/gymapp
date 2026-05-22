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
import { deleteWorkoutSession, getWorkoutSessions } from '../database/sessionQueries';

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

export default function ProgressScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    try {
      setLoading(true);
      const rows = await getWorkoutSessions();
      setSessions(rows);
    } catch (error) {
      console.error('Failed to load workout history', error);
      Alert.alert('Error', 'Could not load workout history.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  function confirmDelete(session) {
    Alert.alert('Delete Workout', `Delete "${session.workout_plan_name}" from history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkoutSession(session.id);
            await loadSessions();
          } catch (error) {
            console.error('Failed to delete workout session', error);
            Alert.alert('Error', 'Could not delete workout session.');
          }
        },
      },
    ]);
  }

  function renderSession({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.workout_plan_name}</Text>
        <Text style={styles.date}>{formatDateTime(item.date)}</Text>
        <Text style={styles.status}>{item.status}</Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <View style={styles.cardActions}>
          <Pressable
            style={[styles.smallButton, styles.viewButton]}
            onPress={() => router.push({ pathname: '/session-detail', params: { id: item.id } })}>
            <Text style={styles.smallButtonText}>View Sets</Text>
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

  function renderEmptyHistory() {
    return (
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyTitle}>No completed workouts yet</Text>
        <Text style={styles.emptyText}>
          Start and finish a workout from Plans to build your history.
        </Text>
        <Pressable style={styles.emptyActionButton} onPress={() => router.push('/plan')}>
          <Text style={styles.emptyActionText}>Go to Plans</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.quickActions}>
        <Pressable style={styles.quickButton} onPress={() => router.push('/progress-tracking')}>
          <Text style={styles.quickButtonText}>Lifts</Text>
        </Pressable>

        <Pressable style={styles.quickButton} onPress={() => router.push('/calendar')}>
          <Text style={styles.quickButtonText}>Calendar</Text>
        </Pressable>

        <Pressable style={styles.quickButton} onPress={() => router.push('/weight')}>
          <Text style={styles.quickButtonText}>Weight</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Workout History</Text>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSession}
          contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={renderEmptyHistory}
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
    marginBottom: 14,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  quickButton: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
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
  date: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  status: {
    color: palette.success,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  notes: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
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
  viewButton: {
    backgroundColor: palette.primary,
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
