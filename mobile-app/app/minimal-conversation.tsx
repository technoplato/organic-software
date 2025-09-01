import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
// import { BlurView } from "expo-blur";
// Using InstantDB instead of AsyncStorage
import { init, id } from "@instantdb/react-native";
import {
  useEnhancedSpeechRecognition,
  RecognitionState,
} from "../lib/enhanced-speech-recognition";

// InstantDB configuration
const db = init({
  appId:
    process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
    "fb7ff756-0a99-4d0c-81f7-71a0abee071f",
});

// Display modes
enum DisplayMode {
  TRANSCRIPTION = "transcription",
  CONVERSATION = "conversation",
  HYBRID = "hybrid",
}

// Voice command actions
enum CommandAction {
  TEXT_SIZE_INCREASE = "TEXT_SIZE_INCREASE",
  TEXT_SIZE_DECREASE = "TEXT_SIZE_DECREASE",
  SEND_MESSAGE = "SEND_MESSAGE",
  CLEAR_CONVERSATION = "CLEAR_CONVERSATION",
  SHOW_SETTINGS = "SHOW_SETTINGS",
  HIDE_SETTINGS = "HIDE_SETTINGS",
  MODE_CONVERSATION = "MODE_CONVERSATION",
  MODE_TRANSCRIPTION = "MODE_TRANSCRIPTION",
  MODE_HYBRID = "MODE_HYBRID",
  START_LISTENING = "START_LISTENING",
  STOP_LISTENING = "STOP_LISTENING",
  TOGGLE_AUTO_RESTART = "TOGGLE_AUTO_RESTART",
}

// Voice commands configuration
const VOICE_COMMANDS = [
  {
    triggers: ["increase text", "make text larger", "bigger text", "zoom in"],
    action: CommandAction.TEXT_SIZE_INCREASE,
  },
  {
    triggers: [
      "decrease text",
      "make text smaller",
      "smaller text",
      "zoom out",
    ],
    action: CommandAction.TEXT_SIZE_DECREASE,
  },
  {
    triggers: ["send message", "send to claude", "send it", "submit"],
    action: CommandAction.SEND_MESSAGE,
  },
  {
    triggers: ["clear screen", "start over", "new conversation", "reset"],
    action: CommandAction.CLEAR_CONVERSATION,
  },
  {
    triggers: ["show settings", "open settings", "settings"],
    action: CommandAction.SHOW_SETTINGS,
  },
  {
    triggers: ["hide settings", "close settings", "dismiss settings"],
    action: CommandAction.HIDE_SETTINGS,
  },
  {
    triggers: ["conversation mode", "show chat", "chat view"],
    action: CommandAction.MODE_CONVERSATION,
  },
  {
    triggers: ["transcription mode", "show transcript", "transcript view"],
    action: CommandAction.MODE_TRANSCRIPTION,
  },
  {
    triggers: ["hybrid mode", "split view", "show both"],
    action: CommandAction.MODE_HYBRID,
  },
  {
    triggers: ["start listening", "listen", "start recording"],
    action: CommandAction.START_LISTENING,
  },
  {
    triggers: ["stop listening", "stop", "pause recording"],
    action: CommandAction.STOP_LISTENING,
  },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  conversationId?: string;
  isStreaming?: boolean;
}

interface UserSetting {
  id?: string;
  textSize?: number;
  lineSpacing?: number;
  displayMode?: string;
  createdAt?: number;
  updatedAt?: number;
}

