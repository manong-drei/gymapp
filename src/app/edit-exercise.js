import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import { getExerciseById, updateExercise } from '../database/exerciseQueries';
import { getNumericParam } from '../utils/routeParams';
import { isPositiveDecimalOrBlank, isPositiveIntegerOrBlank } from '../utils/validation';

function toInputValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams();
  const exerciseId = getNumericParam(id);
  const [name, setName] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        if (!exerciseId) {
          Alert.alert('Missing Exercise', 'Could not find the exercise id.');
          router.back();
          return;
        }

        const exercise = await getExerciseById(exerciseId);

        if (!exercise) {
          Alert.alert('Not Found', 'Exercise was not found.');
          router.back();
          return;
        }

        setName(exercise.name);
        setTargetSets(toInputValue(exercise.target_sets));
        setTargetReps(exercise.target_reps || '');
        setTargetWeight(toInputValue(exercise.target_weight));
        setRestSeconds(toInputValue(exercise.rest_seconds));
      } catch (error) {
        console.error('Failed to load exercise', error);
        Alert.alert('Error', 'Could not load exercise.');
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [exerciseId]);

  async function handleSave() {
    if (!exerciseId) {
      Alert.alert('Missing Exercise', 'Could not find the exercise id.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Name', 'Exercise name is required.');
      return;
    }

    if (!isPositiveIntegerOrBlank(targetSets)) {
      Alert.alert('Invalid Sets', 'Target sets must be a whole number greater than 0.');
      return;
    }

    if (!isPositiveDecimalOrBlank(targetWeight)) {
      Alert.alert('Invalid Weight', 'Target weight must be greater than 0 kg.');
      return;
    }

    if (!isPositiveIntegerOrBlank(restSeconds)) {
      Alert.alert('Invalid Rest Time', 'Rest time must be a whole number of seconds greater than 0.');
      return;
    }

    try {
      setSaving(true);
      await updateExercise(exerciseId, name, targetSets, targetReps, targetWeight, restSeconds);
      router.back();
    } catch (error) {
      console.error('Failed to update exercise', error);
      Alert.alert('Error', 'Could not update exercise.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={palette.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Exercise</Text>
        <Text style={styles.subtitle}>Adjust targets for this movement.</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Bench Press"
            placeholderTextColor="#777"
            style={styles.input}
          />

        <Text style={styles.label}>Target Sets</Text>
        <TextInput
          value={targetSets}
          onChangeText={setTargetSets}
          placeholder="3"
          placeholderTextColor="#777"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Target Reps</Text>
        <TextInput
          value={targetReps}
          onChangeText={setTargetReps}
          placeholder="8-12"
          placeholderTextColor="#777"
          style={styles.input}
        />

        <Text style={styles.label}>Target Weight</Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="40"
            placeholderTextColor="#777"
            keyboardType="decimal-pad"
            style={styles.unitInput}
          />
          <Text style={styles.unitText}>kg</Text>
        </View>

        <Text style={styles.label}>Rest Time</Text>
        <View style={styles.inputWithUnit}>
          <TextInput
            value={restSeconds}
            onChangeText={setRestSeconds}
            placeholder="90"
            placeholderTextColor="#777"
            keyboardType="numeric"
            style={styles.unitInput}
          />
          <Text style={styles.unitText}>sec</Text>
        </View>

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
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
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.card,
  },
  label: {
    color: palette.textSoft,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: '#fff',
    fontSize: 16,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputWithUnit: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  unitInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unitText: {
    color: palette.textMuted,
    fontSize: 16,
    fontWeight: '700',
    paddingRight: 14,
  },
  saveButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderColor: palette.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: palette.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});
