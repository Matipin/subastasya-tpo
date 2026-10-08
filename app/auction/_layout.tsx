import { Stack } from 'expo-router';

export default function AuctionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="live/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settlement" options={{ headerShown: false }} />
    </Stack>
  );
}
