import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStyles } from "../../lib/useStyles";

export default function TabLayout() {
  const { palette, isDark } = useStyles();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          // Add some padding for better visual appearance
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: palette.surface,
          shadowColor: isDark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 2,
          elevation: isDark ? 3 : 2,
        },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="speech-demo"
        options={{
          // title: "Speech",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
