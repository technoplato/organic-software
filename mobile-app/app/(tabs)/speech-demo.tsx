import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from "react-native";
import {
  useEnhancedSpeechRecognition,
  type TranscriptSegment,
  RecognitionStopReason,
  type RecognitionStopReasonType,
} from "../../lib/enhanced-speech-recognition";
import { checkSpeechRecognitionAvailability } from "../../lib/speech-recognition";
import { useStyles } from "../../lib/useStyles";

// Timer Display Component
function TimerDisplay({
  formattedTime,
  isRecording,
  segmentCount,
  styles,
}: {
  formattedTime: string;
  isRecording: boolean;
  segmentCount: number;
  styles: any;
}) {
  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formattedTime}</Text>
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
  currentFormattedTime,
  styles,
}: {
  segments: TranscriptSegment[];
  interimText: string;
  currentFormattedTime: string;
  styles: any;
}) {
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Auto-scroll to bottom when new content is added
  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [segments, interimText]);

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
            <Text style={styles.segmentTime}>{segment.formattedTimestamp}</Text>
            {!segment.isFinal && <Text style={styles.segmentBadge}>Auto</Text>}
          </View>
          <Text style={styles.segmentText}>{segment.text}</Text>
        </View>
      ))}

      {interimText && (
        <View style={[styles.segment, styles.interimSegment]}>
          <Text style={styles.segmentTime}>{currentFormattedTime}</Text>
          <Text style={[styles.segmentText, styles.interimText]}>
            {interimText}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Volume Meter Component
function VolumeMeter({
  normalizedLevel,
  styles,
  palette,
}: {
  normalizedLevel: number;
  styles: any;
  palette: any;
}) {
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
                  ? palette.error
                  : normalizedLevel > 0.4
                    ? palette.warning
                    : palette.success,
            },
          ]}
        />
      </View>
      <Text style={styles.volumeLabel}>Volume</Text>
    </View>
  );
}

