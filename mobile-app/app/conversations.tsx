
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { init, id } from "@instantdb/react-native";
import {
  useEnhancedSpeechRecognition,
  RecognitionState,
} from "../lib/enhanced-speech-recognition";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  appId:
    process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
    "fb7ff756-0a99-4d0c-81f7-71a0abee071f",
});

// Define types
interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "pending" | "processing" | "completed" | "error" | "streaming";
  metadata?: Record<string, any>;
  isStreaming?: boolean;
  streamChunks?: string[];
  finalContent?: string;
}

type ConversationState =
  | "idle"
  | "sending"
  | "waiting_for_response"
  | "responding"
  | "error"
  | "voice_recording";

// Default trigger keywords
const DEFAULT_TRIGGER_KEYWORDS = ["send", "done", "submit", "send message", "send it"];

// Push notification registration helper
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission not granted");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenOptions: Notifications.ExpoPushTokenOptions = {
      development: Platform.OS === "ios",
      ...(projectId && { projectId }),
    };

    const token = (await Notifications.getExpoPushTokenAsync(tokenOptions))
      .data;
    return token;
  } catch (error: any) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { prefillText } = useLocalSearchParams();
  const [inputText, setInputText] = useState("");
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [triggerKeywords, setTriggerKeywords] = useState<string[]>(DEFAULT_TRIGGER_KEYWORDS);
  const [textInputHeight, setTextInputHeight] = useState(56);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { height: screenHeight } = Dimensions.get('window');
  const maxInputHeight = Math.min(200, screenHeight * 0.3);
  const [showThoughts, setShowThoughts] = useState(false);

  // Enhanced speech recognition
  const {
    state: speechState,
    segments,
    interimTranscript,
    isRecognizing,
    error: speechError,
    volumeLevel,
    start: startRecognition,
    stop: stopRecognition,
    reset: resetRecognition,
  } = useEnhancedSpeechRecognition();

  // InstantDB queries
  const { data: messages, isLoading: messagesLoading } = db.useQuery({
    messages: {},
  });

  const { data: heartbeats } = db.useQuery({
    heartbeats: {},
  });

  // Extract arrays from InstantDB response format
  const heartbeatsArray = heartbeats?.heartbeats || [];
  const messagesArray = messages?.messages || [];

  // Load trigger keywords from storage
  useEffect(() => {
    AsyncStorage.getItem('triggerKeywords').then((stored) => {
      if (stored) {
        try {
          setTriggerKeywords(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored keywords:", e);
        }
      }
    });
  }, []);

  // Monitor speech recognition for trigger keywords
  useEffect(() => {
    if (!isVoiceMode || !isRecognizing) return;

    // Combine segments and interim transcript for full text
    const fullText = [
      ...segments.map(s => s.text),
      interimTranscript
    ].join(' ').toLowerCase();

    // Check for trigger keywords
    const triggered = triggerKeywords.some(keyword => 
      fullText.includes(keyword.toLowerCase())
    );

    if (triggered && fullText.trim().length > 0) {
      // Remove trigger keyword from text
      let cleanedText = fullText;
      triggerKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        cleanedText = cleanedText.replace(regex, '').trim();
      });

      if (cleanedText.length > 0) {
        setInputText(cleanedText);
        stopRecognition();
        setIsVoiceMode(false);
        // Auto-send the message
        setTimeout(() => sendMessage(cleanedText), 100);
      }
    } else if (fullText.trim().length > 0) {
      // Update input text with current transcript
      setInputText(fullText.trim());
    }
  }, [segments, interimTranscript, isVoiceMode, isRecognizing, triggerKeywords]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      setPushToken(token);
      if (token) {
        try {
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
        } catch (error) {
          console.error("Failed to save push token:", error);
        }
      }
    });

    // Handle prefilled text
    if (prefillText && typeof prefillText === "string") {
      setInputText(prefillText);
    }
  }, [prefillText]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    setConversationState("sending");

    try {
      const messageId = id();
      const conversationId = id();

      await db.transact([
        db.tx.messages[messageId].update({
          conversationId,
          role: "user",
          content: textToSend,
          timestamp: Date.now(),
          status: "pending",
        }),
      ]);

      setInputText("");
      setConversationState("waiting_for_response");
      setTextInputHeight(56);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
      setConversationState("error");
      Alert.alert("Error", "Failed to send message");
    }
  };

  const toggleVoiceMode = async () => {
    if (isVoiceMode) {
      stopRecognition();
      setIsVoiceMode(false);
      setConversationState("idle");
    } else {
      Keyboard.dismiss();
      setIsVoiceMode(true);
      setConversationState("voice_recording");
      startRecognition();
    }
  };

  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(event.nativeEvent.contentSize.height + 20, maxInputHeight);
    setTextInputHeight(Math.max(56, newHeight));
  };

  // Monitor for streaming messages
  useEffect(() => {
    const streamingMessages = messagesArray.filter((m: any) => m.isStreaming);
    if (streamingMessages.length > 0) {
      setConversationState("responding");
    } else if (conversationState === "responding") {
      setConversationState("idle");
    }
  }, [messagesArray]);

  // Render message content
  const renderMessageContent = (message: any) => {
    if (message.isStreaming && message.streamChunks) {
      return message.streamChunks.join('');
    }
    return message.finalContent || message.content;
  };

  // Sort messages by timestamp
  const sortedMessages = [...messagesArray]
    .sort((a: any, b: any) => a.timestamp - b.timestamp);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter} />
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {sortedMessages.map((message: any) => (
            <View key={message.id}>
              {/* User Message */}
              {message.role === "user" && (
                <View style={styles.userMessageContainer}>
                  <View style={styles.userMessage}>
                    <Text style={styles.userMessageText}>
                      {renderMessageContent(message)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Assistant Message */}
              {message.role === "assistant" && (
                <View style={styles.assistantMessageContainer}>
                  {showThoughts && (
                    <TouchableOpacity 
                      style={styles.thoughtsHeader}
                      onPress={() => setShowThoughts(!showThoughts)}
                    >
                      <Text style={styles.thoughtsLabel}>Thoughts</Text>
                      <Text style={styles.thoughtsToggle}>›</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.assistantMessage}>
                    <Text style={styles.assistantMessageText}>
                      {renderMessageContent(message)}
                    </Text>
                    {message.isStreaming && (
                      <ActivityIndicator size="small" color="#666" style={styles.streamingIndicator} />
                    )}
                  </View>
                  {message.timestamp && !message.isStreaming && (
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}

          {/* Empty state */}
          {sortedMessages.length === 0 && !messagesLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Start a conversation by typing or speaking
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            {/* Text Input */}
            <TextInput
              style={[styles.textInput, { height: textInputHeight }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isVoiceMode ? "Listening... Say a trigger word to send" : "Message"}
              placeholderTextColor="#999"
              multiline
              maxLength={2000}
              onContentSizeChange={handleContentSizeChange}
              scrollEnabled={textInputHeight >= 100}
              editable={!isVoiceMode}
            />

            {/* Voice/Send Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                isVoiceMode && styles.recordingButton
              ]}
              onPress={isVoiceMode ? toggleVoiceMode : (inputText.trim() ? () => sendMessage() : toggleVoiceMode)}
            >
              <Text style={styles.actionButtonIcon}>
                {isVoiceMode ? '⏹' : (inputText.trim() ? '↑' : '🎙')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voice indicator */}
          {isVoiceMode && isRecognizing && (
            <View style={styles.voiceIndicator}>
              <View style={styles.voiceWave}>
                {[...Array(20)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.voiceBar,
                      {
                        height: 4 + Math.random() * (volumeLevel + 5),
                        opacity: 0.3 + (i / 20) * 0.7,
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerCenter: {
    flex: 1,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 20,
    color: '#000',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  userMessageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  thoughtsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  thoughtsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  thoughtsToggle: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
    transform: [{ rotate: '90deg' }],
  },
  assistantMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  assistantMessageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
  streamingIndicator: {
    marginTop: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    paddingRight: 8,
    maxHeight: 200,
    minHeight: 40,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonIcon: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  voiceIndicator: {
    marginTop: 8,
    paddingVertical: 8,
  },
  voiceWave: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  voiceBar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});