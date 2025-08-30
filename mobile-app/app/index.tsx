import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { init } from "@instantdb/react-native";
import * as Notifications from "expo-notifications";
import useStyles from "../lib/useStyles";

// InstantDB configuration
const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

export default function HomePage() {
  const router = useRouter();
  const { styles, palette } = useStyles();
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
        <View style={[styles.alignCenter, styles.marginBottom]}>
          <Text style={[styles.title, { fontSize: 32 }]}>🤖 Organic Software</Text>
          <Text style={styles.subtitle}>Claude Remote Control & Speech Recognition</Text>
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={[styles.flexRow, { justifyContent: 'space-between', gap: 10 }]}>
            <View style={[styles.card, styles.flex1, styles.alignCenter]}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>
                {systemStatus.hostOnline ? "🟢" : "🔴"}
              </Text>
              <Text style={[styles.textCenter, { fontSize: 12, color: palette.textSecondary, marginBottom: 4 }]}>
                Host Connection
              </Text>
              <Text style={[styles.textCenter, { fontSize: 14, fontWeight: "600", color: palette.textPrimary }]}>
                {systemStatus.hostOnline ? "Online" : "Offline"}
              </Text>
            </View>
            
            <View style={[styles.card, styles.flex1, styles.alignCenter]}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>
                {systemStatus.pushNotifications ? "📱" : "🔕"}
              </Text>
              <Text style={[styles.textCenter, { fontSize: 12, color: palette.textSecondary, marginBottom: 4 }]}>
                Push Notifications
              </Text>
              <Text style={[styles.textCenter, { fontSize: 14, fontWeight: "600", color: palette.textPrimary }]}>
                {systemStatus.pushNotifications ? "Enabled" : "Disabled"}
              </Text>
            </View>
            
            <View style={[styles.card, styles.flex1, styles.alignCenter]}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>
                {systemStatus.speechAvailable ? "🎙️" : "🔇"}
              </Text>
              <Text style={[styles.textCenter, { fontSize: 12, color: palette.textSecondary, marginBottom: 4 }]}>
                Speech Recognition
              </Text>
              <Text style={[styles.textCenter, { fontSize: 14, fontWeight: "600", color: palette.textPrimary }]}>
                {systemStatus.speechAvailable ? "Ready" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={{ gap: 16 }}>
            {navigationCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: card.color, position: 'relative', overflow: 'hidden' }]}
                onPress={() => router.push(card.route as any)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={[{ fontSize: 12, color: palette.textSecondary, backgroundColor: palette.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }]}>
                    {card.status}
                  </Text>
                </View>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <View style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: card.color,
                  opacity: 0.1,
                  transform: [{ translateX: 20 }, { translateY: -20 }],
                }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={[styles.flexRow, { flexWrap: 'wrap', gap: 12 }]}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[{
                  flex: 1,
                  minWidth: "30%",
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: action.color,
                }, styles.alignCenter, styles.justifyCenter]}
                onPress={() => router.push(action.route as any)}
              >
                <Text style={[styles.buttonText, styles.textCenter]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Info */}
        <View style={[styles.alignCenter, styles.marginTop, { paddingTop: 20, borderTopWidth: 1, borderTopColor: palette.border }]}>
          <Text style={[styles.textCenter, { fontSize: 14, color: palette.textSecondary, marginBottom: 8 }]}>
            Tap any card above to navigate to that feature
          </Text>
          <Text style={[styles.textCenter, { fontSize: 12, color: palette.textTertiary }]}>
            v1.0.0 • iOS Development Build
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}