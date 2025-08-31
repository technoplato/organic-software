import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { init, id } from "@instantdb/react-native";
import useStyles from "../lib/useStyles";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// InstantDB configuration
const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || "54d69382-c27c-4e54-b2ac-c3dcaef2f0ad",
});

// Define types
interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: string;
  claudeSessionId?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "pending" | "processing" | "completed" | "error";
  metadata?: Record<string, any>;
}

type ConversationState = "idle" | "sending" | "waiting_for_claude" | "claude_responding" | "error";

// Push notification registration helper
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }
    
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.warn('No project ID found. Using a fallback project ID for testing.');
    }
    
    const tokenOptions: Notifications.ExpoPushTokenOptions = {
      development: Platform.OS === 'ios',
      ...(projectId && { projectId })
    };
    
    const token = (await Notifications.getExpoPushTokenAsync(tokenOptions)).data;
    console.log('📱 Push token obtained:', token);
    return token;
  } catch (error: any) {
    // Check for specific entitlement error
    if (error?.message?.includes('aps-environment')) {
      console.warn('⚠️ Push notifications require a development build with proper entitlements.');
      console.warn('📖 See mobile-app/PUSH_NOTIFICATIONS_SETUP.md for instructions.');
      console.warn('🔧 Run: eas build --profile development --platform ios');
      
      // Still return the token if we got one (for testing purposes)
      if (error?.message?.includes('ExponentPushToken')) {
        const tokenMatch = error.message.match(/ExponentPushToken\[[^\]]+\]/);
        if (tokenMatch) {
          console.log('📱 Token obtained despite entitlement error:', tokenMatch[0]);
          return tokenMatch[0];
        }
      }
    }
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { styles, palette } = useStyles();
  const { prefillText } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [pushToken, setPushToken] = useState<string | null>(null);

  // InstantDB queries
  const { data: conversations, isLoading: conversationsLoading } = db.useQuery({
    conversations: {},
  });

  const { data: messages, isLoading: messagesLoading } = db.useQuery({
    messages: {},
  });

  const { data: heartbeats } = db.useQuery({
    heartbeats: {},
  });

  // Extract arrays from InstantDB response format
  const heartbeatsArray = heartbeats?.heartbeats || [];
  const messagesArray = messages?.messages || [];

  useEffect(() => {
    console.log('🔔 Starting push notification registration...');
    registerForPushNotificationsAsync().then(async (token) => {
      setPushToken(token);
      console.log('🔔 Finished push notification registration. Token:', token);
      
      if (token) {
        try {
          // Save push token to database
          const deviceDbId = id();
          await db.transact([
            db.tx.devices[deviceDbId].update({
              pushToken: token,
              deviceId: deviceDbId,
              platform: Platform.OS,
              updatedAt: Date.now(),
              createdAt: Date.now(),
            }),
          ]);
          console.log('✅ Push token saved to database:', token);
        } catch (error) {
          console.error('❌ Failed to save push token to database:', error);
        }
      }
    });
    
    // Handle prefilled text from speech recognition
    console.log('📝 prefillText value:', prefillText);
    if (prefillText && typeof prefillText === 'string') {
      setInputText(prefillText);
    }
  }, [prefillText]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    setConversationState("sending");
    
    try {
      // Create a new message in InstantDB
      const messageId = id();
      const conversationId = id();
      
      await db.transact([
        db.tx.messages[messageId].update({
          conversationId,
          role: "user",
          content: inputText.trim(),
          timestamp: Date.now(),
          status: "pending",
        }),
      ]);
      
      setInputText('');
      setConversationState("waiting_for_claude");
      
      // The host application will pick up this message and respond
      
    } catch (error) {
      console.error('Error sending message:', error);
      setConversationState("error");
      Alert.alert('Error', 'Failed to send message');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.alignCenter, styles.marginBottom]}>
          <Text style={styles.title}>💬 Conversations</Text>
          <Text style={styles.subtitle}>Chat with Claude via InstantDB</Text>
        </View>

        {/* Host Status */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Host Status</Text>
          <View style={styles.card}>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: heartbeatsArray.length > 0 ? palette.success : palette.error }
              ]} />
              <Text style={styles.statusText}>
                {heartbeatsArray.length > 0 ? 'Host Online' : 'Host Offline'}
              </Text>
            </View>
            {pushToken && (
              <Text style={[{ fontSize: 12, color: palette.success, marginBottom: 4 }]}>
                📱 Push notifications ready
              </Text>
            )}
            {heartbeatsArray.length > 0 && (
              <Text style={[{ fontSize: 12, color: palette.textSecondary }]}>
                Last heartbeat: {new Date().toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Quick Actions</Text>
          <View style={[styles.flexRow, { gap: 12 }]}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, styles.flex1]}
              onPress={() => router.push('/speech')}
            >
              <Text style={styles.buttonText}>🎙️ Voice Input</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSuccess, styles.flex1]}
              onPress={() => setInputText('Hello Claude! How are you today?')}
            >
              <Text style={styles.buttonText}>👋 Quick Hello</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Send Message</Text>
          <View style={[styles.flexRow, { alignItems: 'flex-end', gap: 12 }]}>
            <TextInput
              style={[styles.textInput, styles.flex1, { minHeight: 80, maxHeight: 120, textAlignVertical: 'top' }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message to Claude..."
              placeholderTextColor={palette.textTertiary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { minHeight: 56, paddingVertical: 16, paddingHorizontal: 20 },
                (!inputText.trim() || conversationState !== "idle") && styles.buttonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || conversationState !== "idle"}
            >
              <Text style={[{ fontSize: 20 }]}>
                {conversationState === "sending" ? "⏳" : "📤"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Character count */}
          <Text style={[styles.textRight, { fontSize: 12, color: palette.textSecondary, marginTop: 4 }]}>
            {inputText.length}/1000 characters
          </Text>
        </View>

        {/* Conversation State */}
        {conversationState !== "idle" && (
          <View style={styles.section}>
            <View style={[
              styles.card,
              { backgroundColor: getStateColor(conversationState), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
            ]}>
              <Text style={[{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }]}>
                {getStateMessage(conversationState)}
              </Text>
              {conversationState === "waiting_for_claude" && (
                <ActivityIndicator color="white" style={{ marginLeft: 12 }} />
              )}
            </View>
          </View>
        )}

        {/* Recent Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Recent Messages</Text>
          {messagesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.accent} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messagesArray.length > 0 ? (
            <View style={{ gap: 12 }}>
              {messagesArray
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((message: any) => (
                  <View key={message.id} style={[
                    styles.messageCard,
                    { borderLeftColor: message.role === 'user' ? palette.accent : palette.success }
                  ]}>
                    <View style={styles.messageHeader}>
                      <Text style={[
                        styles.messageRole,
                        { color: message.role === 'user' ? palette.accent : palette.success }
                      ]}>
                        {message.role === 'user' ? '👤 You' : '🤖 Claude'}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.messageContent}>{message.content}</Text>
                    {message.status && (
                      <Text style={[{ fontSize: 12, color: palette.textSecondary, marginTop: 8, fontStyle: 'italic' }]}>
                        Status: {message.status}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💬</Text>
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateText}>
                Start a conversation by typing a message above
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStateColor(state: ConversationState): string {
  switch (state) {
    case "sending": return "#F59E0B";
    case "waiting_for_claude": return "#3B82F6";
    case "claude_responding": return "#10B981";
    case "error": return "#EF4444";
    default: return "#6B7280";
  }
}

function getStateMessage(state: ConversationState): string {
  switch (state) {
    case "sending": return "Sending message...";
    case "waiting_for_claude": return "Waiting for Claude to respond...";
    case "claude_responding": return "Claude is typing...";
    case "error": return "An error occurred";
    default: return "";
  }
}