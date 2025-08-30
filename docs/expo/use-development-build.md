Auto

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
Use a development build
Learn how to use development builds for a project.


Usually, creating a new native build from scratch takes long enough that you'll be tempted to switch tasks and lose your focus. However, with the development build installed on your device or an emulator/simulator, you won't have to wait for the native build process until you change the underlying native code that powers your app.

Start the development server
To start developing, run the following command to start the development server:

Terminal

Copy

npx expo start
To open the project inside your development client:

Press a or i keys to open your project on an Android Emulator or an iOS Simulator.
On a physical device, scan the QR code from your system's camera or a QR code reader to open the project on your device.
The launcher screen
If you launch the development build from your device's Home screen, you will see your launcher screen, which looks similar to the following:

The launcher screen of a development build
If a bundler is detected on your local network, or if you have signed in to an Expo account in both Expo CLI and your development build, you can connect to it directly from this screen. Otherwise, you can connect by scanning the QR code displayed by the Expo CLI.

Rebuild a development build
If you add a library to your project that contains native code APIs, for example, expo-secure-store, you will have to rebuild the development client. This is because the native code of the library is not included in the development client automatically when installing the library as a dependency on your project.

Debug a development build
When you need to, you can access the menu by pressing Cmd ⌘ + d or Ctrl + d in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your development build, any debugging functionality you need, or switch to a different version of your app.

See Debugging guide for more information.

Previous (Develop - Development builds)

Create a build on EAS

Next (Develop - Development builds)

Share with your team

Was this doc helpful?



Share your feedback

Ask a question on the forums

Edit this page

Last updated on August 26, 2025
Sign up for the Expo Newsletter

reader@email.com

Sign Up
Unsubscribe at any time. Read our privacy policy.

Use a development build - Expo Documentation