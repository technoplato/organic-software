import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionOptions,
  type ExpoSpeechRecognitionResult,
  type ExpoSpeechRecognitionErrorEvent,
} from "expo-speech-recognition";
import { useState, useCallback, useRef, useEffect } from "react";
import { Platform, Alert } from "react-native";

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

/**
 * Enumerated error codes for speech recognition
 */
export const RecognitionErrorCode = {
  // Permission errors
  PERMISSION_DENIED: "permission-denied",
  NOT_ALLOWED: "not-allowed",
  
  // Availability errors
  NOT_AVAILABLE: "not-available",
  SERVICE_NOT_ALLOWED: "service-not-allowed",
  LANGUAGE_NOT_SUPPORTED: "language-not-supported",
  
  // Runtime errors
  NO_SPEECH: "no-speech",
  NETWORK: "network",
  AUDIO_CAPTURE: "audio-capture",
  ABORTED: "aborted",
  
  // Start errors
  START_FAILED: "start-failed",
  
  // Unknown
  UNKNOWN: "unknown",
} as const;

export type RecognitionErrorCodeType =
  (typeof RecognitionErrorCode)[keyof typeof RecognitionErrorCode];

/**
 * Enumerated reasons for why speech recognition stopped
 */
export const RecognitionStopReason = {
  /** User manually stopped recognition */
  USER_STOPPED: "user-stopped",
  /** User aborted recognition */
  USER_ABORTED: "user-aborted",
  /** Recognition ended due to an error */
  ERROR: "error",
  /** Recognition ended due to silence/no speech detected */
  SILENCE_TIMEOUT: "silence-timeout",
  /** Recognition ended naturally (e.g., reached max duration) */
  NATURAL_END: "natural-end",
  /** Recognition ended due to network issues */
  NETWORK_FAILURE: "network-failure",
  /** Recognition ended due to permission issues */
  PERMISSION_LOST: "permission-lost",
  /** Recognition ended for unknown reasons */
  UNKNOWN: "unknown",
} as const;

export type RecognitionStopReasonType =
  (typeof RecognitionStopReason)[keyof typeof RecognitionStopReason];

/**
 * Enhanced transcript segment with formatted timestamps
 */
export interface TranscriptSegment {
  /** Unique identifier for the segment */
  id: string;
  /** The transcribed text */
  text: string;
  /** Timestamp in seconds from session start */
  timestamp: number;
  /** Human-readable formatted timestamp (e.g., "1:23" or "1:23:45") */
  formattedTimestamp: string;
  /** Confidence score (0-1) if available */
  confidence?: number;
  /** Whether this segment is final or from silence detection */
  isFinal: boolean;
}

/**
 * Speech recognition error information
 */
export interface SpeechRecognitionError {
  /** Error code from the speech recognition service */
  code: RecognitionErrorCodeType;
  /** Human-readable error message */
  message: string;
  /** Whether this error is recoverable (can retry) */
  isRecoverable: boolean;
}

/**
 * Options for the enhanced speech recognition hook
 */
export interface UseEnhancedSpeechRecognitionOptions {
  /**
   * Callback invoked when new speech results are recognized.
   * This is for processing individual words/changes in real-time.
   * For displaying all results, use the segments state from the hook.
   */
  onNewResult?: (result: {
    /** The current segment being updated (null if no segment yet) */
    currentSegment: TranscriptSegment | null;
    /** The new text that was just added */
    deltaText: string;
    /** The complete transcript so far */
    fullTranscript: string;
    /** Whether this is interim (non-final) result */
    isInterim: boolean;
  }) => void;

  /**
   * Callback invoked when an error occurs during speech recognition.
   * Use this to handle errors in your component.
   */
  onError?: (error: SpeechRecognitionError) => void;

  /**
   * Callback invoked when speech recognition stops for any reason.
   * Provides the reason why recognition stopped.
   */
  onSpeechRecognitionStopped?: (reason: RecognitionStopReasonType) => void;
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

/**
 * Enhanced speech recognition hook return type
 */
export interface EnhancedSpeechRecognitionHook {
  // State
  /** Current recognition state */
  state: RecognitionStateType;
  /** Array of transcript segments */
  segments: TranscriptSegment[];
  /** Current interim (non-final) transcript */
  interimTranscript: string;
  /** Whether recognition is currently active */
  isRecognizing: boolean;
  /** Error message if any */
  error: string | null;
  /** URI of the recorded audio file */
  recordingUri: string | null;

  // Timer state
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Formatted elapsed time (e.g., "23:59:59" for hours, "59:59" for minutes, "59" for seconds) */
  formattedElapsedTime: string;
  /** Session start timestamp in milliseconds */
  sessionStartTime: number | null;

  // Auto-restart state
  /** Number of restart attempts */
  restartAttempts: number;

