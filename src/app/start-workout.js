import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import { getExercisesByWorkoutPlanId } from '../database/exerciseQueries';
import { getLastExercisePerformance } from '../database/progressQueries';
import { getAppSettings } from '../database/settingsQueries';
import { createCompletedWorkoutSession } from '../database/sessionQueries';
import { getWorkoutPlanById } from '../database/workoutQueries';
import { getNumericParam } from '../utils/routeParams';
import {
  isPositiveDecimal,
  isPositiveDecimalOrBlank,
  isPositiveInteger,
  isPositiveIntegerOrBlank,
} from '../utils/validation';

function buildInitialSets(exercises) {
  const nextSets = {};

  for (const exercise of exercises) {
    const setCount = exercise.target_sets && exercise.target_sets > 0 ? exercise.target_sets : 1;
    nextSets[exercise.id] = Array.from({ length: setCount }, (_, index) => ({
      setNumber: index + 1,
      weightKg: exercise.target_weight ? String(exercise.target_weight) : '',
      reps: '',
      completed: false,
    }));
  }

  return nextSets;
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatSetValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${value}${suffix}`;
}

function hasRecordedSetValue(set) {
  return String(set.weightKg ?? '').trim() !== '' || String(set.reps ?? '').trim() !== '';
}

function isRecordedSetValid(set) {
  return isPositiveDecimal(set.weightKg) && isPositiveInteger(set.reps);
}

function getExerciseKey(exercise) {
  return String(exercise.id ?? exercise.name);
}

function getBestSet(sets) {
  return sets.filter(isRecordedSetValid).reduce((bestSet, set) => {
    if (!bestSet) {
      return set;
    }

    const setWeight = Number(set.weightKg);
    const bestWeight = Number(bestSet.weightKg);
    const setReps = Number(set.reps);
    const bestReps = Number(bestSet.reps);

    if (setWeight > bestWeight || (setWeight === bestWeight && setReps > bestReps)) {
      return set;
    }

    return bestSet;
  }, null);
}

function isExerciseCompleted(sets) {
  return sets.length > 0 && sets.every((set) => set.completed);
}

export default function StartWorkoutScreen() {
  const { planId } = useLocalSearchParams();
  const navigation = useNavigation();
  const workoutPlanId = getNumericParam(planId);
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [collapsedExercises, setCollapsedExercises] = useState({});
  const [previousSetsByExercise, setPreviousSetsByExercise] = useState({});
  const [notes, setNotes] = useState('');
  const [restSeconds, setRestSeconds] = useState('90');
  const [timerVibrationEnabled, setTimerVibrationEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const allowExitRef = useRef(false);
  const hasUnsavedInputRef = useRef(false);
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

    async function loadWorkout() {
      try {
        if (!workoutPlanId) {
          Alert.alert('Missing Plan', 'Could not find the workout plan id.');
          router.back();
          return;
        }

        allowExitRef.current = false;
        hasUnsavedInputRef.current = false;
        savingRef.current = false;
        setLoading(true);
        setSaving(false);
        setTimerRunning(false);
        setTimerSeconds(0);
        setNotes('');
        setPlan(null);
        setExercises([]);
        setSetsByExercise({});
        setCollapsedExercises({});
        setPreviousSetsByExercise({});

        const [planRow, exerciseRows, appSettings] = await Promise.all([
          getWorkoutPlanById(workoutPlanId),
          getExercisesByWorkoutPlanId(workoutPlanId),
          getAppSettings(),
        ]);

        if (exerciseRows.length === 0) {
          Alert.alert(
            'No Exercises',
            'Add at least one exercise to this workout plan before starting.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        if (!isActive) {
          return;
        }

        setPlan(planRow);
        setExercises(exerciseRows);
        setSetsByExercise(buildInitialSets(exerciseRows));

        const previousPerformanceEntries = await Promise.all(
          exerciseRows.map(async (exercise) => {
            const previousSets = await getLastExercisePerformance(exercise.id, workoutPlanId);
            return [exercise.id, previousSets];
          })
        );

        setPreviousSetsByExercise(Object.fromEntries(previousPerformanceEntries));

        const firstRestTime = exerciseRows.find((exercise) => exercise.rest_seconds)?.rest_seconds;
        if (firstRestTime) {
          setRestSeconds(String(firstRestTime));
        } else {
          setRestSeconds(appSettings.defaultRestSeconds);
        }
        setTimerVibrationEnabled(appSettings.timerVibrationEnabled === 'true');
      } catch (error) {
        console.error('Failed to load workout', error);
        Alert.alert('Error', 'Could not load workout.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadWorkout();

      return () => {
        isActive = false;
      };
    }, [workoutPlanId])
  );

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimerSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setTimerRunning(false);
          if (timerVibrationEnabled) {
            Vibration.vibrate([0, 400, 150, 400]);
          }
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerRunning, timerSeconds, timerVibrationEnabled]);

  const setRecords = useMemo(() => {
    return exercises.flatMap((exercise) =>
      (setsByExercise[exercise.id] || []).map((set) => ({
        exerciseId: exercise.id,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
      }))
    );
  }, [exercises, setsByExercise]);

  useEffect(() => {
    hasUnsavedInputRef.current =
      notes.trim() !== '' ||
      Object.values(setsByExercise).some((sets) =>
        sets.some((set) => set.reps.trim() !== '' || set.completed)
      );
  }, [notes, setsByExercise]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowExitRef.current || !hasUnsavedInputRef.current) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        'Discard Workout?',
        'You have unsaved workout entries. Leave this screen and discard them?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowExitRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (allowExitRef.current || !hasUnsavedInputRef.current) {
        return false;
      }

      Alert.alert(
        'Discard Workout?',
        'You have unsaved workout entries. Leave this screen and discard them?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowExitRef.current = true;
              router.back();
            },
          },
        ]
      );

      return true;
    });

    return () => subscription.remove();
  }, []);

  function updateSetValue(exerciseId, setIndex, field, value) {
    setSetsByExercise((current) => {
      const currentSets = current[exerciseId] || [];
      const nextSets = currentSets.map((set, index) => {
        if (index !== setIndex) {
          return set;
        }

        return { ...set, [field]: value };
      });

      return { ...current, [exerciseId]: nextSets };
    });
  }

  function startRestTimer() {
    const seconds = Number(restSeconds);

    if (!isPositiveInteger(restSeconds)) {
      Alert.alert('Invalid Timer', 'Rest time must be a whole number of seconds greater than 0.');
      return;
    }

    setTimerSeconds(seconds);
    setTimerRunning(true);
  }

  function stopRestTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  function completeSet(exerciseId, setIndex) {
    const currentSet = setsByExercise[exerciseId]?.[setIndex];

    if (!currentSet) {
      return;
    }

    if (!isPositiveDecimalOrBlank(currentSet.weightKg)) {
      Alert.alert('Invalid Weight', 'Weight must be greater than 0 kg.');
      return;
    }

    if (!isPositiveIntegerOrBlank(currentSet.reps)) {
      Alert.alert('Invalid Reps', 'Reps must be a whole number greater than 0.');
      return;
    }

    setSetsByExercise((current) => {
      const currentSets = current[exerciseId] || [];
      const nextSets = currentSets.map((set, index) =>
        index === setIndex ? { ...set, completed: true } : set
      );

      if (isExerciseCompleted(nextSets)) {
        setCollapsedExercises((currentCollapsed) => ({
          ...currentCollapsed,
          [String(exerciseId)]: true,
        }));
      }

      return { ...current, [exerciseId]: nextSets };
    });
    startRestTimer();
  }

  function addSet(exerciseId) {
    setSetsByExercise((current) => {
      const currentSets = current[exerciseId] || [];
      const lastSet = currentSets[currentSets.length - 1];
      const nextSet = {
        setNumber: currentSets.length + 1,
        weightKg: lastSet?.weightKg || '',
        reps: '',
        completed: false,
      };

      return { ...current, [exerciseId]: [...currentSets, nextSet] };
    });
  }

  function removeSet(exerciseId, setIndex) {
    setSetsByExercise((current) => {
      const currentSets = current[exerciseId] || [];

      if (currentSets.length <= 1) {
        return current;
      }

      const nextSets = currentSets
        .filter((_, index) => index !== setIndex)
        .map((set, index) => ({ ...set, setNumber: index + 1 }));

      return { ...current, [exerciseId]: nextSets };
    });
  }

  function markRecordedSetsCompleted() {
    setSetsByExercise((current) => {
      const nextSetsByExercise = {};
      const nextCollapsedExercises = {};

      for (const [exerciseId, sets] of Object.entries(current)) {
        nextSetsByExercise[exerciseId] = sets.map((set) =>
          hasRecordedSetValue(set) ? { ...set, completed: true } : set
        );

        if (isExerciseCompleted(nextSetsByExercise[exerciseId])) {
          nextCollapsedExercises[exerciseId] = true;
        }
      }

      setCollapsedExercises((currentCollapsed) => ({
        ...currentCollapsed,
        ...nextCollapsedExercises,
      }));

      return nextSetsByExercise;
    });
  }

  function toggleExerciseCollapse(exercise) {
    const exerciseKey = getExerciseKey(exercise);

    setCollapsedExercises((current) => ({
      ...current,
      [exerciseKey]: !current[exerciseKey],
    }));
  }

  function renderExerciseSummary(exercise, sets) {
    const completedSets = sets.filter((set) => set.completed || isRecordedSetValid(set));
    const bestSet = getBestSet(sets);
    const bestText = bestSet
      ? `Best: ${formatSetValue(bestSet.weightKg, 'kg')} x ${formatSetValue(bestSet.reps, ' reps')}`
      : 'Best: -';

    return (
      <>
        <Text style={styles.exerciseSummary}>
          Completed - {completedSets.length} sets - {bestText}
        </Text>
        <Text style={styles.tapHint}>Tap to expand</Text>
      </>
    );
  }

  async function finishWorkout() {
    if (savingRef.current) {
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add exercises to this workout plan before starting.');
      return;
    }

    const hasInvalidNumber = setRecords.some(
      (record) =>
        !isPositiveDecimalOrBlank(record.weightKg) || !isPositiveIntegerOrBlank(record.reps)
    );

    if (hasInvalidNumber) {
      Alert.alert('Invalid Set', 'Weights must be greater than 0 kg and reps must be whole numbers greater than 0.');
      return;
    }

    const completedSets = setRecords.filter(
      (record) => record.weightKg.trim() !== '' || record.reps.trim() !== ''
    );

    if (completedSets.length === 0) {
      Alert.alert('No Sets Recorded', 'Enter at least one set before finishing the workout.');
      return;
    }

    try {
      savingRef.current = true;
      setSaving(true);
      setTimerRunning(false);
      setTimerSeconds(0);
      Vibration.cancel();
      markRecordedSetsCompleted();
      await createCompletedWorkoutSession(workoutPlanId, completedSets, notes);
      allowExitRef.current = true;
      Alert.alert('Workout Saved', 'Your workout session was saved.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to save workout session', error);
      Alert.alert('Error', 'Could not save workout session.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{plan?.name || 'Workout'}</Text>
        <Text style={styles.subtitle}>Record your sets, then finish the workout.</Text>

        <View style={styles.timerCard}>
          <View>
            <Text style={styles.timerLabel}>Rest Timer</Text>
            <Text style={styles.timerValue}>{formatTimer(timerSeconds)}</Text>
          </View>

          <View style={styles.timerControls}>
            <View style={styles.timerInputWrapper}>
              <TextInput
                value={restSeconds}
                onChangeText={setRestSeconds}
                placeholder="90"
                placeholderTextColor="#777"
                keyboardType="numeric"
                style={styles.timerInput}
              />
              <Text style={styles.inlineUnitText}>sec</Text>
            </View>

            <Pressable style={styles.timerButton} onPress={startRestTimer}>
              <Text style={styles.timerButtonText}>Start</Text>
            </Pressable>

            <Pressable style={styles.timerStopButton} onPress={stopRestTimer}>
              <Text style={styles.timerButtonText}>Stop</Text>
            </Pressable>
          </View>
        </View>

        {exercises.length === 0 ? (
          <Text style={styles.emptyText}>No exercises yet. Add exercises before starting.</Text>
        ) : (
          exercises.map((exercise) => {
            const exerciseKey = getExerciseKey(exercise);
            const exerciseSets = setsByExercise[exercise.id] || [];
            const exerciseCompleted = isExerciseCompleted(exerciseSets);
            const isCollapsed = exerciseCompleted && collapsedExercises[exerciseKey];

            return (
              <View key={exerciseKey} style={styles.exerciseCard}>
                <Pressable
                  style={styles.exerciseHeader}
                  onPress={() => {
                    if (exerciseCompleted) {
                      toggleExerciseCollapse(exercise);
                    }
                  }}>
                  <View style={styles.exerciseHeaderText}>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                    <Text style={styles.exerciseTarget}>
                      Target: {exercise.target_sets || '-'} sets x {exercise.target_reps || '-'} reps
                    </Text>
                  </View>
                  {exerciseCompleted ? (
                    <View style={styles.collapseButton}>
                      <MaterialIcons
                        name={isCollapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
                        color={palette.text}
                        size={24}
                      />
                    </View>
                  ) : null}
                </Pressable>

                {isCollapsed ? renderExerciseSummary(exercise, exerciseSets) : (
                  <>

              <View style={styles.previousPerformanceBox}>
                <Text style={styles.previousTitle}>Last Time</Text>
                {previousSetsByExercise[exercise.id]?.length ? (
                  previousSetsByExercise[exercise.id].map((previousSet) => (
                    <Text key={previousSet.id} style={styles.previousText}>
                      Set {previousSet.set_number}: {formatSetValue(previousSet.weight_kg, ' kg')} x{' '}
                      {formatSetValue(previousSet.reps, ' reps')}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.previousText}>No previous performance yet.</Text>
                )}
              </View>

              {exerciseSets.map((set, setIndex) => (
                <View key={`${exercise.id}-${set.setNumber}`} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                  <View style={styles.weightInputWrapper}>
                    <TextInput
                      value={set.weightKg}
                      onChangeText={(value) =>
                        updateSetValue(exercise.id, setIndex, 'weightKg', value)
                      }
                      placeholder="45"
                      placeholderTextColor="#777"
                      keyboardType="decimal-pad"
                      style={styles.weightInput}
                    />
                    <Text style={styles.inlineUnitText}>kg</Text>
                  </View>
                  <TextInput
                    value={set.reps}
                    onChangeText={(value) => updateSetValue(exercise.id, setIndex, 'reps', value)}
                    placeholder="reps"
                    placeholderTextColor="#777"
                    keyboardType="numeric"
                    style={styles.smallInput}
                  />
                  <Pressable
                    style={[styles.checkButton, set.completed && styles.checkedButton]}
                    onPress={() => completeSet(exercise.id, setIndex)}>
                    <Text style={styles.checkButtonText}>{set.completed ? 'Done' : 'Check'}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.removeSetButton}
                    onPress={() => removeSet(exercise.id, setIndex)}>
                    <Text style={styles.removeSetText}>-</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                <Text style={styles.addSetText}>Add Set</Text>
              </Pressable>
                  </>
                )}
            </View>
            );
          })
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional workout notes"
          placeholderTextColor="#777"
          multiline
          style={[styles.input, styles.textArea]}
        />

        <Pressable
          style={[styles.finishButton, saving && styles.disabledButton]}
          onPress={finishWorkout}
          disabled={saving}>
          <Text style={styles.finishButtonText}>{saving ? 'Saving...' : 'Finish Workout'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.page,
    paddingBottom: 40,
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
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 40,
  },
  timerCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
    gap: 14,
  },
  timerLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timerValue: {
    color: palette.text,
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 4,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerInputWrapper: {
    flex: 1,
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerInput: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timerButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerStopButton: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseHeaderText: {
    flex: 1,
  },
  exerciseTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  exerciseTarget: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
  },
  collapseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseSummary: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6,
  },
  tapHint: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  previousPerformanceBox: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  previousTitle: {
    color: palette.success,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  previousText: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  setNumber: {
    color: palette.textSoft,
    width: 48,
    fontWeight: '700',
  },
  smallInput: {
    flex: 1,
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  weightInputWrapper: {
    flex: 1,
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineUnitText: {
    color: palette.textMuted,
    fontWeight: '700',
    paddingRight: 10,
  },
  removeSetButton: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.sm,
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    backgroundColor: palette.successMuted,
    borderRadius: radius.sm,
    minWidth: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  checkedButton: {
    backgroundColor: palette.primary,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  removeSetText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  addSetButton: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetText: {
    color: '#fff',
    fontWeight: '700',
  },
  label: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  finishButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
