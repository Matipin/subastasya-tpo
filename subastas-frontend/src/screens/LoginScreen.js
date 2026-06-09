import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('saved_email');
        const storedPassword = await AsyncStorage.getItem('saved_password');
        if (storedEmail !== null && storedPassword !== null) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Failed to load credentials', e);
      }
    };
    loadCredentials();
  }, []);

  const validateEmail = (text) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  const handleLogin = async () => {
    let isValid = true;
    setErrorEmail('');
    setErrorPassword('');
    setErrorGeneral('');

    if (!email) {
      setErrorEmail('El email es obligatorio.');
      isValid = false;
    } else if (!validateEmail(email)) {
      setErrorEmail('Formato de email inválido.');
      isValid = false;
    }

    if (!password) {
      setErrorPassword('La contraseña es obligatoria.');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const usuario = await response.json();
        
        try {
          if (rememberMe) {
            await AsyncStorage.setItem('saved_email', email);
            await AsyncStorage.setItem('saved_password', password);
          } else {
            await AsyncStorage.removeItem('saved_email');
            await AsyncStorage.removeItem('saved_password');
          }
        } catch (e) {
          console.error('Failed to save credentials', e);
        }

        navigation.replace('Home', { usuario });
      } else if (response.status === 403) {
        const msg = await response.text();
        setErrorGeneral(msg);
      } else {
        setErrorGeneral('Credenciales incorrectas. Verificá tu email y contraseña.');
      }
    } catch (error) {
      console.error(error);
      setErrorGeneral('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>¡Hola de nuevo!</Text>
        <Text style={styles.subtitle}>Iniciá sesión para empezar a pujar.</Text>
      </View>

      <View style={styles.imagePlaceholder}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>SubastasYa</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errorEmail && styles.inputError]}
          placeholder="Correo electrónico"
          placeholderTextColor="#888"
          value={email}
          onChangeText={t => { setEmail(t); setErrorEmail(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <View style={[styles.passwordContainer, errorPassword && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={t => { setPassword(t); setErrorPassword(''); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: 10 }}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#888" />
          </TouchableOpacity>
        </View>
        {errorPassword ? <Text style={styles.errorText}>{errorPassword}</Text> : null}
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
             {rememberMe && <Text style={styles.checkboxCheckmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>Recordarme</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesion</Text>
        )}
      </TouchableOpacity>

      {errorGeneral ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>⚠️  {errorGeneral}</Text>
        </View>
      ) : null}

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>¿No tenes cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegistroEtapa1')}>
          <Text style={styles.registerLink}>Registrate aqui</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
        <Text style={styles.registerText}>¿Recibiste el correo? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegistroEtapa2')}>
          <Text style={styles.registerLink}>Activá tu cuenta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 25 }}>
        <TouchableOpacity onPress={() => navigation.replace('Home', { usuario: { isGuest: true, nombre: 'Invitado' } })}>
          <Text style={[styles.registerLink, { color: '#666', textDecorationLine: 'underline' }]}>Continuar como invitado</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    padding: 30,
  },
  headerContainer: { marginBottom: 20 },
  title: {
    fontSize: 28, fontWeight: 'bold',
    color: COLORS.TEXT_TITLE, marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: '#555' },
  imagePlaceholder: {
    height: 190, backgroundColor: '#FFF', borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginBottom: 30,
    borderWidth: 1, borderColor: '#EEE'
  },
  logoImage: { width: 120, height: 120 },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    color: '#852221',
    fontWeight: 'bold',
    textShadowColor: 'white',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    marginTop: -5,
  },
  inputContainer: { marginBottom: 20 },
  input: {
    borderBottomWidth: 1, borderBottomColor: '#000',
    paddingVertical: 10, paddingHorizontal: 5, fontSize: 16, color: COLORS.TEXT_MAIN,
  },
  inputError: { borderBottomColor: COLORS.ERROR, borderBottomWidth: 2 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000' },
  passwordInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 5, fontSize: 16, color: COLORS.TEXT_MAIN },
  errorText: { color: COLORS.ERROR, fontSize: 13, marginTop: 4 },
  optionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 30,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#555', marginRight: 8, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  checkboxCheckmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  checkboxText: { fontSize: 14, color: '#333' },
  forgotPasswordText: { fontSize: 14, color: '#7EADD6' }, // Light blue like wireframe
  errorBox: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    padding: 14, marginTop: 10, borderLeftWidth: 4, borderLeftColor: COLORS.ERROR,
  },
  errorBoxText: { color: '#7F1D1D', fontSize: 14, lineHeight: 20 },
  button: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 16,
    borderRadius: 30, alignItems: 'center', // Rounded pill
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  registerContainer: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 40,
  },
  registerText: { color: '#333', fontSize: 15 },
  registerLink: { color: '#1B263B', fontSize: 15, fontWeight: 'bold' },
});

