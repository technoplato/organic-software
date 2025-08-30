import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { init } from "@instantdb/react-native";

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
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export default function ConversationsScreen() {
  const router = useRouter();
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
    // Register for push notifications
    registerForPushNotificationsAsync().then(setPushToken);
    
    // Handle prefilled text from speech recognition
    if (prefillText && typeof prefillText === 'string') {
      setInputText(prefillText);
    }
  }, [prefillText]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    setConversationState("sending");
    
    try {
      // Create a new message in InstantDB
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const conversationId = `conv_${Date.now()}`;
      
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
        <View style={styles.header}>
          <Text style={styles.title}>💬 Conversations</Text>
          <Text style={styles.subtitle}>Chat with Claude via InstantDB</Text>
        </View>

        {/* Host Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Host Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: heartbeatsArray.length > 0 ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {heartbeatsArray.length > 0 ? 'Host Online' : 'Host Offline'}
              </Text>
            </View>
            {pushToken && (
              <Text style={styles.pushTokenText}>📱 Push notifications ready</Text>
            )}
            {heartbeatsArray.length > 0 && (
              <Text style={styles.lastSeenText}>
                Last heartbeat: {new Date().toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => router.push('/speech')}
            >
              <Text style={styles.quickActionText}>🎙️ Voice Input</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#10B981' }]}
              onPress={() => setInputText('Hello Claude! How are you today?')}
            >
              <Text style={styles.quickActionText}>👋 Quick Hello</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Message</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message to Claude..."
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || conversationState !== "idle") && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || conversationState !== "idle"}
            >
              <Text style={styles.sendButtonText}>
                {conversationState === "sending" ? "⏳" : "📤"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Character count */}
          <Text style={styles.characterCount}>
            {inputText.length}/1000 characters
          </Text>
        </View>

        {/* Conversation State */}
        {conversationState !== "idle" && (
          <View style={styles.section}>
            <View style={[
              styles.stateCard,
              { backgroundColor: getStateColor(conversationState) }
            ]}>
              <Text style={styles.stateText}>
                {getStateMessage(conversationState)}
              </Text>
              {conversationState === "waiting_for_claude" && (
                <ActivityIndicator color="white" style={styles.stateLoader} />
              )}
            </View>
          </View>
        )}

        {/* Recent Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          {messagesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messagesArray.length > 0 ? (
            <View style={styles.messagesContainer}>
              {messagesArray
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((message: any) => (
                  <View key={message.id} style={[
                    styles.messageCard,
                    { borderLeftColor: message.role === 'user' ? '#3B82F6' : '#10B981' }
                  ]}>
                    <View style={styles.messageHeader}>
                      <Text style={[
                        styles.messageRole,
                        { color: message.role === 'user' ? '#3B82F6' : '#10B981' }
                      ]}>
                        {message.role === 'user' ? '👤 You' : '🤖 Claude'}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.messageContent}>{message.content}</Text>
                    {message.status && (
                      <Text style={styles.messageStatus}>
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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  pushTokenText: {
    fontSize: 12,
    color: "#059669",
    marginBottom: 4,
  },
  lastSeenText: {
    fontSize: 12,
    color: "#6B7280",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  quickActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
    minHeight: 80,
    maxHeight: 120,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
  },
  characterCount: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
  },
  stateCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  stateLoader: {
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  messagesContainer: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  messageRole: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  messageContent: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
  messageStatus: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});