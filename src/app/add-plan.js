import { useCallback, useRef, useState } from 'react';
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
import { router, useFocusEffect } from 'expo-router';

import { palette, radius, spacing } from '../constants/design';
import { createWorkoutPlan } from '../database/workoutQueries';

export default function AddPlanScreen() {
  const savingRef = useRef(false);
  const createdPlanIdRef = useRef(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (createdPlanIdRef.current) {
        router.replace('/plan');
      }
    }, [])
  );

  async function handleSave() {
    if (savingRef.current) {
      return;
    }

    if (createdPlanIdRef.current) {
      router.replace({ pathname: '/plan-exercises', params: { planId: createdPlanIdRef.current } });
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Name', 'Workout plan name is required.');
      return;
    }

    try {
      savingRef.current = true;
      setSaving(true);
      const newPlanId = await createWorkoutPlan(name, description);

      if (!newPlanId) {
        Alert.alert('Error', 'Workout plan was saved, but could not open its exercises.');
        return;
      }

      createdPlanIdRef.current = newPlanId;
      setName('');
      setDescription('');
      router.replace({ pathname: '/plan-exercises', params: { planId: newPlanId } });
    } catch (error) {
      console.error('Failed to create workout plan', error);
      Alert.alert('Error', 'Could not save workout plan.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add Workout Plan</Text>
        <Text style={styles.subtitle}>Create a routine you can reuse for workouts.</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Workout Plan Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Push Day"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Chest, shoulders, and triceps"
            placeholderTextColor="#777"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Plan'}</Text>
          </Pressable>

          <Pressable
            style={[styles.cancelButton, saving && styles.disabledButton]}
            onPress={() => router.back()}
            disabled={saving}>
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
    marginBottom: 20,
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
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
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
