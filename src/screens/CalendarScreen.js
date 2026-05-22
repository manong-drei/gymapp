import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router, useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import {
  getWorkoutSessionDates,
  getWorkoutSessionsByDate,
} from '../database/sessionQueries';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [workoutDates, setWorkoutDates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCalendar = useCallback(async (dateToLoad) => {
    try {
      setLoading(true);
      const [dateRows, sessionRows] = await Promise.all([
        getWorkoutSessionDates(),
        getWorkoutSessionsByDate(dateToLoad),
      ]);

      setWorkoutDates(dateRows);
      setSessions(sessionRows);
    } catch (error) {
      console.error('Failed to load workout calendar', error);
      Alert.alert('Error', 'Could not load workout calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCalendar(selectedDate);
    }, [loadCalendar, selectedDate])
  );

  const markedDates = useMemo(() => {
    const marked = {};

    for (const row of workoutDates) {
      marked[row.workout_date] = {
        marked: true,
        dotColor: '#7bd88f',
      };
    }

    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: palette.primary,
      selectedTextColor: '#ffffff',
    };

    return marked;
  }, [selectedDate, workoutDates]);

  function handleDayPress(day) {
    setSelectedDate(day.dateString);
  }

  function renderSession({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{item.workout_plan_name}</Text>
            <Text style={styles.time}>{formatTime(item.date)}</Text>
          </View>
          <Text style={styles.status}>{item.status}</Text>
        </View>

        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <Pressable
          style={styles.viewButton}
          onPress={() => router.push({ pathname: '/session-detail', params: { id: item.id } })}>
          <Text style={styles.viewButtonText}>View Sets</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>

      <Calendar
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          calendarBackground: palette.surface,
          dayTextColor: palette.text,
          monthTextColor: palette.text,
          textDisabledColor: '#525866',
          arrowColor: palette.text,
          todayTextColor: palette.success,
          selectedDayBackgroundColor: palette.primary,
          selectedDayTextColor: palette.text,
          textSectionTitleColor: palette.textMuted,
        }}
        style={styles.calendar}
      />

      <Text style={styles.sectionTitle}>Workouts on {selectedDate}</Text>

      {loading ? (
        <ActivityIndicator color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSession}
          contentContainerStyle={sessions.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No workouts logged for this date.</Text>
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
    marginBottom: 16,
  },
  calendar: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  status: {
    color: palette.success,
    fontSize: 13,
    fontWeight: '700',
  },
  notes: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  viewButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  viewButtonText: {
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