export default function EnhancedSpeechDemo() {
  const { styles: globalStyles, palette, isDark } = useStyles();

  const {
    state,
    segments,
    interimTranscript,
    isRecognizing,
    error,
    recordingUri,
    elapsedSeconds,
    formattedElapsedTime,
    normalizedVolumeLevel,
    isAvailable,
    start,
    stop,
    abort,
    reset,
    exportTranscript,
  } = useEnhancedSpeechRecognition({
    onNewResult: ({ deltaText, isInterim }) => {
      // Optional: Log new words as they come in
      console.log(
        `[SpeechDemo] New ${isInterim ? "interim" : "final"} text: "${deltaText}"`
      );
    },
    onError: (error) => {
      console.error(`[SpeechDemo] Error: ${error.code} - ${error.message}`);
    },
    onSpeechRecognitionStopped: (reason) => {
      console.log(`[SpeechDemo] Speech recognition stopped. Reason: ${reason}`);

      // You can handle different stop reasons here
      switch (reason) {
        case RecognitionStopReason.USER_STOPPED:
          console.log("[SpeechDemo] User manually stopped recognition");
          break;
        case RecognitionStopReason.USER_ABORTED:
          console.log("[SpeechDemo] User aborted recognition");
          break;
        case RecognitionStopReason.ERROR:
          console.log("[SpeechDemo] Recognition stopped due to error");
          break;
        case RecognitionStopReason.SILENCE_TIMEOUT:
          console.log(
            "[SpeechDemo] Recognition stopped due to silence timeout"
          );
          break;
        case RecognitionStopReason.NATURAL_END:
          console.log("[SpeechDemo] Recognition ended naturally");
          break;
        case RecognitionStopReason.NETWORK_FAILURE:
          console.log(
            "[SpeechDemo] Recognition stopped due to network failure"
          );
          break;
        case RecognitionStopReason.PERMISSION_LOST:
          console.log(
            "[SpeechDemo] Recognition stopped due to permission issues"
          );
          break;
        default:
          console.log("[SpeechDemo] Recognition stopped for unknown reason");
      }
    },
  });

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

  // Format current time for interim transcript
  const currentFormattedTime = React.useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return seconds.toString();
  }, [elapsedSeconds]);

  // Create local styles that use the palette
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: palette.background,
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
          color: palette.textPrimary,
          marginBottom: 5,
        },
        subtitle: {
          fontSize: 16,
          color: palette.textSecondary,
        },
        section: {
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: palette.textPrimary,
          marginBottom: 12,
        },

        // Timer styles
        timerContainer: {
          backgroundColor: palette.surface,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderColor: isDark ? palette.border : "transparent",
          borderWidth: isDark ? 1 : 0,
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
          color: palette.textPrimary,
          fontVariant: ["tabular-nums"],
        },
        recordingIndicator: {
          marginLeft: 16,
        },
        recordingDot: {
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: palette.error,
        },
        pulsingDot: {
          // Animation would be added with react-native-reanimated
        },
        segmentCounter: {
          alignItems: "center",
        },
        segmentCountText: {
          fontSize: 16,
          color: palette.textSecondary,
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
          borderBottomColor: palette.border,
        },
        silenceSegment: {
          backgroundColor: isDark ? palette.surfaceAlt1 : "#F9FAFB",
          padding: 10,
          borderRadius: 8,
          borderBottomWidth: 0,
        },
        interimSegment: {
          opacity: 0.7,
        },
        segmentHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 4,
        },
        segmentTime: {
          fontSize: 14,
          color: palette.textSecondary,
          fontWeight: "600",
          fontVariant: ["tabular-nums"],
        },
        segmentBadge: {
          marginLeft: 8,
          fontSize: 11,
          color: isDark ? "#A78BFA" : "#8B5CF6",
          fontWeight: "600",
          backgroundColor: isDark ? "#2E1065" : "#EDE9FE",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
        },
        segmentText: {
          fontSize: 16,
          color: palette.textPrimary,
          lineHeight: 22,
        },
        interimText: {
          fontStyle: "italic",
          color: palette.textSecondary,
        },
        emptyText: {
          fontSize: 16,
          color: palette.textTertiary,
          fontStyle: "italic",
          textAlign: "center",
          paddingVertical: 20,
        },

        // Volume meter styles
        volumeMeter: {
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 15,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 2,
          elevation: 2,
          borderColor: isDark ? palette.border : "transparent",
          borderWidth: isDark ? 1 : 0,
        },
        volumeBarContainer: {
          height: 8,
          backgroundColor: isDark ? "#2A2A2A" : "#E5E7EB",
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
          color: palette.textSecondary,
          textAlign: "center",
        },

        // Status styles
        statusCard: {
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 20,
          borderWidth: 2,
          borderColor: palette.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
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
          color: palette.textPrimary,
        },
        restartInfo: {
          marginLeft: 12,
          fontSize: 14,
          color: palette.textSecondary,
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
          backgroundColor: isDark ? "#7C3AED" : "#8B5CF6",
          marginTop: 10,
          minWidth: "100%",
        },

        // Toggle styles
        toggleContainer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 15,
          marginTop: 15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 2,
          elevation: 2,
          borderColor: isDark ? palette.border : "transparent",
          borderWidth: isDark ? 1 : 0,
        },
        toggleLabel: {
          fontSize: 16,
          color: palette.textPrimary,
          fontWeight: "500",
        },

        // Error styles
        errorCard: {
          backgroundColor: isDark ? "#2D1B1B" : "#FEE2E2",
          borderRadius: 12,
          padding: 15,
          borderWidth: 1,
          borderColor: isDark ? "#5B2C2C" : "#FCA5A5",
        },
        errorText: {
          color: isDark ? "#FCA5A5" : "#991B1B",
          fontSize: 14,
        },

        // Transcript styles
        transcriptCard: {
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 15,
          minHeight: 200,
          maxHeight: 400,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 2,
          elevation: 2,
          borderColor: isDark ? palette.border : "transparent",
          borderWidth: isDark ? 1 : 0,
        },

        // Info styles
        infoCard: {
          backgroundColor: isDark ? "#14532D" : "#F0FDF4",
          borderRadius: 12,
          padding: 15,
          borderWidth: 1,
          borderColor: isDark ? "#166534" : "#86EFAC",
        },
        infoText: {
          fontSize: 14,
          color: isDark ? "#86EFAC" : "#166534",
          lineHeight: 22,
        },
      }),
    [palette, isDark]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Enhanced Speech Demo</Text>
        </View>

        {/* Transcript Segments */}
        <View style={styles.section}>
          <View style={styles.transcriptCard}>
            <SegmentList
              segments={segments}
              interimText={interimTranscript}
              currentFormattedTime={currentFormattedTime}
              styles={styles}
            />
          </View>
        </View>

        {/* Timer Display */}
        <TimerDisplay
          formattedTime={formattedElapsedTime}
          isRecording={isRecognizing}
          segmentCount={segments.length}
          styles={styles}
        />

        {/* Volume Meter */}
        {isRecognizing && (
          <VolumeMeter
            normalizedLevel={normalizedVolumeLevel}
            styles={styles}
            palette={palette}
          />
        )}

        {/* Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[
                styles.button,
                isRecognizing && styles.buttonDisabled,
                { backgroundColor: palette.success },
              ]}
              onPress={start}
              disabled={isRecognizing || !isAvailable}
            >
              <Text style={styles.buttonText}>
                {!isAvailable ? "Unavailable" : "Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                !isRecognizing && styles.buttonDisabled,
                { backgroundColor: palette.warning },
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
                { backgroundColor: palette.error },
              ]}
              onPress={abort}
              disabled={!isRecognizing}
            >
              <Text style={styles.buttonText}>Abort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: palette.textSecondary },
              ]}
              onPress={reset}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
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
      </ScrollView>
    </SafeAreaView>
  );
}
