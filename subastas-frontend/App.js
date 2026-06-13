import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import RegistroEtapa1Screen from './src/screens/RegistroEtapa1Screen';
import RegistroEtapa2Screen from './src/screens/RegistroEtapa2Screen';
import MedioPagoScreen from './src/screens/MedioPagoScreen';
import ProfileDashboardScreen from './src/screens/ProfileDashboardScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import GestionarMediosPagoScreen from './src/screens/GestionarMediosPagoScreen';
import DetalleArticuloScreen from './src/screens/DetalleArticuloScreen';
import SubastaEnVivoScreen from './src/screens/SubastaEnVivoScreen';
import PropuestaArticuloScreen from './src/screens/PropuestaArticuloScreen';
import DeudasScreen from './src/screens/DeudasScreen';
import NotificacionesScreen from './src/screens/NotificacionesScreen';
import MisSubastasScreen from './src/screens/MisSubastasScreen';
import SubastasGanadasScreen from './src/screens/SubastasGanadasScreen';
import MisProductosScreen from './src/screens/MisProductosScreen';
import MiCategoriaScreen from './src/screens/MiCategoriaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegistroEtapa1" component={RegistroEtapa1Screen} />
        <Stack.Screen name="RegistroEtapa2" component={RegistroEtapa2Screen} />
        <Stack.Screen name="MedioPago" component={MedioPagoScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProfileDashboard" component={ProfileDashboardScreen} />
        <Stack.Screen name="GestionarMediosPago" component={GestionarMediosPagoScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="DetalleArticulo" component={DetalleArticuloScreen} />
        <Stack.Screen name="SubastaEnVivo" component={SubastaEnVivoScreen} />
        <Stack.Screen name="PropuestaArticulo" component={PropuestaArticuloScreen} />
        <Stack.Screen name="Deudas" component={DeudasScreen} />
        <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        <Stack.Screen name="MisSubastas" component={MisSubastasScreen} />
        <Stack.Screen name="SubastasGanadas" component={SubastasGanadasScreen} />
        <Stack.Screen name="MisProductos" component={MisProductosScreen} />
        <Stack.Screen name="MiCategoria" component={MiCategoriaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
