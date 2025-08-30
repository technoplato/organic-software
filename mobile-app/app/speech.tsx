import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSpeechRecognition, RecognitionState, checkSpeechRecognitionAvailability } from "../lib/speech-recognition";
import useStyles from "../lib/useStyles";

export default function SpeechScreen() {
  const router = useRouter();
  const { styles, palette } = useStyles();
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
        <View style={[styles.alignCenter, styles.marginBottom]}>
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
          <Text style={styles.sectionSubtitle}>Device Capabilities</Text>
          {capabilities ? (
            <View style={[styles.card, styles.flexRow, { justifyContent: 'space-around' }]}>
              <View style={styles.alignCenter}>
                <Text style={[{ fontSize: 12, color: palette.textSecondary, marginBottom: 5 }]}>
                  Available
                </Text>
                <Text style={{ fontSize: 24 }}>
                  {capabilities.isAvailable ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.alignCenter}>
                <Text style={[{ fontSize: 12, color: palette.textSecondary, marginBottom: 5 }]}>
                  On-Device
                </Text>
                <Text style={{ fontSize: 24 }}>
                  {capabilities.supportsOnDevice ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.alignCenter}>
                <Text style={[{ fontSize: 12, color: palette.textSecondary, marginBottom: 5 }]}>
                  Recording
                </Text>
                <Text style={{ fontSize: 24 }}>
                  {capabilities.supportsRecording ? "✅" : "❌"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.loadingText}>Checking capabilities...</Text>
            </View>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Recognition Status</Text>
          <View style={[styles.statusCard, { borderColor: getStateColor() }]}>
            <Text style={styles.statusEmoji}>{getStateEmoji()}</Text>
            <Text style={[styles.statusText, { color: getStateColor() }]}>
              {state.toUpperCase()}
            </Text>
            {isRecognizing && (
              <View style={{ marginLeft: 12 }}>
                <View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: getStateColor() }]} />
              </View>
            )}
          </View>
        </View>

        {/* Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Controls</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSuccess,
                styles.gridItemHalf,
                isRecognizing && styles.buttonDisabled,
              ]}
              onPress={handleStart}
              disabled={isRecognizing}
            >
              <Text style={styles.buttonText}>🎙️ Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonWarning,
                styles.gridItemHalf,
                !isRecognizing && styles.buttonDisabled,
              ]}
              onPress={stop}
              disabled={!isRecognizing}
            >
              <Text style={styles.buttonText}>⏸️ Stop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonError,
                styles.gridItemHalf,
                !isRecognizing && styles.buttonDisabled,
              ]}
              onPress={abort}
              disabled={!isRecognizing}
            >
              <Text style={styles.buttonText}>🛑 Abort</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: palette.textSecondary },
                styles.gridItemHalf,
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
            <Text style={styles.sectionSubtitle}>Error</Text>
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[{ color: palette.error, fontSize: 14, flex: 1 }]}>{error}</Text>
            </View>
          </View>
        )}

        {/* Transcript Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Live Transcript</Text>
          <View style={[styles.card, { minHeight: 150 }]}>
            {transcript || interimTranscript ? (
              <>
                {transcript && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[{ fontSize: 12, color: palette.textSecondary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }]}>
                      Final:
                    </Text>
                    <Text style={styles.messageContent}>{transcript}</Text>
                  </View>
                )}
                {interimTranscript && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[{ fontSize: 12, color: palette.warning, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }]}>
                      Live:
                    </Text>
                    <Text style={[{ fontSize: 16, color: palette.textSecondary, fontStyle: 'italic', lineHeight: 24 }]}>
                      {interimTranscript}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.alignCenter, styles.justifyCenter, { minHeight: 100 }]}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>
                  {isRecognizing ? "🎙️" : "💭"}
                </Text>
                <Text style={[{ fontSize: 16, color: palette.textTertiary, fontStyle: 'italic', textAlign: 'center' }]}>
                  {isRecognizing ? "Listening..." : "Press Start to begin transcription"}
                </Text>
              </View>
            )}
          </View>
          
          {/* Transcript Actions */}
          {transcript && (
            <View style={[styles.flexRow, { gap: 12, marginTop: 12 }]}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, styles.flex1]}
                onPress={copyToConversations}
              >
                <Text style={styles.buttonText}>💬 Send to Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonSuccess, styles.flex1]}
                onPress={() => {
                  Alert.alert("Copied!", "Transcript copied to clipboard");
                }}
              >
                <Text style={styles.buttonText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recording Info */}
        {recordingUri && (
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Recording Saved</Text>
            <View style={[styles.card, { backgroundColor: palette.isDark ? '#1F2937' : '#F0FDF4', borderColor: palette.success, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start' }]}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>📁</Text>
              <View style={styles.flex1}>
                <Text style={[{ fontSize: 16, color: palette.success, fontWeight: '600', marginBottom: 8 }]}>
                  Audio file saved
                </Text>
                <Text style={[{ fontSize: 12, color: palette.success, fontFamily: 'monospace' }]} numberOfLines={2}>
                  {recordingUri}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Active Features</Text>
          <View style={styles.grid}>
            {[
              { icon: "🔴", label: "Live Transcription" },
              { icon: "♾️", label: "Continuous Mode" },
              { icon: "🌐", label: "Network-Based" },
              { icon: "💾", label: "Audio Recording" },
              { icon: "📝", label: "Dictation Mode" },
              { icon: "🎧", label: "Background Audio" },
            ].map((feature, index) => (
              <View key={index} style={[styles.card, styles.flexRow, styles.alignCenter, styles.gridItemHalf]}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{feature.icon}</Text>
                <Text style={[{ fontSize: 13, color: palette.textPrimary, flex: 1 }]}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}