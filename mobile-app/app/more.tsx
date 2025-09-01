import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import useStyles from "../lib/useStyles";
import * as Application from "expo-application";
import * as Device from "expo-device";

export default function MoreScreen() {
  const router = useRouter();
  const { styles, palette } = useStyles();

  const menuItems = [
    {
      title: "⚙️ Voice Settings",
      subtitle: "Configure trigger keywords and voice recognition",
      onPress: () => router.push("/settings"),
    },
    {
      title: "🎙️ Speech Demo",
      subtitle: "Test advanced speech recognition features",
      onPress: () => router.push("/speech-demo"),
    },
    {
      title: "💬 Conversations",
      subtitle: "Chat with AI using voice or text",
      onPress: () => router.push("/conversations"),
    },
    {
      title: "📝 Issues",
      subtitle: "View and manage project issues",
      onPress: () => router.push("/issues"),
    },
    {
      title: "📊 Logs",
      subtitle: "View system logs and debugging info",
      onPress: () => router.push("/logs"),
    },
    {
      title: "🎨 Demo",
      subtitle: "Interactive UI components demo",
      onPress: () => router.push("/demo"),
    },
    {
      title: "📖 Documentation",
      subtitle: "View project documentation",
      onPress: () => {
        Alert.alert(
          "Documentation",
          "Open project documentation in browser?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open",
              onPress: () => Linking.openURL("https://github.com/your-repo/docs"),
            },
          ]
        );
      },
    },
  ];

  const deviceInfo = [
    { label: "Device", value: Device.deviceName || "Unknown" },
    { label: "Model", value: Device.modelName || "Unknown" },
    { label: "OS", value: `${Device.osName} ${Device.osVersion}` },
    { label: "App Version", value: Application.nativeApplicationVersion || "1.0.0" },
    { label: "Build", value: Application.nativeBuildVersion || "1" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.alignCenter, styles.marginBottom]}>
          <Text style={styles.title}>📱 More</Text>
          <Text style={styles.subtitle}>Settings & Information</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                {
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: palette.text, marginBottom: 4 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                  {item.subtitle}
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: palette.textTertiary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.card}>
            {deviceInfo.map((info, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: index < deviceInfo.length - 1 ? 1 : 0,
                  borderBottomColor: palette.border,
                }}
              >
                <Text style={{ fontSize: 14, color: palette.textSecondary }}>
                  {info.label}
                </Text>
                <Text style={{ fontSize: 14, color: palette.text, fontWeight: "500" }}>
                  {info.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={[styles.card, { backgroundColor: palette.info + "10" }]}>
            <Text style={{ fontSize: 14, color: palette.text, lineHeight: 20 }}>
              <Text style={{ fontWeight: "600" }}>Organic Software</Text>
              {"\n"}An AI-powered development assistant that bridges mobile and desktop environments.
              {"\n\n"}Built with React Native, Expo, InstantDB, and Claude AI.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.alignCenter, { marginTop: 20, marginBottom: 40 }]}>
          <Text style={{ fontSize: 12, color: palette.textTertiary }}>
            Made with ❤️ by the Organic Software Team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}