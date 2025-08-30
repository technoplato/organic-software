# Native Directory Management

## Expo Continuous Native Generation

This project follows Expo's recommended best practices for managing native iOS and Android directories.

### Key Principles

1. **Native directories are NOT committed to version control**
   - The `ios/` and `android/` directories are listed in `.gitignore`
   - These directories should be generated on-demand when needed

2. **Generate native directories when needed**
   ```bash
   # Generate native directories with clean state
   npx expo prebuild --clean
   
   # Generate for specific platform
   npx expo prebuild --platform ios --clean
   npx expo prebuild --platform android --clean
   ```

3. **When to generate native directories**
   - Building for physical devices
   - Adding native modules that require configuration
   - Creating custom development builds
   - Running on iOS Simulator or Android Emulator with custom native code

4. **Benefits of this approach**
   - Smaller repository size
   - Avoid merge conflicts in native code
   - Always start from clean, up-to-date native templates
   - Easier SDK upgrades
   - Consistent native project structure across team members

### Common Commands

```bash
# Generate native projects
npx expo prebuild --clean

# Run on iOS (will prebuild if needed)
npx expo run:ios

# Run on Android (will prebuild if needed)  
npx expo run:android

# Clean native directories
rm -rf ios android

# Build with EAS (doesn't require local native directories)
eas build --platform ios
eas build --platform android
```

### Important Notes

- If you modify native code directly, those changes will be lost when running `prebuild --clean`
- For persistent native modifications, use [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- The Expo Go app doesn't require native directories for development
- EAS Build service handles native code generation in the cloud

### References

- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Adding Custom Native Code](https://docs.expo.dev/workflow/customizing/)