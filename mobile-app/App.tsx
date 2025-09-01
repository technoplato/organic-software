import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  useColorScheme,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { init, tx, id } from "@instantdb/react-native";

// InstantDB configuration
const db = init({
  appId:
    process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
    "fb7ff756-0a99-4d0c-81f7-71a0abee071f",
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

type ConversationState =
  | "idle"
  | "sending"
  | "waiting_for_claude"
  | "claude_responding"
  | "error";

type Screen = "conversations" | "issues" | "hello";

interface Issue {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Done";
}

export default function App() {
  const colorScheme = useColorScheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>("conversations");
  const [inputText, setInputText] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const styles = getStyles(colorScheme);

  const flatListRef = useRef<FlatList>(null);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;
  const lastMessageCount = useRef(0);

  // Issues data from the project
  const issues: Issue[] = [
    {
      title: "Expo Notifications",
      description:
        "Add expo notifications for when messages are completed processing by Claude",
      priority: "High",
      status: "Todo",
    },
    {
      title: "Claude Session Persistence",
      description:
        "Add ability for Claude to maintain its session across app restarts",
      priority: "High",
      status: "Todo",
    },
    {
      title: "UI/UX Improvements",
      description:
        "Improve layout, orientation handling, and styling to make the app much easier and nicer to use",
      priority: "High",
      status: "Todo",
    },
    {
      title: "MCP Server Integration",
      description: "Enable Claude to use our MCP servers from the mobile app",
      priority: "Medium",
      status: "Todo",
    },
    {
      title: "Hands-free Mode",
      description:
        "Add hands-free version that works without popping up the keyboard",
      priority: "Medium",
      status: "Todo",
    },
    {
      title: "Issues Database",
      description: "Create instant DB issues table viewable from the app",
      priority: "Low",
      status: "Todo",
    },
  ];

  // Query conversations, messages, and issues from InstantDB
  const { data, isLoading, error } = db.useQuery({
    conversations: {},
    messages: currentConversationId
      ? {
          $: {
            where: {
              conversationId: currentConversationId,
            },
          },
        }
      : {},
    issues: {},
  });

  const conversations = data?.conversations || [];
  const messages = data?.messages || [];
  const dbIssues = data?.issues || [];

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
  );

  // Track conversation state based on message statuses
  useEffect(() => {
    if (!currentConversationId || messages.length === 0) {
      setConversationState("idle");
      return;
    }

    const lastMessage = sortedMessages[sortedMessages.length - 1];

    if (lastMessage) {
      if (lastMessage.status === "pending") {
        setConversationState("sending");
      } else if (lastMessage.status === "processing") {
        setConversationState("waiting_for_claude");
      } else if (lastMessage.status === "error") {
        setConversationState("error");
      } else if (
        lastMessage.role === "user" &&
        lastMessage.status === "completed"
      ) {
        // User message completed, likely waiting for Claude
        const hasAssistantResponse = sortedMessages.some(
          (m) => m.role === "assistant" && m.timestamp > lastMessage.timestamp,
        );
        if (!hasAssistantResponse) {
          setConversationState("claude_responding");
        } else {
          setConversationState("idle");
        }
      } else {
        setConversationState("idle");
      }
    }
  }, [messages, currentConversationId, sortedMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCount.current && autoScroll) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    lastMessageCount.current = messages.length;
  }, [messages.length, autoScroll]);

  // Handle scroll position for showing/hiding scroll button
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom =
      contentOffset.y >= contentSize.height - layoutMeasurement.height - 100;

    if (!isNearBottom && !showScrollButton) {
      setShowScrollButton(true);
      setAutoScroll(false);
      Animated.timing(scrollButtonOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (isNearBottom && showScrollButton) {
      setShowScrollButton(false);
      setAutoScroll(true);
      Animated.timing(scrollButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setAutoScroll(true);
  };

  const createConversation = async () => {
    const newConversation = {
      id: id(),
      userId: "mobile-user",
      title: `Conversation ${new Date().toLocaleString()}`,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.transact([
      tx.conversations[newConversation.id].update(newConversation),
    ]);

    setCurrentConversationId(newConversation.id);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentConversationId) return;

    const newMessage = {
      id: id(),
      conversationId: currentConversationId,
      role: "user" as const,
      content: inputText.trim(),
      timestamp: Date.now(),
      status: "pending" as const,
    };

    await db.transact([tx.messages[newMessage.id].update(newMessage)]);

    setInputText("");

    // Auto-scroll to the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const createIssue = async (
    title: string,
    description: string,
    priority: "High" | "Medium" | "Low" = "Medium",
  ) => {
    const newIssue = {
      id: id(),
      title,
      description,
      priority,
      status: "Todo" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.transact([tx.issues[newIssue.id].update(newIssue)]);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "processing":
        return "⚙️";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return "";
    }
  };

  const getConversationStatusText = () => {
    switch (conversationState) {
      case "sending":
        return "Sending message...";
      case "waiting_for_claude":
        return "Claude is reading...";
      case "claude_responding":
        return "Claude is typing...";
      case "error":
        return "Error occurred";
      default:
        return null;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === "user"
          ? styles.userMessage
          : item.role === "assistant"
            ? styles.assistantMessage
            : styles.systemMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={styles.messageRole}>
          {item.role === "user"
            ? "👤"
            : item.role === "assistant"
              ? "🤖"
              : "⚙️"}{" "}
          {item.role.toUpperCase()}
        </Text>
        {item.status && (
          <Text style={styles.messageStatus}>{getStatusIcon(item.status)}</Text>
        )}
      </View>
      <Text style={styles.messageContent}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        currentConversationId === item.id && styles.activeConversation,
      ]}
      onPress={() => setCurrentConversationId(item.id)}
    >
      <Text style={styles.conversationTitle}>{item.title}</Text>
      <Text style={styles.conversationDate}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
      </Text>
      {item.claudeSessionId && <Text style={styles.sessionIndicator}>🔄</Text>}
    </TouchableOpacity>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "#FF6B6B";
      case "Medium":
        return "#FFD93D";
      case "Low":
        return "#6BCF7F";
      default:
        return "#999";
    }
  };

  const renderIssue = ({ item }: { item: Issue }) => (
    <View style={styles.issueContainer}>
      <View style={styles.issueHeader}>
        <Text style={styles.issueTitle}>{item.title}</Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      <Text style={styles.issueDescription}>{item.description}</Text>
      <View style={styles.issueFooter}>
        {/* <Text style={[styles.statusBadge, styles[`status${item.status.replace(' ', '')}`]}> */}
        <Text>{item.status}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>
          Error loading data: {error.message}
        </Text>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Text style={styles.title}>Claude Code Remote Control</Text>

        {/* Navigation Header */}
        {currentScreen === "conversations" && (
          <View style={styles.conversationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conversations</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.createButton, styles.helloButton]}
                  onPress={() => setCurrentScreen("hello")}
                >
                  <Text style={styles.createButtonText}>Hello</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={createConversation}
                >
                  <Text style={styles.createButtonText}>+ New</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.conversationsList}
            />
          </View>
        )}

        {/* Hello Screen */}
        {currentScreen === "hello" && (
          <View style={styles.helloScreen}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen("conversations")}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Hello Screen</Text>
              <View />
            </View>
            <View style={styles.helloContent}>
              <Text style={styles.helloText}>Hello!</Text>
            </View>
          </View>
        )}

        {/* Status Indicator */}
        {currentScreen === "conversations" && conversationState !== "idle" && (
          <View style={styles.statusBar}>
            <ActivityIndicator size="small" color="#FF6B35" />
            <Text style={styles.statusText}>{getConversationStatusText()}</Text>
          </View>
        )}

        {/* Messages List */}
        {currentScreen === "conversations" && currentConversationId && (
          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <FlatList
              ref={flatListRef}
              data={sortedMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (autoScroll) {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />

            {/* Floating Scroll to Bottom Button */}
            <Animated.View
              style={[
                styles.scrollToBottomButton,
                { opacity: scrollButtonOpacity },
              ]}
              pointerEvents={showScrollButton ? "auto" : "none"}
            >
              <TouchableOpacity onPress={scrollToBottom}>
                <Text style={styles.scrollButtonText}>⬇️</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Message Input */}
        {currentScreen === "conversations" && currentConversationId && (
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              multiline
              editable={conversationState !== "sending"}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || conversationState === "sending") &&
                  styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || conversationState === "sending"}
            >
              <Text style={styles.sendButtonText}>
                {conversationState === "sending" ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentScreen === "conversations" &&
          !currentConversationId &&
          conversations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No conversations yet.</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={createConversation}
              >
                <Text style={styles.createButtonText}>
                  Create First Conversation
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </KeyboardAvoidingView>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </SafeAreaView>
  );
}

const getStyles = (scheme: "light" | "dark" | null | undefined) => {
  const isDark = scheme === "dark";
  const palette = {
    background: isDark ? "#121212" : "#FF69B4",
    surface: isDark ? "#1E1E1E" : "#FFFFFF",
    surfaceAlt1: isDark ? "#23201D" : "#FFF0E6",
    surfaceAlt2: isDark ? "#201F23" : "#F3E5F5",
    surfaceAlt3: isDark ? "#23221C" : "#FFF3CD",
    textPrimary: isDark ? "#EDEDED" : "#333333",
    textSecondary: isDark ? "#B0B0B0" : "#666666",
    textTertiary: isDark ? "#9A9A9A" : "#999999",
    border: isDark ? "#2A2A2A" : "#DDDDDD",
    statusBg: isDark ? "#26211E" : "#FFF0E6",
    statusText: "#FF6B35",
    accent: "#FF6B35",
    disabled: isDark ? "#555555" : "#CCCCCC",
  } as const;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    keyboardAvoid: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      color: palette.textSecondary,
    },
    errorText: {
      color: "#FF5A5A",
      textAlign: "center",
      margin: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: palette.textPrimary,
    },
    conversationsSection: {
      marginBottom: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    createButton: {
      backgroundColor: palette.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    createButtonText: {
      color: "white",
      fontWeight: "600",
    },
    conversationsList: {
      maxHeight: 80,
    },
    conversationItem: {
      backgroundColor: palette.surface,
      padding: 12,
      marginRight: 10,
      borderRadius: 8,
      minWidth: 120,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
      position: "relative",
      borderColor: isDark ? "#2A2A2A" : "transparent",
      borderWidth: isDark ? 1 : 0,
    },
    activeConversation: {
      backgroundColor: palette.surfaceAlt1,
      borderColor: palette.accent,
      borderWidth: 2,
    },
    conversationTitle: {
      fontWeight: "600",
      color: palette.textPrimary,
      fontSize: 12,
    },
    conversationDate: {
      fontSize: 10,
      color: palette.textSecondary,
      marginTop: 4,
    },
    sessionIndicator: {
      position: "absolute",
      top: 5,
      right: 5,
      fontSize: 12,
    },
    statusBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: palette.statusBg,
      padding: 8,
      borderRadius: 6,
      marginBottom: 10,
    },
    statusText: {
      marginLeft: 8,
      color: palette.statusText,
      fontStyle: "italic",
    },
    messagesSection: {
      flex: 1,
      marginBottom: 10,
      position: "relative",
    },
    messagesList: {
      flex: 1,
    },
    messageContainer: {
      backgroundColor: palette.surface,
      padding: 12,
      marginVertical: 4,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    messageHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    userMessage: {
      backgroundColor: palette.surfaceAlt1,
      marginLeft: 20,
    },
    assistantMessage: {
      backgroundColor: palette.surfaceAlt2,
      marginRight: 20,
    },
    systemMessage: {
      backgroundColor: palette.surfaceAlt3,
    },
    messageRole: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.textSecondary,
    },
    messageStatus: {
      fontSize: 12,
      color: palette.textSecondary,
    },
    messageContent: {
      fontSize: 16,
      color: palette.textPrimary,
      marginBottom: 4,
    },
    messageTime: {
      fontSize: 10,
      color: palette.textTertiary,
      textAlign: "right",
    },
    scrollToBottomButton: {
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor: palette.accent,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    scrollButtonText: {
      fontSize: 20,
    },
    inputSection: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: palette.surface,
      padding: 12,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 6,
      padding: 10,
      marginRight: 10,
      maxHeight: 100,
      color: palette.textPrimary,
    },
    sendButton: {
      backgroundColor: palette.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 6,
    },
    sendButtonDisabled: {
      backgroundColor: palette.disabled,
    },
    sendButtonText: {
      color: "white",
      fontWeight: "600",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 16,
      color: palette.textSecondary,
      marginBottom: 20,
    },
    buttonGroup: {
      flexDirection: "row",
      gap: 8,
    },
    helloButton: {
      backgroundColor: "#28a745",
    },
    backButton: {
      backgroundColor: "#6c757d",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    backButtonText: {
      color: "white",
      fontWeight: "600",
    },
    helloScreen: {
      flex: 1,
    },
    helloContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    helloText: {
      fontSize: 48,
      fontWeight: "bold",
      color: palette.textPrimary,
    },
  });
};
