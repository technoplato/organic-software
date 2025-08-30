#!/bin/bash

echo "Checking device status..."
xcrun devicectl list devices | grep "Michael Lustig Phone"

echo ""
echo "Prerequisites:"
echo "1. ✅ Device is connected (shown above)"
echo "2. ⚠️  Make sure your iPhone is UNLOCKED"
echo "3. ⚠️  If prompted on iPhone, tap 'Trust This Computer'"
echo "4. ⚠️  Wait for Xcode to finish 'Preparing Device for Development'"
echo ""
echo "Press Enter when ready to continue..."
read

echo "Running app on device..."
cd /Users/mlustig/dev/work/sources/side-projects/add-speech-transcription/mobile-app
npx expo run:ios --device "00008120-000660690278C01E" --no-bundler