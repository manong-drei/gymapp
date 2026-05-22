import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import PlanScreen from "../screens/PlanScreen";
import ProgressScreen from "../screens/ProgressScreen";
import CalendarScreen from "../screens/CalendarScreen";
import WeightScreen from "../screens/WeightScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#111" },
          headerTintColor: "#fff",
          tabBarStyle: { backgroundColor: "#111" },
          tabBarActiveTintColor: "#fff",
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Weight" component={WeightScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
