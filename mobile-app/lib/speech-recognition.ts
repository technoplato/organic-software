import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionOptions,
  type ExpoSpeechRecognitionResult,
  type ExpoSpeechRecognitionErrorEvent,
} from "expo-speech-recognition";
import { useState, useCallback, useRef } from "react";

// Enumerated states using const objects
export const RecognitionState = {
  IDLE: "idle",
  STARTING: "starting",
  RECOGNIZING: "recognizing",
  STOPPING: "stopping",
  ERROR: "error",
} as const;

export type RecognitionStateType = typeof RecognitionState[keyof typeof RecognitionState];

// Contextual strings from the codebase
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
];

// Speech recognition configuration
const SPEECH_CONFIG: ExpoSpeechRecognitionOptions = {
  lang: "en-US",
  interimResults: true, // Live transcription
  continuous: true, // Continuous recognition
  requiresOnDeviceRecognition: false, // Use network-based recognition
  addsPunctuation: false, // No punctuation
  contextualStrings: CONTEXTUAL_STRINGS,
  iosTaskHint: "dictation",
  iosCategory: {
    category: "playAndRecord",
    categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
    mode: "measurement",
  },
  recordingOptions: {
    persist: true, // Persist audio recordings
  },
};

export interface SpeechRecognitionHook {
  // State
  state: RecognitionStateType;
  transcript: string;
  interimTranscript: string;
  isRecognizing: boolean;
  error: string | null;
  recordingUri: string | null;
  
  // Methods
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [state, setState] = useState<RecognitionStateType>(RecognitionState.IDLE);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const finalTranscriptRef = useRef("");

  // Event handlers
  useSpeechRecognitionEvent("start", () => {
    setState(RecognitionState.RECOGNIZING);
    setError(null);
  });

  useSpeechRecognitionEvent("end", () => {
    setState(RecognitionState.IDLE);
  });

  useSpeechRecognitionEvent("result", (event: { results: ExpoSpeechRecognitionResult[]; isFinal: boolean }) => {
    if (event.results.length > 0) {
      const result = event.results[0];
      
      if (event.isFinal) {
        // Append final result to transcript
        const newText = result.transcript;
        finalTranscriptRef.current = finalTranscriptRef.current 
          ? `${finalTranscriptRef.current} ${newText}` 
          : newText;
        setTranscript(finalTranscriptRef.current);
        setInterimTranscript("");
      } else {
        // Update interim transcript
        setInterimTranscript(result.transcript);
      }
    }
  });

  useSpeechRecognitionEvent("error", (event: ExpoSpeechRecognitionErrorEvent) => {
    setState(RecognitionState.ERROR);
    setError(`${event.error}: ${event.message}`);
    console.error("Speech recognition error:", event);
  });

  useSpeechRecognitionEvent("audiostart", (event: { uri: string | null }) => {
    if (event.uri) {
      console.log("Recording started:", event.uri);
    }
  });

  useSpeechRecognitionEvent("audioend", (event: { uri: string | null }) => {
    if (event.uri) {
      setRecordingUri(event.uri);
      console.log("Recording saved:", event.uri);
    }
  });

  // Methods
  const start = useCallback(async () => {
    try {
      setState(RecognitionState.STARTING);
      
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      if (!result.granted) {
        throw new Error("Microphone permissions not granted");
      }
      
      // Start recognition
      ExpoSpeechRecognitionModule.start(SPEECH_CONFIG);
    } catch (err) {
      setState(RecognitionState.ERROR);
      setError(err instanceof Error ? err.message : "Failed to start recognition");
      console.error("Failed to start speech recognition:", err);
    }
  }, []);

  const stop = useCallback(() => {
    setState(RecognitionState.STOPPING);
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const abort = useCallback(() => {
    setState(RecognitionState.IDLE);
    ExpoSpeechRecognitionModule.abort();
  }, []);

  const reset = useCallback(() => {
    setState(RecognitionState.IDLE);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setRecordingUri(null);
    finalTranscriptRef.current = "";
  }, []);

  return {
    // State
    state,
    transcript,
    interimTranscript,
    isRecognizing: state === RecognitionState.RECOGNIZING,
    error,
    recordingUri,
    
    // Methods
    start,
    stop,
    abort,
    reset,
  };
}

// Utility function to check if speech recognition is available
export async function checkSpeechRecognitionAvailability() {
  const isAvailable = ExpoSpeechRecognitionModule.isRecognitionAvailable();
  const supportsOnDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
  const supportsRecording = ExpoSpeechRecognitionModule.supportsRecording();
  
  return {
    isAvailable,
    supportsOnDevice,
    supportsRecording,
  };
}