import { useState } from 'react';
import {
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
import { createExercise } from '../database/exerciseQueries';
import { getNumericParam } from '../utils/routeParams';
import { isPositiveDecimalOrBlank, isPositiveIntegerOrBlank } from '../utils/validation';

export default function AddExerciseScreen() {
  const { planId } = useLocalSearchParams();
  const workoutPlanId = getNumericParam(planId);
  const [name, setName] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!workoutPlanId) {
      Alert.alert('Missing Plan', 'Could not find the workout plan id.');
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
      await createExercise(workoutPlanId, name, targetSets, targetReps, targetWeight, restSeconds);
      setName('');
      setTargetSets('');
      setTargetReps('');
      setTargetWeight('');
      setRestSeconds('');
      setSavedMessage('Exercise saved. Add another exercise.');
    } catch (error) {
      console.error('Failed to create exercise', error);
      Alert.alert('Error', 'Could not save exercise.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add Exercise</Text>
        <Text style={styles.subtitle}>Add movements to this plan. Save repeatedly to add more.</Text>
        {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setSavedMessage('');
            }}
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
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Exercise'}</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Done</Text>
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
  savedMessage: {
    color: palette.success,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 18,
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
