import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionOptions,
  type ExpoSpeechRecognitionResult,
  type ExpoSpeechRecognitionErrorEvent,
} from "expo-speech-recognition";
import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";

// Enumerated states
export const RecognitionState = {
  IDLE: "idle",
  STARTING: "starting",
  RECOGNIZING: "recognizing",
  STOPPING: "stopping",
  ERROR: "error",
} as const;

export type RecognitionStateType =
  (typeof RecognitionState)[keyof typeof RecognitionState];

// Transcript segment interface
export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number; // seconds from session start
  confidence?: number;
  isFinal: boolean;
}

// Contextual strings for better recognition
const CONTEXTUAL_STRINGS = [
  "InstantDB",
  "supervisor",
  "heartbeat",
  "mobile-app",
  "handler",
  "issue",
  "organic software",
  "expo",
  "react native",
  "typescript",
  "claude",
  "agent",
  "session",
  "transcript",
  "segment",
  "timer",
  "recording",
];

// Enhanced speech recognition configuration
const ENHANCED_SPEECH_CONFIG: ExpoSpeechRecognitionOptions = {
  lang: "en-US",
  interimResults: true,
  continuous: true,
  requiresOnDeviceRecognition: false,
  addsPunctuation: false,
  contextualStrings: CONTEXTUAL_STRINGS,
  iosTaskHint: "dictation",
  iosCategory: {
    category: "playAndRecord",
    categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
    mode: "measurement",
  },
  // Extended timeout settings for Android
  ...(Platform.OS === "android" && {
    androidIntentOptions: {
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 30000, // 30 seconds
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000, // 15 seconds
      EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000, // 2 seconds minimum
      EXTRA_MASK_OFFENSIVE_WORDS: false,
    },
  }),
  recordingOptions: {
    persist: true,
  },
  volumeChangeEventOptions: {
    enabled: true,
    intervalMillis: 500,
  },
};

export interface EnhancedSpeechRecognitionHook {
  // State
  state: RecognitionStateType;
  segments: TranscriptSegment[];
  interimTranscript: string;
  isRecognizing: boolean;
  error: string | null;
  recordingUri: string | null;

  // Timer state
  elapsedSeconds: number;
  sessionStartTime: number | null;

  // Auto-restart state
  restartAttempts: number;

  // Volume state
  volumeLevel: number;

  // Methods
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  exportTranscript: () => string;
}

const RESTART_DELAY_MS = 1000;

