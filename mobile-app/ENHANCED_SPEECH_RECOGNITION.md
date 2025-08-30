# Enhanced Speech Recognition Demo

## Overview

The Enhanced Speech Recognition Demo provides a robust, cross-platform speech-to-text solution with advanced features including:
- Real-time recording timer
- Segment-based transcription with timestamps
- Extended timeout configuration to prevent premature cutoffs
- Automatic restart mechanism for continuous recording
- Volume metering
- Export functionality

## Features

### 1. Recording Timer
- **Real-time elapsed time display**: Shows recording duration in MM:SS format
- **Visual recording indicator**: Pulsing red dot when actively recording
- **Segment counter**: Displays the number of completed transcript segments

### 2. Segment-Based Transcription
- **Timestamped segments**: Segments created automatically after 3 seconds of silence
- **Dual trigger system**: Segments created from either:
  - Final results (when available)
  - 3-second silence detection (for continuous iOS recording)
- **Visual distinction**: Auto-created segments marked with "Auto" badge
- **Continuous history**: All segments preserved across recording sessions
- **Interim results**: Live display of partial transcription in italics
- **Auto-scroll**: Automatically scrolls to show the latest segment

### 3. Silence-Based Segmentation

**Problem Solved**: iOS continuous recording may not provide final results as expected, making it difficult to segment transcripts.

**Solution**: Automatic segment creation after 3 seconds of no new transcribed words.

**How it works**:
1. Monitor interim transcript changes
2. When no new words detected for 3 seconds, create a segment
3. Clear interim transcript and continue recording
4. Segments marked as "Auto" to distinguish from final results

### 4. Extended Timeout Configuration

#### iOS Behavior
- **iOS 17 and below**: Recognition runs until no speech is detected for 3 seconds
- **iOS 18+**: Recognition runs until a final result is received
- **Continuous mode**: May not provide final results as expected
- **Silence detection**: Segments created after 3 seconds of no new words

#### Android Behavior
- **Extended silence timeout**: 30 seconds (vs default ~1 minute)
- **Partial silence timeout**: 15 seconds
- **Minimum speech duration**: 2 seconds

Configuration:
```typescript
androidIntentOptions: {
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 30000, // 30 seconds
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000, // 15 seconds
  EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000, // 2 seconds minimum
}
```

### 5. Auto-Restart Mechanism
- **Automatic recovery**: Detects unexpected recognition end and restarts
- **Exponential backoff**: Increases delay between restart attempts
- **Maximum attempts**: Limits to 5 restart attempts to prevent infinite loops
- **Toggle control**: User can enable/disable auto-restart
- **Error handling**: Disables auto-restart for permission errors

### 6. Volume Metering
- **Real-time volume display**: Visual bar showing input volume level
- **Color coding**: Green (normal), Orange (medium), Red (loud)
- **Update frequency**: 500ms intervals

### 7. Export Functionality
- **Share transcript**: Export full transcript with timestamps
- **Formatted output**: Includes date, duration, and segment count
- **Cross-platform sharing**: Uses native share sheet

## Usage

### Starting the Enhanced Demo

1. Navigate to the main speech recognition screen
2. Tap "✨ Try Enhanced Demo" button
3. Grant microphone permissions when prompted

### Recording Controls

- **Start**: Begin speech recognition
- **Stop**: End recognition and process final result
- **Abort**: Immediately cancel without processing
- **Reset**: Clear all segments and reset timer

### Auto-Restart Toggle

Enable/disable automatic restart when recognition ends unexpectedly. Useful for:
- Long recording sessions
- Hands-free operation
- Continuous transcription needs

### Exporting Transcripts

1. Record one or more segments
2. Tap "📤 Export Transcript"
3. Choose sharing method (Messages, Email, Notes, etc.)

## Technical Implementation

### Enhanced Speech Recognition Hook

Located in `mobile-app/lib/enhanced-speech-recognition.ts`

