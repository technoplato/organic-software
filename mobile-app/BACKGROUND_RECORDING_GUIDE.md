# Background Recording Guide for iOS

## Current Behavior

When you background the iOS app during speech recognition, the transcription stops updating. This is **expected behavior** due to iOS app lifecycle management.

## Why Background Recording Stops

iOS suspends apps when they enter the background to preserve battery life and system resources. Speech recognition requires:
1. Active microphone access
2. Continuous processing
3. Network connectivity (for cloud-based recognition)

## Enabling Background Recording

To enable background recording, you need to:

### 1. Add Background Audio Capability

In your `app.json` or `app.config.js`, add the background mode:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    }
  }
}
```

### 2. Configure Audio Session for Background

The current configuration uses:
```typescript
iosCategory: {
  category: "playAndRecord",
  categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
  mode: "measurement",
}
```

For background recording, you may need to add:
- `mixWithOthers` option to allow other apps to play audio
- Set audio session as active when backgrounding

### 3. Use setAudioSessionActiveIOS

When the app goes to background, ensure the audio session remains active:

```typescript
import { AppState } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' && isRecognizing) {
    // Keep audio session active in background
    ExpoSpeechRecognitionModule.setAudioSessionActiveIOS(true, {
      notifyOthersOnDeactivation: false
    });
  }
});
```

## Important Considerations

### Battery Impact
Background recording significantly impacts battery life. iOS may terminate apps that consume excessive resources.

### Privacy
Users must explicitly grant background recording permissions. The app must clearly indicate when recording in background.

### App Store Review
Apple strictly reviews apps with background audio capabilities. You must justify why your app needs background recording.

## Alternative Solutions

### 1. Pause and Resume
Instead of continuous background recording, pause when backgrounded and resume when foregrounded:

```typescript
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background') {
    // Save current state and pause
    pauseRecognition();
  } else if (nextAppState === 'active') {
    // Resume from saved state
    resumeRecognition();
  }
});
```

### 2. Use On-Device Recognition
On-device recognition may have better background support:

```typescript
requiresOnDeviceRecognition: true
```

### 3. Notification-Based Recording
Use push notifications to prompt users to return to the app when recording is needed.

## Testing Background Recording

1. Start recording in the enhanced demo
2. Press home button to background the app
3. Wait 10-15 seconds
4. Return to the app
5. Check if new segments were captured

## Current Implementation Status

The current enhanced speech demo **does not** have background recording enabled. This is intentional to:
- Preserve battery life
- Avoid App Store review complications
- Maintain consistent behavior across platforms

## Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Background Recording | Requires UIBackgroundModes | May work with foreground service |
| Battery Impact | High | High |
| User Permission | Required | Required |
| Auto-termination Risk | High after ~3 minutes | Lower with proper service |

## Recommendations

For most use cases, we recommend:
1. **Foreground-only recording** for simplicity and battery life
2. **Auto-pause on background** with resume on foreground
3. **Clear user communication** about recording state

If you absolutely need background recording:
1. Add the background audio capability
2. Implement proper audio session management
3. Handle app lifecycle events
4. Test thoroughly on real devices
5. Prepare justification for App Store review