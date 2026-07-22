import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/mockApi';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync('saved_email');
        const savedPassword = await SecureStore.getItemAsync('saved_password');
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (err) {}
    };
    loadCredentials();
  }, []);
  
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (authError) throw authError;

      // Fetch profile to get complete user data
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) throw profileError;
      
      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
        await SecureStore.setItemAsync('saved_password', password);
      } else {
        await SecureStore.deleteItemAsync('saved_email');
        await SecureStore.deleteItemAsync('saved_password');
      }

      login(userProfile, data.session.access_token);
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>¡Hola de nuevo!</Text>
          <Text style={styles.subtitle}>Iniciá sesión para empezar a pujar.</Text>
        </View>

        {/* Placeholder for illustration */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('@/assets/images/illustration.png')} 
            style={{width: '100%', height: '100%', borderRadius: 8}}
            resizeMode="cover"
          />
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff color={Colors.light.textSecondary} size={20} />
              ) : (
                <Eye color={Colors.light.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center' }} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe ? (
                <CheckSquare color={Colors.light.tint} size={20} style={{ marginRight: 8 }} />
              ) : (
                <Square color={Colors.light.textSecondary} size={20} style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: Colors.light.textSecondary }}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Iniciando...' : 'Iniciar Sesion'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O ingresar como</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Entrar como invitado</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register-1')}>
            <Text style={styles.registerText}>Registrate aqui</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  illustrationContainer: {
    height: 200,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderRadius: 8,
  },
  illustrationText: {
    color: Colors.light.icon,
  },
  form: {
    gap: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: Colors.light.tint,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 4,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.light.textSecondary,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  outlineButtonText: {
    color: Colors.light.text,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: Colors.light.textSecondary,
  },
  registerText: {
    color: Colors.light.text,
    fontWeight: 'bold',
  },
});
