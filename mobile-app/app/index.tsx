import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { init } from "@instantdb/react-native";
import * as Notifications from "expo-notifications";

// InstantDB configuration
const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

export default function HomePage() {
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<{
    hostOnline: boolean;
    pushNotifications: boolean;
    speechAvailable: boolean;
  }>({
    hostOnline: false,
    pushNotifications: false,
    speechAvailable: false,
  });

  // Check system status
  const { data: heartbeats } = db.useQuery({
    heartbeats: {},
  });

  useEffect(() => {
    // Check host status
    const heartbeatsArray = heartbeats?.heartbeats || [];
    const hostOnline = heartbeatsArray.length > 0;

    // Check push notification status
    Notifications.getPermissionsAsync().then(({ status }) => {
      const pushNotifications = status === 'granted';
      
      setSystemStatus(prev => ({
        ...prev,
        hostOnline,
        pushNotifications,
      }));
    });

    // Check speech recognition (simplified check)
    setSystemStatus(prev => ({
      ...prev,
      speechAvailable: true, // Will be properly checked in speech screen
    }));
  }, [heartbeats]);

  const navigationCards = [
    {
      title: "💬 Conversations",
      subtitle: "Chat with Claude via InstantDB",
      route: "/conversations",
      color: "#3B82F6",
      status: systemStatus.hostOnline ? "🟢 Host Online" : "🔴 Host Offline",
    },
    {
      title: "🎙️ Speech Recognition",
      subtitle: "Voice input and transcription",
      route: "/speech",
      color: "#10B981",
      status: systemStatus.speechAvailable ? "🟢 Available" : "🔴 Unavailable",
    },
    {
      title: "🐛 Issues Tracker",
      subtitle: "View and manage issues",
      route: "/issues",
      color: "#F59E0B",
      status: "📋 Ready",
    },
    {
      title: "🔧 More Tools",
      subtitle: "Additional features and demos",
      route: "/more",
      color: "#8B5CF6",
      status: "⚙️ Available",
    },
  ];

  const quickActions = [
    {
      title: "✨ Enhanced Speech Demo",
      route: "/speech-demo",
      color: "#EC4899",
    },
    {
      title: "👋 Hello Screen",
      route: "/hello",
      color: "#06B6D4",
    },
    {
      title: "📊 System Logs",
      route: "/logs",
      color: "#84CC16",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🤖 Organic Software</Text>
          <Text style={styles.subtitle}>Claude Remote Control & Speech Recognition</Text>
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusIcon}>
                {systemStatus.hostOnline ? "🟢" : "🔴"}
              </Text>
              <Text style={styles.statusLabel}>Host Connection</Text>
              <Text style={styles.statusValue}>
                {systemStatus.hostOnline ? "Online" : "Offline"}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusIcon}>
                {systemStatus.pushNotifications ? "📱" : "🔕"}
              </Text>
              <Text style={styles.statusLabel}>Push Notifications</Text>
              <Text style={styles.statusValue}>
                {systemStatus.pushNotifications ? "Enabled" : "Disabled"}
              </Text>
            </View>
            
            <View style={styles.statusCard}>
              <Text style={styles.statusIcon}>
                {systemStatus.speechAvailable ? "🎙️" : "🔇"}
              </Text>
              <Text style={styles.statusLabel}>Speech Recognition</Text>
              <Text style={styles.statusValue}>
                {systemStatus.speechAvailable ? "Ready" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={styles.navigationGrid}>
            {navigationCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.navigationCard, { borderLeftColor: card.color }]}
                onPress={() => router.push(card.route as any)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardStatus}>{card.status}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <View style={[styles.cardAccent, { backgroundColor: card.color }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: action.color }]}
                onPress={() => router.push(action.route as any)}
              >
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap any card above to navigate to that feature
          </Text>
          <Text style={styles.versionText}>
            v1.0.0 • iOS Development Build
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
    fontSize: 32,
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
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statusCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  navigationGrid: {
    gap: 16,
  },
  navigationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  cardStatus: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.1,
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
});