Key features:
- Timer management with `useEffect` and `setInterval`
- Segment tracking with unique IDs
- **Silence detection**: 3-second timeout for automatic segmentation
- Auto-restart logic with exponential backoff
- Volume level monitoring
- Cross-platform configuration

**Silence Detection Implementation**:
```typescript
const SILENCE_THRESHOLD_MS = 3000; // 3 seconds

// Monitor transcript changes
if (result.transcript !== lastTranscriptRef.current) {
  // Reset silence timer on new words
  clearTimeout(silenceTimeoutRef.current);
  
  // Start new timer
  silenceTimeoutRef.current = setTimeout(() => {
    // Create segment after 3 seconds of silence
    createSegmentFromSilence();
  }, SILENCE_THRESHOLD_MS);
}
```

### UI Components

Located in `mobile-app/app/speech-demo.tsx`

Components:
- `TimerDisplay`: Shows elapsed time and recording status
- `SegmentList`: Displays transcript segments with timestamps
- `VolumeMeter`: Visual representation of input volume

### Platform-Specific Configuration

```typescript
const ENHANCED_SPEECH_CONFIG: ExpoSpeechRecognitionOptions = {
  lang: "en-US",
  interimResults: true,
  continuous: true,
  requiresOnDeviceRecognition: false,
  
  // iOS-specific
  iosTaskHint: "dictation",
  iosCategory: {
    category: "playAndRecord",
    categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
    mode: "measurement",
  },
  
  // Android-specific (only applied on Android)
  ...(Platform.OS === "android" && {
    androidIntentOptions: {
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 30000,
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 15000,
      EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000,
      EXTRA_MASK_OFFENSIVE_WORDS: false,
    },
  }),
  
  // Recording options
  recordingOptions: {
    persist: true,
  },
  
  // Volume monitoring
  volumeChangeEventOptions: {
    enabled: true,
    intervalMillis: 500,
  },
};
```

## Troubleshooting

### iOS Issues

1. **No final results in continuous mode**
   - This is expected behavior on iOS
   - Segments will be created automatically after 3 seconds of silence
   - Look for "Auto" badge on segments created from silence detection

2. **Recognition stops after 3 seconds of silence (iOS 17-)**
   - This is expected behavior on older iOS versions
   - Auto-restart will handle this automatically if enabled

3. **Permission denied**
   - Check Settings > Privacy > Speech Recognition
   - Ensure Siri & Dictation is enabled

### Android Issues

1. **Recognition still stops after ~1 minute**
   - Verify Android 13+ is being used
   - Check that extended timeout settings are applied
   - Ensure continuous mode is enabled

2. **No speech detected error**
   - Speak louder or closer to microphone
   - Check volume meter for input levels
   - Verify microphone permissions

### Common Issues

1. **Auto-restart not working**
   - Check if max attempts (5) reached
   - Verify auto-restart toggle is enabled
   - Check for permission errors in console

2. **Segments not appearing**
   - Ensure speech is being detected (check volume meter)
   - Wait for final results (not just interim)
   - Check error messages for issues

## Best Practices

1. **For long recordings**:
   - Enable auto-restart
   - Monitor the restart attempt counter
   - Export transcript periodically

2. **For accuracy**:
   - Speak clearly and at normal pace
   - Minimize background noise
   - Use device's primary microphone

3. **For battery life**:
   - Disable auto-restart when not needed
   - Stop recognition when finished
   - Consider on-device recognition for extended use

## API Reference

### useEnhancedSpeechRecognition Hook

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
  
  // Volume state
  volumeLevel: number;
  
  // Methods
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  toggleAutoRestart: () => void;
  exportTranscript: () => string;
}
```

### TranscriptSegment Interface

```typescript
interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number; // seconds from session start
  confidence?: number;
  isFinal: boolean; // false for silence-detected segments
}
```

## Future Enhancements

- [ ] Add pause/resume functionality
- [ ] Implement segment editing
- [ ] Add cloud backup for transcripts
- [ ] Support multiple languages
- [ ] Add custom vocabulary support
- [ ] Implement real-time translation
- [ ] Add audio playback for segments
- [ ] Support background recording (iOS)