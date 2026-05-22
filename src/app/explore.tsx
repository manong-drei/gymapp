import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing } from '@/constants/design';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FORGED</Text>
      <Text style={styles.subtitle}>Workout tracking, history, and progress in one place.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: spacing.page,
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
});
