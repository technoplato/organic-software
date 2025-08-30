Auto
https://docs.expo.dev/develop/development-builds/create-a-build/
Search

⌘ K
Get started
Introduction
Create a project
Set up your environment
Start developing
Next steps
Develop
Tools for development



Introduction
Expo Go to development build
Create a build on EAS
Use a build
Share with your team
Tools, workflows and extensions
Next steps


Authentication
Unit testing
Review
Distributing apps for review
Share previews with your team
Open updates with Orbit
Deploy
Build project for app stores
Submit to app stores
App stores metadata
Send over-the-air updates
Deploy web apps
Monitor
Monitoring services
More
Core concepts
FAQ
LLMs
Archive
Expo Snack
Discord and Forums
Newsletter
Create a development build on EAS
Learn how to create development builds for a project.


When you create a new Expo app with npx create-expo-app, you start off with a project where you update the JavaScript code on your local machine and view the changes in the Expo Go app. A development build is essentially your own version of Expo Go where you are free to use any native libraries and change any native config. In this guide, you will learn how to convert your project that runs on Expo Go into a development build, which will make the native side of your app fully customizable.

How to create a development build
How to create a development build
Prerequisites
The instructions assume you already have an existing Expo project that runs on Expo Go.

The requirements for building the native app depend on which platform you are using, which platform you are building for, and whether you want to build on EAS or on your local machine.

Build on EAS


Build locally using the EAS CLI



Build locally without EAS

Get started
For detailed, step-by-step instructions, see our EAS Tutorial. Available also as a tutorial series on YouTube.

1

Install expo-dev-client
Terminal

Copy

npx expo install expo-dev-client
Are you using this library in a existing (bare) React Native apps?

2

Build the native app (Android)
Prerequisites

3 requirements

1.

Expo account

Sign up for an Expo account, if you haven't already.

2.

EAS CLI

The EAS CLI installed and logged in.

Terminal

Copy

npm install -g eas-cli && eas login
3.

An Android Emulator (optional)

An Android Emulator is optional if you want to test your app on an emulator.

Terminal

Copy

eas build --platform android --profile development
Read more about Android builds on EAS.

2

Build the native app (iOS Simulator)
Prerequisites

3 requirements

1.

Expo account

Sign up for an Expo account, if you haven't already.

2.

EAS CLI

The EAS CLI installed and logged in.

Terminal

Copy

npm install -g eas-cli && eas login
3.

macOS with iOS Simulator installed

iOS Simulators are available only on macOS. Make sure you have the iOS Simulator installed.

Edit development profile in eas.json and set the simulator option to true (you have to create a separate profile for simulator builds if you also want to create iOS device builds for this project).

eas.json

Copy


{
  "build": {
    "development": {
      "ios": {
        "simulator": true
      }
    }
  }
}
Terminal

Copy

eas build --platform ios --profile development
iOS Simulator builds can only be installed on simulators and not on real devices.

Read more about iOS Simulator builds on EAS.

2

Build the native app (iOS device)
Prerequisites

3 requirements

1.

Expo account

Sign up for an Expo account, if you haven't already.

2.

EAS CLI

The EAS CLI installed and logged in.

Terminal

Copy

npm install -g eas-cli && eas login
3.

Apple Developer account

A paid Apple Developer account for creating signing credentials so the app could be installed on an iOS device.

Terminal

Copy

eas build --platform ios --profile development
iOS device builds can only be installed on iPhone devices and not on iOS Simulators.

Read more about iOS device builds on EAS.

3

Install the app
You'll need to install the native app on your device, emulator, or simulator.

When building on EAS
If you create your development build on EAS, the CLI will prompt you to install the app after the build is finished. You can also install previous builds from the expo.dev dashboard or using Expo Orbit.

When building locally using EAS CLI
When building locally the output of the build will be an archive. You may drag and drop this on your Android Emulator/iOS Simulator to install it, or use Expo Orbit to install a build from your local machine.

4

Start the bundler
The development client built in step 2 is the native side of your app (basically your own version of Expo Go). To continue developing, you'll also want to start the JavaScript bundler.

Depending on how you built the app, this may already be running, but if you close the process for any reason, there is no need to rebuild your development client. Simply restart the JavaScript bundler with:

Terminal

Copy

npx expo start
This is the same command you would have used with Expo Go. It detects whether your project has expo-dev-client installed, in which case it will default to targeting your development build instead of Expo Go.

Video walkthroughs
"EAS Tutorial Series"
A course on YouTube: learn how to speed up your development with Expo Application Services.

"Async Office Hours: How to make a development build with EAS Build"
Learn how to make a development build with EAS Build in this video tutorial hosted by Developer Success Engineer: Keith Kurak.

Previous (Develop - Development builds)

Expo Go to development build

Next (Develop - Development builds)

Use a build

Was this doc helpful?



Share your feedback

Ask a question on the forums

Edit this page

Last updated on July 08, 2025
Sign up for the Expo Newsletter

reader@email.com

Sign Up
Unsubscribe at any time. Read our privacy policy.

