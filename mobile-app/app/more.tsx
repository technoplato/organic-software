import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import useStyles from "../lib/useStyles";

export default function MoreScreen() {
  const router = useRouter();
  const { styles, palette } = useStyles();

  const toolsAndDemos = [
    {
      title: "✨ Enhanced Speech Demo",
      subtitle: "Advanced speech recognition features",
      route: "/speech-demo",
      color: "#EC4899",
      description: "Explore enhanced speech recognition capabilities with advanced features and settings.",
    },
    {
      title: "👋 Hello Screen",
      subtitle: "Simple greeting interface",
      route: "/hello",
      color: "#06B6D4",
      description: "A basic hello world screen for testing navigation and basic functionality.",
    },
    {
      title: "📊 System Logs",
      subtitle: "View application logs",
      route: "/logs",
      color: "#84CC16",
      description: "Monitor system logs and debug information from the application.",
    },
    {
      title: "🎭 Demo Screen",
      subtitle: "General demo interface",
      route: "/demo",
      color: "#F59E0B",
      description: "A general-purpose demo screen for testing various features and components.",
    },
  ];

  const systemInfo = [
    { label: "App Version", value: "1.0.0" },
    { label: "Build Type", value: "iOS Development" },
    { label: "Expo Router", value: "Enabled" },
    { label: "InstantDB", value: "Connected" },
    { label: "Speech Recognition", value: "Available" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.alignCenter, styles.marginBottom]}>
          <Text style={styles.title}>🔧 More Tools</Text>
          <Text style={styles.subtitle}>Additional features and system information</Text>
        </View>

        {/* Tools and Demos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools & Demos</Text>
          <View style={{ gap: 16 }}>
            {toolsAndDemos.map((tool, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: tool.color }]}
                onPress={() => router.push(tool.route as any)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{tool.title}</Text>
                  <View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: tool.color }]} />
                </View>
                <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
                <Text style={styles.cardDescription}>{tool.description}</Text>
                <View style={[styles.alignCenter, { alignItems: 'flex-end' }]}>
                  <Text style={[{ fontSize: 12, color: palette.textTertiary, fontStyle: 'italic' }]}>
                    Tap to open →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.accent }, styles.gridItemHalf, styles.alignCenter, styles.justifyCenter, { paddingVertical: 16 }]}
              onPress={() => router.push("/")}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🏠</Text>
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.success }, styles.gridItemHalf, styles.alignCenter, styles.justifyCenter, { paddingVertical: 16 }]}
              onPress={() => router.push("/conversations")}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>💬</Text>
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.warning }, styles.gridItemHalf, styles.alignCenter, styles.justifyCenter, { paddingVertical: 16 }]}
              onPress={() => router.push("/speech")}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🎙️</Text>
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Speech</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: palette.error }, styles.gridItemHalf, styles.alignCenter, styles.justifyCenter, { paddingVertical: 16 }]}
              onPress={() => router.push("/issues")}
            >
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🐛</Text>
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.card}>
            {systemInfo.map((info, index) => (
              <View key={index} style={[
                styles.flexRow,
                styles.justifyBetween,
                styles.alignCenter,
                { paddingVertical: 12, borderBottomWidth: index < systemInfo.length - 1 ? 1 : 0, borderBottomColor: palette.border }
              ]}>
                <Text style={[{ fontSize: 14, color: palette.textSecondary, fontWeight: '500' }]}>
                  {info.label}
                </Text>
                <Text style={[{ fontSize: 14, color: palette.textPrimary, fontWeight: '600' }]}>
                  {info.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* App Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.grid}>
            {[
              { icon: "🤖", title: "Claude Integration", description: "Real-time communication with Claude via InstantDB" },
              { icon: "🎙️", title: "Speech Recognition", description: "Advanced voice input with live transcription" },
              { icon: "📱", title: "Push Notifications", description: "Real-time notifications for system events" },
              { icon: "🔄", title: "Live Sync", description: "Automatic synchronization with host system" },
            ].map((feature, index) => (
              <View key={index} style={[styles.card, styles.gridItemHalf]}>
                <Text style={[{ fontSize: 32, marginBottom: 12, textAlign: 'center' }]}>
                  {feature.icon}
                </Text>
                <Text style={[{ fontSize: 16, fontWeight: '600', color: palette.textPrimary, marginBottom: 8, textAlign: 'center' }]}>
                  {feature.title}
                </Text>
                <Text style={[{ fontSize: 12, color: palette.textSecondary, lineHeight: 16, textAlign: 'center' }]}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.alignCenter, styles.marginTop, { paddingTop: 30, borderTopWidth: 1, borderTopColor: palette.border }]}>
          <Text style={[{ fontSize: 20, fontWeight: 'bold', color: palette.textPrimary, marginBottom: 8 }]}>
            🤖 Organic Software
          </Text>
          <Text style={[styles.textCenter, { fontSize: 14, color: palette.textSecondary, lineHeight: 20, marginBottom: 8 }]}>
            An experimental project exploring AI-assisted development workflows
          </Text>
          <Text style={[styles.textCenter, { fontSize: 12, color: palette.textTertiary }]}>
            Version 1.0.0 • Built with Expo & React Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}