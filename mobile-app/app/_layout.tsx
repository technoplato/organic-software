import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
        headerStyle: {
          backgroundColor: "#F9FAFB",
        },
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="speech"
        options={{
          title: "Speech",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: "Issues",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bug" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens - accessible via navigation but not in tabs */}
      <Tabs.Screen
        name="speech-demo"
        options={{
          href: null, // Hide from tabs
          title: "Enhanced Speech Demo",
        }}
      />
      <Tabs.Screen
        name="hello"
        options={{
          href: null, // Hide from tabs
          title: "Hello",
        }}
      />
      <Tabs.Screen
        name="demo"
        options={{
          href: null, // Hide from tabs
          title: "Demo",
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          href: null, // Hide from tabs
          title: "Logs",
        }}
      />
    </Tabs>
  );
}
