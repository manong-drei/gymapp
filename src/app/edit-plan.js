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
import { getWorkoutPlanById, updateWorkoutPlan } from '../database/workoutQueries';

export default function EditPlanScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const plan = await getWorkoutPlanById(id);

        if (!plan) {
          Alert.alert('Not Found', 'Workout plan was not found.');
          router.back();
          return;
        }

        setName(plan.name);
        setDescription(plan.description || '');
      } catch (error) {
        console.error('Failed to load workout plan', error);
        Alert.alert('Error', 'Could not load workout plan.');
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [id]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Workout plan name is required.');
      return;
    }

    try {
      setSaving(true);
      await updateWorkoutPlan(id, name, description);
      router.back();
    } catch (error) {
      console.error('Failed to update workout plan', error);
      Alert.alert('Error', 'Could not update workout plan.');
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
        <Text style={styles.title}>Edit Workout Plan</Text>
        <Text style={styles.subtitle}>Update the name or notes for this routine.</Text>

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
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '800',
  },
  content: {
    padding: spacing.page,
    paddingBottom: 40,
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
