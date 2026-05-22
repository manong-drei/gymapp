import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initialiseDatabase } from '@/database/database';
import { useThemeName } from '@/hooks/use-theme';

export default function TabLayout() {
  const colorScheme = useThemeName();

  useEffect(() => {
    initialiseDatabase()
      .then(() => {
        console.log('Database initialised successfully');
      })
      .catch((error) => {
        console.error('Database initialisation failed', error);
      });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
