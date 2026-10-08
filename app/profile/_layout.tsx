import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="my-auctions" options={{ headerShown: false }} />
      <Stack.Screen name="won-items" options={{ headerShown: false }} />
      <Stack.Screen name="payments" options={{ headerShown: false }} />
      <Stack.Screen name="propose-item" options={{ headerShown: false }} />
      <Stack.Screen name="my-items" options={{ headerShown: false }} />
      <Stack.Screen name="appraisal-details" options={{ headerShown: false }} />
      <Stack.Screen name="confirm-shipping" options={{ headerShown: false }} />
      <Stack.Screen name="debts" options={{ headerShown: false }} />
      <Stack.Screen name="return-item" options={{ headerShown: false }} />
    </Stack>
  );
}