export default function MinimalConversationScreen() {
  const router = useRouter();
  const navigation = useRouter();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // State
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.TRANSCRIPTION
  );
  const [textSize, setTextSize] = useState(24);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const settingsSlideAnim = useRef(new Animated.Value(screenHeight)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const lastProcessedCommandRef = useRef<string>("");

  // Speech recognition
  const {
    state: speechState,
    segments,
    interimTranscript,
    isRecognizing,
    error: speechError,
    volumeLevel,
    elapsedSeconds,
    sessionStartTime,
    autoRestart,
    restartAttempts,
    start: startRecognition,
    stop: stopRecognition,
    reset: resetRecognition,
    toggleAutoRestart,
  } = useEnhancedSpeechRecognition();

  // InstantDB queries for settings
  const { data: settingsData } = db.useQuery({
    userSettings: {},
  });
  
  // Extract settings from InstantDB
  const userSettings = (settingsData?.userSettings?.[0] || {}) as UserSetting;
  
  // Track if we've already started recognition
  const hasStartedRef = useRef(false);

  // Load settings from InstantDB
  useEffect(() => {
    // Only log when settings actually change
    if (Object.keys(userSettings).length > 0) {
      console.log("[MinimalConversation] Loading settings:", userSettings);
      
      if (userSettings.textSize) setTextSize(userSettings.textSize);
      if (userSettings.lineSpacing) setLineSpacing(userSettings.lineSpacing);
      if (userSettings.displayMode) setDisplayMode(userSettings.displayMode as DisplayMode);
    }
    
    // Start listening automatically, but only once
    if (!hasStartedRef.current) {
      console.log("[MinimalConversation] Starting initial recognition");
      startRecognition();
      hasStartedRef.current = true;
    }
  }, [userSettings]);
  
  const saveSettings = async () => {
    try {
      const settingsId = userSettings.id || id();
      console.log("[MinimalConversation] Saving settings:", { textSize, lineSpacing, displayMode });
      
      await db.transact([
        db.tx.userSettings[settingsId].update({
          textSize,
          lineSpacing,
          displayMode,
          updatedAt: Date.now(),
          ...(userSettings.id ? {} : { createdAt: Date.now() }),
        }),
      ]);
    } catch (error) {
      console.error("[MinimalConversation] Failed to save settings:", error);
    }
  };

  // Process voice commands from the latest text
  useEffect(() => {
    if (!isRecognizing) return;
    
    // Check voice commands only on the latest text (interim or last segment)
    const latestText = interimTranscript || (segments.length > 0 ? segments[segments.length - 1].text : "");
    
    if (latestText) {
      // Check for voice commands (use lowercase for case-insensitive matching)
      detectAndExecuteCommand(latestText.toLowerCase());
    }
  }, [segments, interimTranscript, isRecognizing]);

  const detectAndExecuteCommand = (text: string) => {
    // Avoid processing the same command multiple times
    if (text === lastProcessedCommandRef.current) return;
    
    for (const command of VOICE_COMMANDS) {
      for (const trigger of command.triggers) {
        if (text.includes(trigger)) {
          console.log(`[MinimalConversation] Command detected: "${trigger}" -> ${command.action}`);
          
          lastProcessedCommandRef.current = text;
          executeCommand(command.action);
          
          // Visual feedback
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
          
          break;
        }
      }
    }
  };

  const executeCommand = (action: CommandAction) => {
    setIsProcessingCommand(true);

    switch (action) {
      case CommandAction.TEXT_SIZE_INCREASE:
        setTextSize((prev) => Math.min(prev + 4, 48));
        break;

      case CommandAction.TEXT_SIZE_DECREASE:
        setTextSize((prev) => Math.max(prev - 4, 16));
        break;

      case CommandAction.SEND_MESSAGE:
        sendMessage();
        break;

      case CommandAction.CLEAR_CONVERSATION:
        setMessages([]);
        resetRecognition();
        break;

      case CommandAction.SHOW_SETTINGS:
        toggleSettings(true);
        break;

      case CommandAction.HIDE_SETTINGS:
        toggleSettings(false);
        break;

      case CommandAction.MODE_CONVERSATION:
        setDisplayMode(DisplayMode.CONVERSATION);
        break;

      case CommandAction.MODE_TRANSCRIPTION:
        setDisplayMode(DisplayMode.TRANSCRIPTION);
        break;

      case CommandAction.MODE_HYBRID:
        setDisplayMode(DisplayMode.HYBRID);
        break;

      case CommandAction.START_LISTENING:
        if (!isRecognizing) startRecognition();
        break;

      case CommandAction.STOP_LISTENING:
        if (isRecognizing) stopRecognition();
        break;
    }

    saveSettings();
    setTimeout(() => setIsProcessingCommand(false), 500);
  };

  const sendMessage = async () => {
    // Combine all segments and interim text for sending
    const fullTranscript = [
      ...segments.map(s => s.text),
      interimTranscript
    ].filter(Boolean).join(" ").trim();
    
    if (!fullTranscript) return;
    
    const messageId = id();
    const conversationId = "minimal-conversation"; // Use consistent conversation ID
    const timestamp = Date.now();
    
    console.log(`[MinimalConversation] Sending message: "${fullTranscript.substring(0, 30)}${fullTranscript.length > 30 ? '...' : ''}"`);
    
    const newMessage: Message = {
      id: messageId,
      role: "user",
      content: fullTranscript,
      timestamp,
      conversationId,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    // Send to InstantDB for Claude processing
    try {
      await db.transact([
        db.tx.messages[messageId].update({
          conversationId,
          role: "user",
          content: fullTranscript,
          timestamp,
          status: "pending",
        }),
      ]);
    } catch (error) {
      console.error("[MinimalConversation] Failed to send message:", error);
    }
    
    // Reset after sending
    resetRecognition();
  };

  const toggleSettings = (show: boolean) => {
    console.log(`[MinimalConversation] ${show ? 'Showing' : 'Hiding'} settings panel`);
    setShowSettings(show);
    Animated.timing(settingsSlideAnim, {
      toValue: show ? 0 : screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Gesture handlers
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Tap anywhere to toggle listening
        if (isRecognizing) {
          console.log("[MinimalConversation] Stopping recognition on tap");
          stopRecognition();
        } else {
          console.log("[MinimalConversation] Starting recognition on tap");
          startRecognition();
        }
      },
    })
  ).current;

  // Render content based on display mode
  const renderContent = () => {
    switch (displayMode) {
      case DisplayMode.TRANSCRIPTION:
        return renderTranscriptionView();
      case DisplayMode.CONVERSATION:
        return renderConversationView();
      case DisplayMode.HYBRID:
        return renderHybridView();
    }
  };

  const renderTranscriptionView = () => {
    const formatTimestamp = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const currentTime = sessionStartTime
      ? Math.floor((Date.now() - sessionStartTime) / 1000)
      : 0;

    return (
      <View style={styles.transcriptionContainer}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.transcriptionContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {segments.length === 0 && !interimTranscript && (
            <Text style={[styles.transcriptionText, { fontSize: textSize, lineHeight: textSize * lineSpacing }]}>
              {isRecognizing ? "Listening..." : "Tap anywhere to start"}
            </Text>
          )}
          
          {/* Display segments */}
          {segments.map((segment) => (
            <View key={segment.id} style={styles.segmentContainer}>
              <Text style={styles.segmentTimestamp}>
                {formatTimestamp(segment.timestamp)}
              </Text>
              <Text
                style={[
                  styles.transcriptionText,
                  {
                    fontSize: textSize,
                    lineHeight: textSize * lineSpacing,
                  },
                ]}
              >
                {segment.text}
              </Text>
            </View>
          ))}
          
          {/* Display interim transcript with current timestamp */}
          {interimTranscript && (
            <View style={styles.segmentContainer}>
              <Text style={styles.segmentTimestamp}>
                {formatTimestamp(currentTime)}
              </Text>
              <Text
                style={[
                  styles.transcriptionText,
                  styles.interimText,
                  {
                    fontSize: textSize,
                    lineHeight: textSize * lineSpacing,
                  },
                ]}
              >
                {interimTranscript}
              </Text>
            </View>
          )}
          
          {/* Error display (only show critical errors) */}
          {speechError && !speechError.includes('no-speech') && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Error: {speechError}
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Done button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            stopRecognition();
            navigation.back();
          }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderConversationView = () => (
    <View style={styles.conversationContainer}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === "user"
                ? styles.userMessage
                : styles.assistantMessage,
            ]}
          >
            <Text style={[styles.messageText, { fontSize: textSize * 0.75 }]}>
              {message.content}
            </Text>
          </View>
        ))}

        {/* Show current recording as interim bubble */}
        {(segments.length > 0 || interimTranscript) && (
          <View style={styles.currentTranscriptBubble}>
            <Text
              style={[
                styles.currentTranscriptText,
                { fontSize: textSize * 0.75 },
              ]}
            >
              {[...segments.map(s => s.text), interimTranscript].filter(Boolean).join(" ")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderHybridView = () => (
    <View style={styles.hybridContainer}>
      <View style={styles.hybridTop}>{renderTranscriptionView()}</View>
      <View style={styles.hybridDivider} />
      <View style={styles.hybridBottom}>{renderConversationView()}</View>
    </View>
  );

  const renderSettings = () => (
    <Animated.View
      style={[
        styles.settingsPanel,
        {
          transform: [{ translateY: settingsSlideAnim }],
        },
      ]}
    >
      {/* <BlurView intensity={95} style={styles.settingsBlur}> */}
      <View style={styles.settingsContent}>
        <Text style={styles.settingsTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Text Size</Text>
          <View style={styles.settingControls}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setTextSize((prev) => Math.max(prev - 2, 16))}
            >
              <Text style={styles.settingButtonText}>A-</Text>
            </TouchableOpacity>
            <Text style={styles.settingValue}>{textSize}</Text>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setTextSize((prev) => Math.min(prev + 2, 48))}
            >
              <Text style={styles.settingButtonText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Line Spacing</Text>
          <View style={styles.settingControls}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setLineSpacing((prev) => Math.max(prev - 0.1, 1))}
            >
              <Text style={styles.settingButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.settingValue}>{lineSpacing.toFixed(1)}</Text>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setLineSpacing((prev) => Math.min(prev + 0.1, 2))}
            >
              <Text style={styles.settingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Display Mode</Text>
          <View style={styles.settingControls}>
            <TouchableOpacity
              style={[
                styles.settingButton,
                displayMode === DisplayMode.TRANSCRIPTION &&
                  styles.settingButtonActive,
              ]}
              onPress={() => setDisplayMode(DisplayMode.TRANSCRIPTION)}
            >
              <Text style={styles.settingButtonText}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingButton,
                displayMode === DisplayMode.CONVERSATION &&
                  styles.settingButtonActive,
              ]}
              onPress={() => setDisplayMode(DisplayMode.CONVERSATION)}
            >
              <Text style={styles.settingButtonText}>C</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingButton,
                displayMode === DisplayMode.HYBRID &&
                  styles.settingButtonActive,
              ]}
              onPress={() => setDisplayMode(DisplayMode.HYBRID)}
            >
              <Text style={styles.settingButtonText}>H</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeSettingsButton}
          onPress={() => toggleSettings(false)}
        >
          <Text style={styles.closeSettingsText}>Close</Text>
        </TouchableOpacity>
      </View>
      {/* </BlurView> */}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Animated.View
        style={[styles.mainContainer, { transform: [{ scale: pulseAnim }] }]}
        {...panResponder.panHandlers}
      >
        {renderContent()}

        {/* Removed recording indicator as requested */}

        {/* Command feedback */}
        {isProcessingCommand && (
          <View style={styles.commandFeedback}>
            <Text style={styles.commandFeedbackText}>✓</Text>
          </View>
        )}
      </Animated.View>

      {showSettings && renderSettings()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
  },

  // Transcription View
  transcriptionContainer: {
    flex: 1,
    padding: 20,
  },
  transcriptionContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  transcriptionText: {
    color: "#000000",
    textAlign: "left",
    fontWeight: "400",
    fontSize: 24, // Default size
    lineHeight: 36, // Default line height
  },
  segmentContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  segmentTimestamp: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    fontVariant: ["tabular-nums"],
  },
  interimText: {
    fontStyle: "italic",
    color: "#6B7280",
  },
  doneButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1000,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  timerText: {
    color: '#666',
    fontSize: 14,
    fontVariant: ['tabular-nums'], // Use monospace numbers for timer
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(244,67,54,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
  },

  // Conversation View
  conversationContainer: {
    flex: 1,
    padding: 20,
  },
  conversationContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#F0F0F0",
    alignSelf: "flex-end",
  },
  assistantMessage: {
    backgroundColor: "#E8F4FD",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#000000",
    lineHeight: 22,
  },
  currentTranscriptBubble: {
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "80%",
    backgroundColor: "#FFF9E6",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#FFE066",
    borderStyle: "dashed",
  },
  currentTranscriptText: {
    color: "#B8860B",
    fontStyle: "italic",
    lineHeight: 22,
  },

  // Hybrid View
  hybridContainer: {
    flex: 1,
  },
  hybridTop: {
    flex: 1,
  },
  hybridDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
  hybridBottom: {
    flex: 1,
  },

  // Settings Panel
  settingsPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  settingsBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 30,
    width: "80%",
    maxWidth: 300,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#000000",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  settingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  settingButtonActive: {
    backgroundColor: "#007AFF",
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  settingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    minWidth: 40,
    textAlign: "center",
  },
  closeSettingsButton: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignSelf: "center",
    marginTop: 20,
  },
  closeSettingsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Command feedback
  commandFeedback: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  commandFeedbackText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
});