export function useEnhancedSpeechRecognition(): EnhancedSpeechRecognitionHook {
  const [state, setState] = useState<RecognitionStateType>(
    RecognitionState.IDLE
  );
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [restartAttempts, setRestartAttempts] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentIdCounter = useRef(0);

  // Silence detection for creating segments
  const lastTranscriptRef = useRef("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSegmentRef = useRef<string>("");
  const lastSegmentedTextRef = useRef<string>(""); // Track what's already been segmented
  const SILENCE_THRESHOLD_MS = 3000; // 3 seconds of no new words triggers a new segment

  // Timer management
  useEffect(() => {
    if (state === RecognitionState.RECOGNIZING && sessionStartTime) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [state, sessionStartTime]);

  // Event handlers
  useSpeechRecognitionEvent("start", () => {
    setState(RecognitionState.RECOGNIZING);
    setError(null);
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setRestartAttempts(0);
    // Reset segmentation tracking
    lastSegmentedTextRef.current = "";
    lastTranscriptRef.current = "";
    pendingSegmentRef.current = "";
  });

  useSpeechRecognitionEvent("end", () => {
    const wasRecognizing = state === RecognitionState.RECOGNIZING;
    // Always restart if not explicitly stopped
    const shouldRestart = wasRecognizing && !isStoppingRef.current;

    setState(RecognitionState.IDLE);

    if (shouldRestart) {
      // Auto-restart with exponential backoff
      const delay =
        RESTART_DELAY_MS * Math.pow(2, Math.min(restartAttempts, 5));
      console.log(
        `[SpeechRecognition] Auto-restarting in ${delay}ms (attempt ${restartAttempts + 1})`
      );

      restartTimeoutRef.current = setTimeout(() => {
        if (!isStoppingRef.current) {
          setRestartAttempts((prev) => prev + 1);
          console.log(
            `[SpeechRecognition] Executing restart attempt ${restartAttempts + 1}`
          );
          startRecognition();
        } else {
          console.log(
            `[SpeechRecognition] Restart cancelled - isStoppingRef: ${isStoppingRef.current}`
          );
        }
      }, delay);
    } else if (!isStoppingRef.current) {
      // Recognition ended unexpectedly without auto-restart
      console.log(
        `[SpeechRecognition] Recognition ended without restart. wasRecognizing: ${wasRecognizing}`
      );
    }

    isStoppingRef.current = false;
  });

  useSpeechRecognitionEvent(
    "result",
    (event: { results: ExpoSpeechRecognitionResult[]; isFinal: boolean }) => {
      if (event.results.length > 0) {
        const result = event.results[0];
        const currentTime = sessionStartTime
          ? Math.floor((Date.now() - sessionStartTime) / 1000)
          : 0;

        if (event.isFinal) {
          // Create a new segment for final result
          const newSegment: TranscriptSegment = {
            id: `segment-${segmentIdCounter.current++}`,
            text: result.transcript,
            timestamp: currentTime,
            confidence: result.confidence,
            isFinal: true,
          };

          setSegments((prev) => [...prev, newSegment]);
          setInterimTranscript("");
          pendingSegmentRef.current = "";
          lastTranscriptRef.current = "";
          lastSegmentedTextRef.current = result.transcript; // Track what we've segmented

          // Clear any pending silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else {
          // Update interim transcript
          // Extract only the new text that hasn't been segmented yet
          let newText = result.transcript;
          if (
            lastSegmentedTextRef.current &&
            newText.startsWith(lastSegmentedTextRef.current)
          ) {
            // Remove already segmented text from the beginning
            newText = newText
              .substring(lastSegmentedTextRef.current.length)
              .trim();
          }

          setInterimTranscript(newText);

          // Check if transcript has changed (new words detected)
          if (
            result.transcript !== lastTranscriptRef.current &&
            result.transcript.trim() !== ""
          ) {
            lastTranscriptRef.current = result.transcript;
            pendingSegmentRef.current = newText; // Store only the new text

            // Clear existing timeout and start a new one
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }

            // After 3 seconds of no new words, create a segment
            silenceTimeoutRef.current = setTimeout(() => {
              if (
                pendingSegmentRef.current &&
                pendingSegmentRef.current.trim() !== ""
              ) {
                const segmentTimestamp = sessionStartTime
                  ? Math.floor((Date.now() - sessionStartTime) / 1000)
                  : 0;
                const newSegment: TranscriptSegment = {
                  id: `segment-${segmentIdCounter.current++}`,
                  text: pendingSegmentRef.current,
                  timestamp: segmentTimestamp,
                  confidence: undefined,
                  isFinal: false, // Mark as non-final since it's from silence detection
                };

                setSegments((prev) => [...prev, newSegment]);
                setInterimTranscript("");

                // Update what we've segmented
                lastSegmentedTextRef.current = lastTranscriptRef.current;
                pendingSegmentRef.current = "";
              }
            }, SILENCE_THRESHOLD_MS);
          }
        }
      }
    }
  );

  useSpeechRecognitionEvent(
    "error",
    (event: ExpoSpeechRecognitionErrorEvent) => {
      setState(RecognitionState.ERROR);
      setError(`${event.error}: ${event.message}`);
      console.error("[SpeechRecognition] Error:", event.error, event.message);

      // Don't auto-restart on certain errors
      const nonRestartableErrors = [
        "not-allowed",
        "language-not-supported",
        "service-not-allowed",
      ];

      if (nonRestartableErrors.includes(event.error)) {
        console.log(
          `[SpeechRecognition] Non-restartable error detected: ${event.error}. Will still attempt to restart.`
        );
        // We don't disable auto-restart even for non-restartable errors
      } else if (event.error === "no-speech") {
        // For "no-speech" errors, reset the attempt counter to keep trying
        console.log(
          "[SpeechRecognition] No speech detected, resetting attempt counter to continue restarting"
        );
        setRestartAttempts(0);
      } else if (event.error === "network") {
        // For network errors, use a shorter delay before retrying
        console.log(
          "[SpeechRecognition] Network error detected, will retry with shorter delay"
        );
        // The shorter delay will be applied in the end event handler
      } else {
        console.log(
          `[SpeechRecognition] Recoverable error: ${event.error}. Will attempt restart.`
        );
      }
    }
  );

  useSpeechRecognitionEvent("audiostart", (event: { uri: string | null }) => {
    if (event.uri) {
      console.log("[SpeechRecognition] Recording started:", event.uri);
    }
  });

  useSpeechRecognitionEvent("audioend", (event: { uri: string | null }) => {
    if (event.uri) {
      setRecordingUri(event.uri);
      console.log("[SpeechRecognition] Recording saved:", event.uri);
    }
  });

  useSpeechRecognitionEvent("volumechange", (event: { value: number }) => {
    setVolumeLevel(event.value);
  });

  // Internal start function
  const startRecognition = async () => {
    try {
      setState(RecognitionState.STARTING);

      // Request permissions
      const result =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      if (!result.granted) {
        throw new Error("Microphone permissions not granted");
      }

      // Start recognition with enhanced config
      ExpoSpeechRecognitionModule.start(ENHANCED_SPEECH_CONFIG);
    } catch (err) {
      setState(RecognitionState.ERROR);
      setError(
        err instanceof Error ? err.message : "Failed to start recognition"
      );
      console.error(
        "[SpeechRecognition] Failed to start speech recognition:",
        err
      );
      // Don't disable auto-restart even on startup errors
      console.log(
        "[SpeechRecognition] Will attempt to restart despite startup error"
      );
    }
  };

  // Public methods
  const start = useCallback(async () => {
    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    isStoppingRef.current = false;
    setRestartAttempts(0);

    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
      setElapsedSeconds(0);
    }

    await startRecognition();
  }, [sessionStartTime]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    setState(RecognitionState.STOPPING);
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const abort = useCallback(() => {
    isStoppingRef.current = true;

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    setState(RecognitionState.IDLE);
    ExpoSpeechRecognitionModule.abort();
  }, []);

  const reset = useCallback(() => {
    isStoppingRef.current = true;

    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Clear silence detection timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Abort any ongoing recognition
    if (state === RecognitionState.RECOGNIZING) {
      ExpoSpeechRecognitionModule.abort();
    }

    // Reset all state
    setState(RecognitionState.IDLE);
    setSegments([]);
    setInterimTranscript("");
    setError(null);
    setRecordingUri(null);
    setElapsedSeconds(0);
    setSessionStartTime(null);
    setRestartAttempts(0);
    setVolumeLevel(0);
    segmentIdCounter.current = 0;
    lastTranscriptRef.current = "";
    pendingSegmentRef.current = "";
    lastSegmentedTextRef.current = "";
  }, [state]);

  // Always keep auto-restart enabled, so this function is now a no-op
  const toggleAutoRestart = useCallback(() => {
    console.log(
      "[SpeechRecognition] Auto-restart is always enabled and cannot be disabled"
    );
    // No-op - we always keep auto-restart enabled
  }, []);

  const exportTranscript = useCallback(() => {
    const header =
      `Speech Recognition Transcript\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `Duration: ${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, "0")}\n` +
      `Segments: ${segments.length}\n` +
      `${"=".repeat(50)}\n\n`;

    const content = segments
      .map((segment) => {
        const minutes = Math.floor(segment.timestamp / 60);
        const seconds = segment.timestamp % 60;
        const timeStr = `[${minutes}:${seconds.toString().padStart(2, "0")}]`;
        return `${timeStr} ${segment.text}`;
      })
      .join("\n\n");

    return header + content;
  }, [segments, elapsedSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    segments,
    interimTranscript,
    isRecognizing: state === RecognitionState.RECOGNIZING,
    error,
    recordingUri,

    // Timer state
    elapsedSeconds,
    sessionStartTime,

    restartAttempts,

    // Volume state
    volumeLevel,

    // Methods
    start,
    stop,
    abort,
    reset,
    exportTranscript,
  };
}
