import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Claude Remote Control' }} />
      <Stack.Screen name="demo" options={{ title: 'Demo Screen' }} />
      <Stack.Screen name="hello" options={{ title: 'Hello' }} />
      <Stack.Screen name="issues" options={{ title: 'Issues' }} />
      <Stack.Screen name="logs" options={{ title: 'Logs' }} />
    </Stack>
  );
}
