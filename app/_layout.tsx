import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: '(main)',
};

export default function RootLayout() {
  const { isAuthenticated, isGuest, isHydrated, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Initialize and synchronize auth on startup
  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !isGuest && !inAuthGroup) {
      setTimeout(() => router.replace('/(auth)/login'), 0);
    } else if ((isAuthenticated || isGuest) && inAuthGroup) {
      setTimeout(() => router.replace('/(main)'), 0);
    }
  }, [isAuthenticated, isGuest, isHydrated, segments, navigationState?.key]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="auction" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

