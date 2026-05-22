import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

import { palette } from '@/constants/design';
import { useTheme } from '@/hooks/use-theme';

const tabIcons = {
  index: 'home',
  plan: 'fitness-center',
  progress: 'history',
  settings: 'settings',
};

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <MaterialIcons name={icon as never} color={color} size={24} />;
}

export default function AppTabs() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon={tabIcons.index} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <TabIcon icon={tabIcons.plan} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-plan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-plan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="plan-exercises"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-exercise"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-exercise"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="start-workout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <TabIcon icon={tabIcons.progress} color={color} />,
        }}
      />
      <Tabs.Screen
        name="session-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="progress-tracking"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon={tabIcons.settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
