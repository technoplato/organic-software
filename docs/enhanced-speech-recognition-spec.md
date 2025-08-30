# Enhanced Speech Recognition Demo Specification

## Overview

This document specifies the implementation of an enhanced speech recognition demo with timer functionality, segment-based transcription, extended timeout settings, and automatic restart capabilities.

## Current Issues Identified

1. **Timeout Problem**: Default silence timeout causes recognition to stop after ~1 minute
2. **No Timer Display**: Users can't see how long they've been recording
3. **No Segment Tracking**: Transcripts don't show when different parts were spoken
4. **No Auto-Restart**: When recognition stops, user must manually restart

## Enhanced Features Specification

### 1. Recording Timer Component

**Requirements:**
- Display elapsed recording time in MM:SS format
- Update every second during active recognition
- Show visual recording indicator with pulsing animation
- Display segment counter

**Implementation Details:**
```typescript
interface TimerState {
  startTime: number | null;
  elapsedSeconds: number;
  isActive: boolean;
}
```

### 2. Segment-Based Transcription

**Requirements:**
- Each final result becomes a timestamped segment
- Display segments with their start times relative to session start
- Maintain full transcript history across restarts
- Show interim results separately from final segments

**Data Structure:**
```typescript
interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number; // seconds from session start
  confidence?: number;
  isFinal: boolean;
}
```

### 3. Extended Timeout Configuration

**Current Config Issues:**
- Default `EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS` is too short
- Need to configure both complete and partial silence timeouts

**Enhanced Configuration:**
```typescript
const ENHANCED_SPEECH_CONFIG = {
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
  androidIntentOptions: {
    // Extended silence timeouts to prevent 1-minute cutoffs
    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 30000, // 30 seconds
    EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000, // 15 seconds
    EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000, // 2 seconds minimum
    EXTRA_MASK_OFFENSIVE_WORDS: false,
  },
  recordingOptions: {
    persist: true,
  },
  volumeChangeEventOptions: {
    enabled: true,
    intervalMillis: 500,
  },
};
```

### 4. Auto-Restart Mechanism

**Requirements:**
- Detect unexpected recognition end events
- Automatically restart recognition while preserving transcript
- Handle permission and error states gracefully
- Provide user control to disable auto-restart

**Logic Flow:**
1. Listen for `end` events
2. Check if end was expected (user stopped) or unexpected (timeout/error)
3. If unexpected and auto-restart enabled, restart after brief delay
4. Preserve all existing segments and continue timer
5. Handle errors gracefully with exponential backoff

### 5. Enhanced UI Components

#### Timer Display Component
```typescript
interface TimerDisplayProps {
  elapsedSeconds: number;
  isRecording: boolean;
  segmentCount: number;
}
```

**Visual Design:**
- Large, prominent timer display (MM:SS format)
- Pulsing red dot when recording
- Segment counter badge
- Recording status indicator

#### Segment List Component
```typescript
interface SegmentListProps {
  segments: TranscriptSegment[];
  interimText: string;
  currentTime: number;
}
```

**Visual Design:**
- Scrollable list of segments with timestamps
- Each segment shows relative time (e.g., "2:15")
- Interim text shown in italics at bottom
- Auto-scroll to latest segment

#### Enhanced Controls
- Start/Stop/Pause buttons
- Auto-restart toggle
- Clear segments button
- Export transcript button

### 6. File Structure

**New Files to Create:**
1. `mobile-app/lib/enhanced-speech-recognition.ts` - Enhanced hook with timer and auto-restart
2. `mobile-app/app/speech-demo.tsx` - New dedicated speech demo screen
3. `mobile-app/components/TimerDisplay.tsx` - Timer component
4. `mobile-app/components/SegmentList.tsx` - Segment display component

**Files to Modify:**
1. `mobile-app/app/_layout.tsx` - Add new route
2. `mobile-app/app/index.tsx` - Add navigation to speech demo

### 7. Enhanced Speech Recognition Hook API

```typescript
interface EnhancedSpeechRecognitionHook {
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
  autoRestart: boolean;
  restartAttempts: number;
  
  // Methods
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  toggleAutoRestart: () => void;
  exportTranscript: () => string;
}
```

### 8. Implementation Steps

1. **Create Enhanced Hook** (`enhanced-speech-recognition.ts`)
   - Extend existing hook with timer functionality
   - Add segment tracking with timestamps
   - Implement auto-restart logic
   - Configure extended timeout settings

2. **Create UI Components**
   - TimerDisplay component with pulsing animation
   - SegmentList component with scrolling
   - Enhanced controls with auto-restart toggle

3. **Create Speech Demo Screen** (`speech-demo.tsx`)
   - Use enhanced hook
   - Implement comprehensive UI
   - Add export functionality

4. **Update Routing**
   - Add speech-demo route to _layout.tsx
   - Add navigation from index.tsx

5. **Testing & Refinement**
   - Test extended recording sessions
   - Verify auto-restart functionality
   - Test timeout configurations

### 9. Configuration Options

**Timeout Settings:**
- `EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 30000` (30 seconds)
- `EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000` (15 seconds)
- `EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000` (2 seconds)

**Auto-Restart Settings:**
- Maximum restart attempts: 5
- Restart delay: 1 second (with exponential backoff)
- Auto-restart enabled by default: true

### 10. Error Handling

**Scenarios to Handle:**
1. Permission denied
2. Network connectivity issues
3. Speech recognition service unavailable
4. Maximum restart attempts reached
5. Audio session conflicts

**Error Recovery:**
- Graceful degradation when auto-restart fails
- Clear error messages to user
- Option to manually retry
- Preserve transcript data even on errors

## Success Criteria

1. ✅ Timer displays accurate elapsed time during recording
2. ✅ Segments show with proper timestamps
3. ✅ Extended timeout prevents 1-minute cutoffs
4. ✅ Auto-restart maintains continuous recording
5. ✅ UI is responsive and intuitive
6. ✅ Error handling is robust
7. ✅ Export functionality works correctly

## Next Steps

1. Switch to Code mode to implement the specification
2. Create the enhanced speech recognition hook
3. Build the UI components
4. Create the new speech demo screen
5. Update routing and navigation
6. Test and refine the implementation