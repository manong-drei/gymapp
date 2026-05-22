/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeName() {
  return useColorScheme() ?? 'light';
}

export function useTheme() {
  return Colors[useThemeName()];
}
