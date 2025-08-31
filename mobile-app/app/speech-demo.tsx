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
  Switch,
  Share,
  Platform,
} from "react-native";
import {
  useEnhancedSpeechRecognition,
  RecognitionState,
  type TranscriptSegment,
} from "../lib/enhanced-speech-recognition";
import { checkSpeechRecognitionAvailability } from "../lib/speech-recognition";

// Timer Display Component
function TimerDisplay({
  elapsedSeconds,
  isRecording,
  segmentCount,
}: {
  elapsedSeconds: number;
  isRecording: boolean;
  segmentCount: number;
}) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{timeStr}</Text>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, styles.pulsingDot]} />
          </View>
        )}
      </View>
      <View style={styles.segmentCounter}>
        <Text style={styles.segmentCountText}>Segments: {segmentCount}</Text>
      </View>
    </View>
  );
}

// Segment List Component
function SegmentList({
  segments,
  interimText,
  currentTime,
}: {
  segments: TranscriptSegment[];
  interimText: string;
  currentTime: number;
}) {
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Auto-scroll to bottom when new content is added
  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [segments, interimText]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.segmentList}
      contentContainerStyle={styles.segmentListContent}
    >
      {segments.length === 0 && !interimText && (
        <Text style={styles.emptyText}>
          Transcript segments will appear here...
        </Text>
      )}

      {segments.map((segment) => (
        <View
          key={segment.id}
          style={[styles.segment, !segment.isFinal && styles.silenceSegment]}
        >
          <View style={styles.segmentHeader}>
            <Text style={styles.segmentTime}>
              {formatTimestamp(segment.timestamp)}
            </Text>
            {!segment.isFinal && <Text style={styles.segmentBadge}>Auto</Text>}
          </View>
          <Text style={styles.segmentText}>{segment.text}</Text>
        </View>
      ))}

      {interimText && (
        <View style={[styles.segment, styles.interimSegment]}>
          <Text style={styles.segmentTime}>{formatTimestamp(currentTime)}</Text>
          <Text style={[styles.segmentText, styles.interimText]}>
            {interimText}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Volume Meter Component
function VolumeMeter({ level }: { level: number }) {
  const normalizedLevel = Math.max(0, Math.min(10, level + 2)) / 12; // Normalize -2 to 10 => 0 to 1

  return (
    <View style={styles.volumeMeter}>
      <View style={styles.volumeBarContainer}>
        <View
          style={[
            styles.volumeBar,
            {
              width: `${normalizedLevel * 100}%`,
              backgroundColor:
                normalizedLevel > 0.7
                  ? "#EF4444"
                  : normalizedLevel > 0.4
                    ? "#F59E0B"
                    : "#10B981",
            },
          ]}
        />
      </View>
      <Text style={styles.volumeLabel}>Volume</Text>
    </View>
  );
}

export default function EnhancedSpeechDemo() {
  const {
    state,
    segments,
    interimTranscript,
    isRecognizing,
    error,
    recordingUri,
    elapsedSeconds,
    sessionStartTime,
    autoRestart,
    restartAttempts,
    volumeLevel,
    start,
    stop,
    abort,
    reset,
    toggleAutoRestart,
    exportTranscript,
  } = useEnhancedSpeechRecognition();

  const [capabilities, setCapabilities] = useState<{
    isAvailable: boolean;
    supportsOnDevice: boolean;
    supportsRecording: boolean;
  } | null>(null);

  useEffect(() => {
    checkSpeechRecognitionAvailability().then(setCapabilities);
  }, []);

  const handleStart = async () => {
    if (!capabilities?.isAvailable) {
      Alert.alert(
        "Speech Recognition Unavailable",
        "Speech recognition is not available on this device. Please enable Siri & Dictation in Settings.",
      );
      return;
    }
    await start();
  };

  const handleExport = async () => {
    const transcript = exportTranscript();
    try {
      await Share.share({
        message: transcript,
        title: "Speech Recognition Transcript",
      });
    } catch (error) {
      console.error("Error sharing transcript:", error);
    }
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

  const currentTime = sessionStartTime
    ? Math.floor((Date.now() - sessionStartTime) / 1000)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Enhanced Speech Demo</Text>
          <Text style={styles.subtitle}>
            {Platform.OS === "ios" ? "iOS" : "Android"} • Continuous Recording
          </Text>
        </View>

        {/* Timer Display */}
        <TimerDisplay
          elapsedSeconds={elapsedSeconds}
          isRecording={isRecognizing}
          segmentCount={segments.length}
        />

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recognition Status</Text>
          <View style={[styles.statusCard, { borderColor: getStateColor() }]}>
            <Text style={styles.statusEmoji}>{getStateEmoji()}</Text>
            <Text style={[styles.statusText, { color: getStateColor() }]}>
              {state.toUpperCase()}
            </Text>
            {autoRestart && restartAttempts > 0 && (
              <Text style={styles.restartInfo}>
                Restart: {restartAttempts}/5
              </Text>
            )}
          </View>
        </View>

        {/* Volume Meter */}
        {isRecognizing && <VolumeMeter level={volumeLevel} />}

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
              <Text style={styles.buttonText}>Start</Text>
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
              <Text style={styles.buttonText}>Stop</Text>
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
              <Text style={styles.buttonText}>Abort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#6B7280" }]}
              onPress={reset}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Auto-Restart Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Auto-Restart</Text>
            <Switch
              value={autoRestart}
              onValueChange={toggleAutoRestart}
              trackColor={{ false: "#767577", true: "#10B981" }}
              thumbColor={autoRestart ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          {/* Export Button */}
          {segments.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.exportButton]}
              onPress={handleExport}
            >
              <Text style={styles.buttonText}>📤 Export Transcript</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error Section */}
        {error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error</Text>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        {/* Transcript Segments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Transcript Segments ({segments.length})
          </Text>
          <View style={styles.transcriptCard}>
            <SegmentList
              segments={segments}
              interimText={interimTranscript}
              currentTime={currentTime}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • Continuous Mode: ✅{"\n"}• Auto-Restart:{" "}
              {autoRestart ? "✅" : "❌"}
              {"\n"}• Silence Detection: 3 seconds{"\n"}• Extended Timeout:{" "}
              {Platform.OS === "android" ? "30s" : "iOS Default"}
              {"\n"}• Platform:{" "}
              {Platform.OS === "ios" ? "iOS (Siri)" : "Android (Google)"}
              {"\n"}• Recording: {recordingUri ? "✅ Saved" : "⏺️ Active"}
              {"\n"}• Segment Creation: Silence or Final Result
            </Text>
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },

  // Timer styles
  timerContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#111827",
    fontVariant: ["tabular-nums"],
  },
  recordingIndicator: {
    marginLeft: 16,
  },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
  },
  pulsingDot: {
    // Animation would be added with react-native-reanimated
  },
  segmentCounter: {
    alignItems: "center",
  },
  segmentCountText: {
    fontSize: 16,
    color: "#6B7280",
  },

  // Segment list styles
  segmentList: {
    maxHeight: 300,
  },
  segmentListContent: {
    paddingVertical: 10,
  },
  segment: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  silenceSegment: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  interimSegment: {
    borderBottomStyle: "dashed",
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  segmentTime: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  segmentBadge: {
    marginLeft: 8,
    fontSize: 11,
    color: "#8B5CF6",
    fontWeight: "600",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  segmentText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 22,
  },
  interimText: {
    fontStyle: "italic",
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },

  // Volume meter styles
  volumeMeter: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  volumeBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  volumeBar: {
    height: "100%",
    borderRadius: 4,
  },
  volumeLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  // Status styles
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
  restartInfo: {
    marginLeft: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // Button styles
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
  exportButton: {
    backgroundColor: "#8B5CF6",
    marginTop: 10,
    minWidth: "100%",
  },

  // Toggle styles
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },

  // Error styles
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 14,
  },

  // Transcript styles
  transcriptCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    minHeight: 200,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Info styles
  infoCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  infoText: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 22,
  },
});
