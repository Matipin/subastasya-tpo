import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register-1" options={{ headerShown: true, title: 'Crear Cuenta', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="register-2" options={{ headerShown: true, title: 'Crear Cuenta', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="register-3" options={{ headerShown: true, title: 'Crear Cuenta', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: true, title: 'Recupero de contraseña', headerBackTitle: 'Atrás' }} />
    </Stack>
  );
}
