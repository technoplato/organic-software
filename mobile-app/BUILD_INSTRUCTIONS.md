# iOS Development Build Instructions

## Prerequisites

1. **Install EAS CLI globally** (if not already installed):
```bash
npm install -g eas-cli
```

2. **Login to Expo account**:
```bash
eas login
```

3. **Apple Developer Account** (required for device builds, not needed for simulator)

## Build Commands

### For iOS Simulator
```bash
npm run build:ios:simulator
```
This creates a build that can be installed on the iOS Simulator.

### For iOS Device
```bash
npm run build:ios
```
This creates a build that can be installed on physical iOS devices (requires Apple Developer account).

### Local Prebuild (to generate iOS folder)
```bash
npm run prebuild
```
This generates the native iOS project locally without building.

### Run on iOS (local build)
```bash
npm run run:ios
```
This builds and runs the app locally using Xcode.

## When to Create a New Development Build

According to the Expo documentation, you need to create a new development build when:

### ✅ **REQUIRED** - Must rebuild when:

1. **Adding native dependencies** 
   - Installing packages with native code (like `expo-speech-recognition`)
   - Quote: "If you add a library to your project that contains native code APIs, for example, expo-secure-store, you will have to rebuild the development client."

2. **Modifying native configuration**
   - Changes to `app.json` plugins array
   - Changes to iOS permissions in `app.json`
   - Modifications to Info.plist settings
   - Quote: "A development build is essentially your own version of Expo Go where you are free to use any native libraries and change any native config."

3. **Updating Expo SDK version**
   - Major or minor SDK updates often require rebuilds

4. **Changing app scheme or bundle identifier**

### ❌ **NOT REQUIRED** - No rebuild needed for:

1. **JavaScript/TypeScript code changes**
   - Component updates
   - Business logic changes
   - Style modifications

2. **Asset updates**
   - Images, fonts, or other static resources

3. **Environment variables** (if not used in native code)

## Current Build Configuration

This project is configured with:
- **expo-speech-recognition**: Native speech recognition for iOS
- **expo-dev-client**: Custom development client
- **iOS Permissions**: Microphone and Speech Recognition

## Development Workflow

1. **First time setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Create development build for simulator
   npm run build:ios:simulator
   
   # Or for device (requires Apple Developer account)
   npm run build:ios
   ```

2. **Daily development** (no native changes):
   ```bash
   # Just start the dev server
   npm start
   # Then press 'i' to open in iOS simulator
   ```

3. **After adding native dependencies**:
   ```bash
   # Install the new package
   npm install <package-name>
   
   # Rebuild for iOS
   npm run build:ios:simulator
   ```

## Speech Recognition Features

The app is configured with:
- ✅ Live transcription (interim results)
- ✅ Continuous recognition
- ✅ Network-based recognition
- ✅ Audio recording persistence
- ✅ Dictation mode for iOS
- ✅ Background audio support (speakers/headphones)
- ✅ Contextual strings for better recognition

## Troubleshooting

### Build fails with "Command not found: eas"
Install EAS CLI: `npm install -g eas-cli`

### "Not logged in" error
Run: `eas login`

### Simulator build won't install
Make sure you have Xcode and iOS Simulator installed and updated.

### Device build requires provisioning profile
You need an Apple Developer account ($99/year) for device builds.

### Speech recognition not working
1. Check iOS Settings > Privacy > Microphone > [Your App]
2. Check iOS Settings > Privacy > Speech Recognition > [Your App]
3. Ensure Siri & Dictation is enabled in iOS Settings