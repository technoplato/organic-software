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
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { init } from "@instantdb/react-native";
import { useSpeechRecognition, RecognitionState, checkSpeechRecognitionAvailability } from "../lib/speech-recognition";

// Configure notification handler - how notifications should be presented when app is in foreground
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

// Define types matching the host application
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

type Screen = "conversations" | "issues" | "hello" | "speech";

interface Issue {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Done";
}

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
    
    // Get project ID from Constants
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.warn('No project ID found. Using a fallback project ID for testing.');
      // Use a test project ID for Expo Go testing
      // In production, you would need a real EAS project ID
    }
    
    // Configure push token options
    const tokenOptions: Notifications.ExpoPushTokenOptions = {
      // For iOS in Expo Go, use the sandbox environment
      development: Platform.OS === 'ios',
      // Project ID is optional in Expo Go but required for production
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

export default function App() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<Screen>("conversations");
  const [inputText, setInputText] = useState('');
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Speech recognition hooks
  const {
    state: speechState,
    transcript,
    interimTranscript,
    isRecognizing,
    error: speechError,
    recordingUri,
    start: startSpeech,
    stop: stopSpeech,
    abort: abortSpeech,
    reset: resetSpeech,
  } = useSpeechRecognition();

  const [speechCapabilities, setSpeechCapabilities] = useState<{
    isAvailable: boolean;
    supportsOnDevice: boolean;
    supportsRecording: boolean;
  } | null>(null);

  // InstantDB queries
  const { data: conversations, isLoading: conversationsLoading } = db.useQuery({
    conversations: {},
  });

  const { data: messages, isLoading: messagesLoading } = db.useQuery({
    messages: {},
  });

  const { data: issues, isLoading: issuesLoading } = db.useQuery({
    issues: {},
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
    
    // Check speech recognition capabilities
    checkSpeechRecognitionAvailability().then(setSpeechCapabilities);
  }, []);

  // Auto-fill input with speech transcript
  useEffect(() => {
    if (transcript && currentScreen === "conversations") {
      setInputText(transcript);
    }
  }, [transcript, currentScreen]);

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

  const handleSpeechStart = async () => {
    if (!speechCapabilities?.isAvailable) {
      Alert.alert(
        "Speech Recognition Unavailable",
        "Speech recognition is not available on this device. Please enable Siri & Dictation in Settings."
      );
      return;
    }
    await startSpeech();
  };

  const renderConversationsScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>💬 Conversations</Text>
      
      {/* Host Status */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Host Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {heartbeatsArray.length > 0 ? '🟢 Online' : '🔴 Offline'}
          </Text>
          {pushToken && (
            <Text style={styles.pushTokenText}>📱 Push notifications ready</Text>
          )}
        </View>
      </View>

      {/* Speech Input Section */}
      <View style={styles.speechSection}>
        <Text style={styles.sectionTitle}>🎙️ Voice Input</Text>
        <View style={styles.speechControls}>
          <TouchableOpacity
            style={[
              styles.speechButton,
              isRecognizing && styles.speechButtonActive,
              { backgroundColor: isRecognizing ? "#EF4444" : "#10B981" },
            ]}
            onPress={isRecognizing ? stopSpeech : handleSpeechStart}
          >
            <Text style={styles.speechButtonText}>
              {isRecognizing ? "🛑 Stop" : "🎙️ Start"}
            </Text>
          </TouchableOpacity>
          
          {speechState !== RecognitionState.IDLE && (
            <View style={styles.speechStatus}>
              <Text style={styles.speechStatusText}>
                {speechState.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        {speechError && (
          <Text style={styles.errorText}>Error: {speechError}</Text>
        )}
        
        {interimTranscript && (
          <Text style={styles.interimText}>Listening: {interimTranscript}</Text>
        )}
      </View>

      {/* Message Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message or use voice input..."
          multiline
          maxLength={1000}
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

      {/* Conversation State */}
      {conversationState !== "idle" && (
        <View style={styles.stateSection}>
          <Text style={styles.stateText}>
            {conversationState === "sending" && "Sending message..."}
            {conversationState === "waiting_for_claude" && "Waiting for Claude..."}
            {conversationState === "claude_responding" && "Claude is responding..."}
            {conversationState === "error" && "Error occurred"}
          </Text>
        </View>
      )}

      {/* Recent Messages */}
      <ScrollView style={styles.messagesContainer}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        {messagesLoading ? (
          <ActivityIndicator />
        ) : messagesArray.length > 0 ? (
          messagesArray
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, 10)
            .map((message: any) => (
              <View key={message.id} style={styles.messageCard}>
                <Text style={styles.messageRole}>{message.role}</Text>
                <Text style={styles.messageContent}>{message.content}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))
        ) : (
          <Text style={styles.emptyText}>No messages yet</Text>
        )}
      </ScrollView>
    </View>
  );

  const renderSpeechScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>🎙️ Speech Recognition Demo</Text>
      
      {/* Navigation to Enhanced Demo */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#8B5CF6", marginBottom: 20 }]}
        onPress={() => router.push("/speech-demo")}
      >
        <Text style={styles.buttonText}>✨ Try Enhanced Demo</Text>
      </TouchableOpacity>

      {/* Capabilities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Capabilities</Text>
        {speechCapabilities ? (
          <View style={styles.capabilitiesGrid}>
            <View style={styles.capability}>
              <Text style={styles.capabilityLabel}>Available</Text>
              <Text style={styles.capabilityValue}>
                {speechCapabilities.isAvailable ? "✅" : "❌"}
              </Text>
            </View>
            <View style={styles.capability}>
              <Text style={styles.capabilityLabel}>On-Device</Text>
              <Text style={styles.capabilityValue}>
                {speechCapabilities.supportsOnDevice ? "✅" : "❌"}
              </Text>
            </View>
            <View style={styles.capability}>
              <Text style={styles.capabilityLabel}>Recording</Text>
              <Text style={styles.capabilityValue}>
                {speechCapabilities.supportsRecording ? "✅" : "❌"}
              </Text>
            </View>
          </View>
        ) : (
          <ActivityIndicator />
        )}
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recognition Status</Text>
        <View style={[styles.statusCard, { borderColor: getSpeechStateColor() }]}>
          <Text style={styles.statusEmoji}>{getSpeechStateEmoji()}</Text>
          <Text style={[styles.statusText, { color: getSpeechStateColor() }]}>
            {speechState.toUpperCase()}
          </Text>
          {isRecognizing && (
            <View style={styles.pulsingDot}>
              <View style={[styles.dot, { backgroundColor: getSpeechStateColor() }]} />
            </View>
          )}
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[
              styles.button,
              isRecognizing && styles.buttonDisabled,
              { backgroundColor: "#10B981" },
            ]}
            onPress={handleSpeechStart}
            disabled={isRecognizing}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              !isRecognizing && styles.buttonDisabled,
              { backgroundColor: "#F59E0B" },
            ]}
            onPress={stopSpeech}
            disabled={!isRecognizing}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              !isRecognizing && styles.buttonDisabled,
              { backgroundColor: "#EF4444" },
            ]}
            onPress={abortSpeech}
            disabled={!isRecognizing}
          >
            <Text style={styles.buttonText}>Abort</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "#6B7280" },
            ]}
            onPress={resetSpeech}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Section */}
      {speechError && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{speechError}</Text>
          </View>
        </View>
      )}

      {/* Transcript Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Transcript</Text>
        <View style={styles.transcriptCard}>
          {transcript || interimTranscript ? (
            <>
              {transcript && (
                <Text style={styles.transcriptText}>{transcript}</Text>
              )}
              {interimTranscript && (
                <Text style={styles.interimText}>{interimTranscript}</Text>
              )}
            </>
          ) : (
            <Text style={styles.placeholderText}>
              {isRecognizing ? "Listening..." : "Press Start to begin transcription"}
            </Text>
          )}
        </View>
      </View>

      {/* Recording Info */}
      {recordingUri && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Saved</Text>
          <View style={styles.recordingCard}>
            <Text style={styles.recordingText}>📁 Audio file saved</Text>
            <Text style={styles.recordingPath} numberOfLines={2}>
              {recordingUri}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const getSpeechStateColor = () => {
    switch (speechState) {
      case RecognitionState.IDLE:
        return "#6B7280";
      case RecognitionState.STARTING:
        return "#F59E0B";
      case RecognitionState.RECOGNIZING:
        return "#10B981";
      case RecognitionState.STOPPING:
        return "#F59E0B";
      case RecognitionState.ERROR:
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getSpeechStateEmoji = () => {
    switch (speechState) {
      case RecognitionState.IDLE:
        return "😴";
      case RecognitionState.STARTING:
        return "🚀";
      case RecognitionState.RECOGNIZING:
        return "🎙️";
      case RecognitionState.STOPPING:
        return "⏸️";
      case RecognitionState.ERROR:
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "conversations" && styles.navButtonActive
          ]}
          onPress={() => setCurrentScreen("conversations")}
        >
          <Text style={styles.navButtonText}>💬</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "speech" && styles.navButtonActive
          ]}
          onPress={() => setCurrentScreen("speech")}
        >
          <Text style={styles.navButtonText}>🎙️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "issues" && styles.navButtonActive
          ]}
          onPress={() => {
            setCurrentScreen("issues");
            router.push("/issues");
          }}
        >
          <Text style={styles.navButtonText}>🐛</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "hello" && styles.navButtonActive
          ]}
          onPress={() => {
            setCurrentScreen("hello");
            router.push("/hello");
          }}
        >
          <Text style={styles.navButtonText}>👋</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <ScrollView style={styles.content}>
        {currentScreen === "conversations" && renderConversationsScreen()}
        {currentScreen === "speech" && renderSpeechScreen()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  navigation: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  navButtonActive: {
    backgroundColor: "#EBF8FF",
  },
  navButtonText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  screenContainer: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  statusSection: {
    marginBottom: 20,
  },
  speechSection: {
    marginBottom: 20,
  },
  speechControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  speechButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 15,
  },
  speechButtonActive: {
    backgroundColor: "#EF4444",
  },
  speechButtonText: {
    color: "white",
    fontWeight: "600",
  },
  speechStatus: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  speechStatusText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  inputSection: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    backgroundColor: "white",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "white",
    fontSize: 18,
  },
  stateSection: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  stateText: {
    color: "#92400E",
    textAlign: "center",
    fontWeight: "600",
  },
  messagesContainer: {
    maxHeight: 300,
  },
  messageCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  messageRole: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  messageContent: {
    fontSize: 14,
    color: "#111827",
    marginVertical: 4,
  },
  messageTime: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 5,
  },
  interimText: {
    color: "#6B7280",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 5,
  },
  pushTokenText: {
    fontSize: 12,
    color: "#059669",
    marginTop: 4,
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
    padding: 15,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  pulsingDot: {
    marginLeft: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  section: {
    marginBottom: 25,
  },
  capabilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  capability: {
    alignItems: "center",
  },
  capabilityLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 5,
  },
  capabilityValue: {
    fontSize: 24,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  transcriptCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    minHeight: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transcriptText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  recordingCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  recordingText: {
    fontSize: 16,
    color: "#166534",
    fontWeight: "600",
    marginBottom: 8,
  },
  recordingPath: {
    fontSize: 12,
    color: "#15803D",
    fontFamily: "monospace",
  },
});