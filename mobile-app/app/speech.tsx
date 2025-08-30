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
} from "react-native";
import { useRouter } from "expo-router";
import { useSpeechRecognition, RecognitionState, checkSpeechRecognitionAvailability } from "../lib/speech-recognition";

export default function SpeechScreen() {
  const router = useRouter();
  const {
    state,
    transcript,
    interimTranscript,
    isRecognizing,
    error,
    recordingUri,
    start,
    stop,
    abort,
    reset,
  } = useSpeechRecognition();

  const [capabilities, setCapabilities] = useState<{
    isAvailable: boolean;
    supportsOnDevice: boolean;
    supportsRecording: boolean;
  } | null>(null);

  useEffect(() => {
    // Check capabilities on mount
    checkSpeechRecognitionAvailability().then(setCapabilities);
  }, []);

  const handleStart = async () => {
    if (!capabilities?.isAvailable) {
      Alert.alert(
        "Speech Recognition Unavailable",
        "Speech recognition is not available on this device. Please enable Siri & Dictation in Settings."
      );
      return;
    }
    await start();
  };

  const getStateColor = () => {
    switch (state) {
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

  const getStateEmoji = () => {
    switch (state) {
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

  const copyToConversations = () => {
    if (transcript) {
      // Navigate to conversations with the transcript
      router.push({
        pathname: '/conversations',
        params: { prefillText: transcript }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Speech Recognition</Text>
          <Text style={styles.subtitle}>Voice input and transcription</Text>
          
          {/* Navigation to Enhanced Demo */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#8B5CF6", marginTop: 15 }]}
            onPress={() => router.push("/speech-demo")}
          >
            <Text style={styles.buttonText}>✨ Try Enhanced Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Capabilities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Capabilities</Text>
          {capabilities ? (
            <View style={styles.capabilitiesGrid}>
              <View style={styles.capability}>
                <Text style={styles.capabilityLabel}>Available</Text>
                <Text style={styles.capabilityValue}>
                  {capabilities.isAvailable ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.capability}>
                <Text style={styles.capabilityLabel}>On-Device</Text>
                <Text style={styles.capabilityValue}>
                  {capabilities.supportsOnDevice ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.capability}>
                <Text style={styles.capabilityLabel}>Recording</Text>
                <Text style={styles.capabilityValue}>
                  {capabilities.supportsRecording ? "✅" : "❌"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Checking capabilities...</Text>
            </View>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recognition Status</Text>
          <View style={[styles.statusCard, { borderColor: getStateColor() }]}>
            <Text style={styles.statusEmoji}>{getStateEmoji()}</Text>
            <Text style={[styles.statusText, { color: getStateColor() }]}>
              {state.toUpperCase()}
            </Text>
            {isRecognizing && (
              <View style={styles.pulsingDot}>
                <View style={[styles.dot, { backgroundColor: getStateColor() }]} />
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
              onPress={handleStart}
              disabled={isRecognizing}
            >
              <Text style={styles.buttonText}>🎙️ Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                !isRecognizing && styles.buttonDisabled,
                { backgroundColor: "#F59E0B" },
              ]}
              onPress={stop}
              disabled={!isRecognizing}
            >
              <Text style={styles.buttonText}>⏸️ Stop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                !isRecognizing && styles.buttonDisabled,
                { backgroundColor: "#EF4444" },
              ]}
              onPress={abort}
              disabled={!isRecognizing}
            >
              <Text style={styles.buttonText}>🛑 Abort</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#6B7280" },
              ]}
              onPress={reset}
            >
              <Text style={styles.buttonText}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Section */}
        {error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error</Text>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
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
                  <View style={styles.transcriptSection}>
                    <Text style={styles.transcriptLabel}>Final:</Text>
                    <Text style={styles.transcriptText}>{transcript}</Text>
                  </View>
                )}
                {interimTranscript && (
                  <View style={styles.transcriptSection}>
                    <Text style={styles.interimLabel}>Live:</Text>
                    <Text style={styles.interimText}>{interimTranscript}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderIcon}>
                  {isRecognizing ? "🎙️" : "💭"}
                </Text>
                <Text style={styles.placeholderText}>
                  {isRecognizing ? "Listening..." : "Press Start to begin transcription"}
                </Text>
              </View>
            )}
          </View>
          
          {/* Transcript Actions */}
          {transcript && (
            <View style={styles.transcriptActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
                onPress={copyToConversations}
              >
                <Text style={styles.actionButtonText}>💬 Send to Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                onPress={() => {
                  // Copy to clipboard functionality could be added here
                  Alert.alert("Copied!", "Transcript copied to clipboard");
                }}
              >
                <Text style={styles.actionButtonText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recording Info */}
        {recordingUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recording Saved</Text>
            <View style={styles.recordingCard}>
              <Text style={styles.recordingIcon}>📁</Text>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingText}>Audio file saved</Text>
                <Text style={styles.recordingPath} numberOfLines={2}>
                  {recordingUri}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔴</Text>
              <Text style={styles.featureLabel}>Live Transcription</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>♾️</Text>
              <Text style={styles.featureLabel}>Continuous Mode</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🌐</Text>
              <Text style={styles.featureLabel}>Network-Based</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>💾</Text>
              <Text style={styles.featureLabel}>Audio Recording</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureLabel}>Dictation Mode</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎧</Text>
              <Text style={styles.featureLabel}>Background Audio</Text>
            </View>
          </View>
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#6B7280",
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
  statusCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
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
  statusEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "600",
  },
  pulsingDot: {
    marginLeft: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    flexDirection: "row",
    alignItems: "flex-start",
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 14,
    flex: 1,
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
  transcriptSection: {
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  transcriptText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
  interimLabel: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  interimText: {
    fontSize: 16,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 24,
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
  },
  transcriptActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  recordingCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#86EFAC",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recordingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
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
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  feature: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    minWidth: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  featureLabel: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
});