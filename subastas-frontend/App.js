import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/colors';

// Pantalla de Login (Mockup)
function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Login</Text>
      <Button 
        title="Ingresar a Home" 
        color={COLORS.PRIMARY}
        onPress={() => navigation.navigate('Home')} 
      />
    </View>
  );
}

// Pantalla Principal (Mockup)
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla Principal (Home)</Text>
      <Text style={styles.text}>¡Bienvenido a SubastasYa!</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: COLORS.CARD_BG,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Iniciar Sesión' }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'SubastasYa' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: COLORS.TEXT_MAIN,
  }
});
