# Add Speech Transcription Plan

## Overview
Implement speech transcription in the mobile app using expo-speech-recognition, focusing on iOS development builds only.

## Requirements
1. **iOS Only** - No Android support needed
2. **Development Build** - Create and configure development build for iOS
3. **Speech Recognition Wrapper** - Create a typed wrapper around expo-speech-recognition
4. **Demo Screen** - Replace home screen with speech transcription demo
5. **Live Transcription** - Enable continuous, real-time transcription

## Implementation Steps

### Phase 1: Setup & Configuration
1. Install expo-speech-recognition package
2. Configure app.json with required permissions
3. Add development build scripts to package.json
4. Document when to rebuild (based on native changes)

### Phase 2: Speech Recognition Wrapper
Create a wrapper module with:
- Enumerated states using const objects
- Typed variables (transcript, recognizing)
- Exposed methods (start, stop, pause, etc.)
- Configuration:
  - `interimResults: true` (live transcription)
  - `continuous: true` (continuous recognition)
  - `requiresOnDeviceRecognition: false`
  - `addsPunctuation: false`
  - `iosTaskHint: "dictation"`
  - iOS category for background recording over speakers/headphones
  - Contextual strings from codebase

### Phase 3: Demo Screen Implementation
1. Replace index.tsx with demo screen
2. Show full capabilities of speech recognition
3. Display real-time transcript
4. Control buttons for start/stop/pause
5. Visual feedback for recognition state

## Build Triggers
According to Expo documentation, a new development build is required when:
- Adding native dependencies (like expo-speech-recognition)
- Modifying native configuration (Info.plist, AndroidManifest.xml)
- Changing app.json plugins configuration
- Updating Expo SDK version

Quote from docs: "A development build is essentially your own version of Expo Go where you are free to use any native libraries and change any native config."

## iOS Permissions Required
- Microphone access
- Speech recognition (if not using on-device)

## Development Build Commands
```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to EAS
eas login

# Build for iOS Simulator
eas build --platform ios --profile development

# Build for iOS Device (requires Apple Developer account)
eas build --platform ios --profile development