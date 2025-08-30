import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

export default function MoreScreen() {
  const router = useRouter();

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
        <View style={styles.header}>
          <Text style={styles.title}>🔧 More Tools</Text>
          <Text style={styles.subtitle}>Additional features and system information</Text>
        </View>

        {/* Tools and Demos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools & Demos</Text>
          <View style={styles.toolsGrid}>
            {toolsAndDemos.map((tool, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.toolCard, { borderLeftColor: tool.color }]}
                onPress={() => router.push(tool.route as any)}
              >
                <View style={styles.toolHeader}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <View style={[styles.toolIndicator, { backgroundColor: tool.color }]} />
                </View>
                <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
                <View style={styles.toolFooter}>
                  <Text style={styles.tapHint}>Tap to open →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#3B82F6" }]}
              onPress={() => router.push("/")}
            >
              <Text style={styles.quickActionIcon}>🏠</Text>
              <Text style={styles.quickActionText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#10B981" }]}
              onPress={() => router.push("/conversations")}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#F59E0B" }]}
              onPress={() => router.push("/speech")}
            >
              <Text style={styles.quickActionIcon}>🎙️</Text>
              <Text style={styles.quickActionText}>Speech</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#EF4444" }]}
              onPress={() => router.push("/issues")}
            >
              <Text style={styles.quickActionIcon}>🐛</Text>
              <Text style={styles.quickActionText}>Issues</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.systemInfoCard}>
            {systemInfo.map((info, index) => (
              <View key={index} style={styles.systemInfoRow}>
                <Text style={styles.systemInfoLabel}>{info.label}</Text>
                <Text style={styles.systemInfoValue}>{info.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* App Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureTitle}>Claude Integration</Text>
              <Text style={styles.featureDescription}>
                Real-time communication with Claude via InstantDB
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎙️</Text>
              <Text style={styles.featureTitle}>Speech Recognition</Text>
              <Text style={styles.featureDescription}>
                Advanced voice input with live transcription
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureTitle}>Push Notifications</Text>
              <Text style={styles.featureDescription}>
                Real-time notifications for system events
              </Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔄</Text>
              <Text style={styles.featureTitle}>Live Sync</Text>
              <Text style={styles.featureDescription}>
                Automatic synchronization with host system
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>🤖 Organic Software</Text>
          <Text style={styles.footerText}>
            An experimental project exploring AI-assisted development workflows
          </Text>
          <Text style={styles.footerVersion}>
            Version 1.0.0 • Built with Expo & React Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  toolsGrid: {
    gap: 16,
  },
  toolCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  toolIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toolSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  toolFooter: {
    alignItems: "flex-end",
  },
  tapHint: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: "22%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  systemInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  systemInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  systemInfoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  systemInfoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
    textAlign: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});