  // Volume state
  /**
   * Raw volume level in decibels (dB).
   * Range: -2 dB (very quiet) to 10 dB (very loud)
   * 0 dB is normal speaking volume
   */
  volumeLevel: number;
  /**
   * Normalized volume level for UI display.
   * Range: 0.0 (silent) to 1.0 (maximum)
   * Calculated from volumeLevel: (volumeLevel + 2) / 12
   */
  normalizedVolumeLevel: number;

  // Capabilities
  /** Whether speech recognition is available on this device */
  isAvailable: boolean;
  /** Whether on-device recognition is supported */
  supportsOnDevice: boolean;
  /** Whether audio recording is supported */
  supportsRecording: boolean;

  // Methods
  /**
   * Start speech recognition. Shows alert if not available.
   * This is synchronous - errors are handled via onError callback.
   */
  start: () => void;
  /**
   * Stop speech recognition gracefully, allowing final results to be processed.
   * Recognition will end after processing any pending audio.
   */
  stop: () => void;
  /**
   * Abort speech recognition immediately without processing pending audio.
   * Use this for immediate cancellation without waiting for final results.
   */
  abort: () => void;
  /** Reset all state and clear transcript */
  reset: () => void;
  /** Export transcript as formatted text */
  exportTranscript: () => string;
}

const RESTART_DELAY_MS = 1000;

/**
 * Format seconds into a human-readable time string.
 * Examples: "0:05" for 5 seconds, "1:23" for 1 minute 23 seconds, "1:23:45" for 1 hour 23 minutes 45 seconds
 * Always pads seconds with zero when less than 10
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  } else {
    // For less than a minute, show "0:05" format
    return `0:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Enhanced speech recognition hook with built-in capabilities checking,
 * formatted timestamps, normalized volume levels, and error callbacks.
 *
 * @param options - Configuration options including callbacks
 * @returns Hook interface with state and methods
 */
export function useEnhancedSpeechRecognition(
  options: UseEnhancedSpeechRecognitionOptions = {}
): EnhancedSpeechRecognitionHook {
  const { onNewResult, onError, onSpeechRecognitionStopped } = options;
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
  
  // Capabilities state
  const [capabilities, setCapabilities] = useState({
    isAvailable: false,
    supportsOnDevice: false,
    supportsRecording: false,
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentIdCounter = useRef(0);
  const previousTranscriptRef = useRef<string>("");
  const stopReasonRef = useRef<RecognitionStopReasonType | null>(null);

  // Silence detection for creating segments
  const lastTranscriptRef = useRef("");
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSegmentRef = useRef<string>("");
  const lastSegmentedTextRef = useRef<string>(""); // Track what's already been segmented
  const SILENCE_THRESHOLD_MS = 3000; // 3 seconds of no new words triggers a new segment
  
  // Check capabilities on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
        const supportsOnDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
        const supportsRecording = ExpoSpeechRecognitionModule.supportsRecording();
        
        setCapabilities({
          isAvailable,
          supportsOnDevice,
          supportsRecording,
        });
      } catch (err) {
        console.error("[SpeechRecognition] Failed to check capabilities:", err);
      }
    };
    
    checkCapabilities();
  }, []);
  
  // Computed values
  const formattedElapsedTime = formatTime(elapsedSeconds);
  const normalizedVolumeLevel = Math.max(0, Math.min(1, (volumeLevel + 2) / 12));

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

    // Determine stop reason and call callback
    if (stopReasonRef.current && onSpeechRecognitionStopped) {
      onSpeechRecognitionStopped(stopReasonRef.current);
      stopReasonRef.current = null;
    } else if (!isStoppingRef.current && wasRecognizing && onSpeechRecognitionStopped) {
      // Recognition ended unexpectedly
      onSpeechRecognitionStopped(RecognitionStopReason.NATURAL_END);
    }

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
            formattedTimestamp: formatTime(currentTime),
            confidence: result.confidence,
            isFinal: true,
          };

          setSegments((prev) => [...prev, newSegment]);
          
          // Call onNewResult callback if provided
          if (onNewResult) {
            const deltaText = result.transcript.replace(previousTranscriptRef.current, '').trim();
            const fullTranscript = segments.map(s => s.text).concat(result.transcript).join(' ');
            onNewResult({
              currentSegment: newSegment,
              deltaText,
              fullTranscript,
              isInterim: false,
            });
          }
          
          previousTranscriptRef.current = result.transcript;
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
          
          // Call onNewResult callback for interim results
          if (onNewResult && newText) {
            const deltaText = newText.replace(previousTranscriptRef.current, '').trim();
            const fullTranscript = segments.map(s => s.text).concat(newText).join(' ');
            onNewResult({
              currentSegment: segments[segments.length - 1] || null,
              deltaText,
              fullTranscript,
              isInterim: true,
            });
          }

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
                  formattedTimestamp: formatTime(segmentTimestamp),
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
      const errorMessage = `${event.error}: ${event.message}`;
      setState(RecognitionState.ERROR);
      setError(errorMessage);
      console.error("[SpeechRecognition] Error:", event.error, event.message);
      
      // Map error to our error code enum
      const errorCode = mapErrorToCode(event.error);
      
      // Call onError callback if provided
      if (onError) {
        const nonRestartableErrors: RecognitionErrorCodeType[] = [
          RecognitionErrorCode.NOT_ALLOWED,
          RecognitionErrorCode.LANGUAGE_NOT_SUPPORTED,
          RecognitionErrorCode.SERVICE_NOT_ALLOWED,
          RecognitionErrorCode.PERMISSION_DENIED,
          RecognitionErrorCode.NOT_AVAILABLE,
        ];
        
        onError({
          code: errorCode,
          message: event.message,
          isRecoverable: !nonRestartableErrors.includes(errorCode),
        });
      }

      // Handle auto-restart based on error type
      const nonRestartableErrors: RecognitionErrorCodeType[] = [
        RecognitionErrorCode.NOT_ALLOWED,
        RecognitionErrorCode.LANGUAGE_NOT_SUPPORTED,
        RecognitionErrorCode.SERVICE_NOT_ALLOWED,
        RecognitionErrorCode.PERMISSION_DENIED,
      ];

      if (nonRestartableErrors.includes(errorCode)) {
        console.log(
          `[SpeechRecognition] Non-restartable error detected: ${event.error}. Disabling auto-restart.`
        );
        // Disable auto-restart for non-recoverable errors
        isStoppingRef.current = true;
      } else if (errorCode === RecognitionErrorCode.NO_SPEECH) {
        // For "no-speech" errors, reset the attempt counter to keep trying
        console.log(
          "[SpeechRecognition] No speech detected, resetting attempt counter to continue restarting"
        );
        setRestartAttempts(0);
      } else if (errorCode === RecognitionErrorCode.NETWORK) {
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

  /**
   * Map raw error strings to our error code enum
   */
  const mapErrorToCode = (error: string): RecognitionErrorCodeType => {
    switch (error) {
      case "permission-denied":
        return RecognitionErrorCode.PERMISSION_DENIED;
      case "not-allowed":
        return RecognitionErrorCode.NOT_ALLOWED;
      case "not-available":
        return RecognitionErrorCode.NOT_AVAILABLE;
      case "service-not-allowed":
        return RecognitionErrorCode.SERVICE_NOT_ALLOWED;
      case "language-not-supported":
        return RecognitionErrorCode.LANGUAGE_NOT_SUPPORTED;
      case "no-speech":
        return RecognitionErrorCode.NO_SPEECH;
      case "network":
        return RecognitionErrorCode.NETWORK;
      case "audio-capture":
        return RecognitionErrorCode.AUDIO_CAPTURE;
      case "aborted":
        return RecognitionErrorCode.ABORTED;
      case "start-failed":
        return RecognitionErrorCode.START_FAILED;
      default:
        return RecognitionErrorCode.UNKNOWN;
    }
  };

  // Internal start function
  const startRecognition = () => {
    setState(RecognitionState.STARTING);

    // Request permissions and start
    ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync()
      .then((result) => {
        if (!result.granted) {
          const error = "Microphone permissions not granted";
          setState(RecognitionState.ERROR);
          setError(error);
          
          if (onError) {
            onError({
              code: RecognitionErrorCode.PERMISSION_DENIED,
              message: error,
              isRecoverable: false,
            });
          }
          
          Alert.alert(
            "Microphone Permission Required",
            "Please grant microphone access in Settings to use speech recognition."
          );
          return;
        }

        // Start recognition with enhanced config
        ExpoSpeechRecognitionModule.start(ENHANCED_SPEECH_CONFIG);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : "Failed to start recognition";
        setState(RecognitionState.ERROR);
        setError(errorMessage);
        console.error("[SpeechRecognition] Failed to start speech recognition:", err);
        
        if (onError) {
          onError({
            code: RecognitionErrorCode.START_FAILED,
            message: errorMessage,
            isRecoverable: true,
          });
        }
      });
  };

  // Public methods
  const start = useCallback(() => {
    // Check if speech recognition is available
    if (!capabilities.isAvailable) {
      Alert.alert(
        "Speech Recognition Unavailable",
        "Speech recognition is not available on this device. Please enable Siri & Dictation in Settings."
      );
      
      if (onError) {
        onError({
          code: RecognitionErrorCode.NOT_AVAILABLE,
          message: "Speech recognition is not available on this device",
          isRecoverable: false,
        });
      }
      return;
    }
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

    startRecognition();
  }, [sessionStartTime, capabilities.isAvailable, onError]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;
    stopReasonRef.current = RecognitionStopReason.USER_STOPPED;

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
    formattedElapsedTime,
    sessionStartTime,

    restartAttempts,

    // Volume state
    volumeLevel,
    normalizedVolumeLevel,
    
    // Capabilities
    isAvailable: capabilities.isAvailable,
    supportsOnDevice: capabilities.supportsOnDevice,
    supportsRecording: capabilities.supportsRecording,

    // Methods
    start,
    stop,
    abort,
    reset,
    exportTranscript,
  };
}
