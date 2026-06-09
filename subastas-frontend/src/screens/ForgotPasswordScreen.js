import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function ForgotPasswordScreen({ navigation }) {
  // Paso 1: solicitar email
  const [email, setEmail] = useState('');
  const [errorEmail, setErrorEmail] = useState('');

  // Paso 2: ingresar token + nueva contraseña
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorToken, setErrorToken] = useState('');
  const [errorNewPassword, setErrorNewPassword] = useState('');
  const [errorConfirmPassword, setErrorConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado general
  const [step, setStep] = useState(1); // 1 = email, 2 = token+clave, 3 = éxito
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (text) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(text);
  };

  // ── Paso 1: solicitar recuperación ──
  const handleSolicitarRecuperacion = async () => {
    setErrorEmail('');
    setErrorMessage('');

    if (!email.trim()) {
      setErrorEmail('El email es obligatorio.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorEmail('Formato de email inválido.');
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Siempre avanzamos al paso 2 (por seguridad no revelamos si el mail existe)
      setStep(2);
    } catch (error) {
      console.error('ForgotPassword error:', error);
      setErrorMessage('No se pudo conectar con el servidor. Verificá tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Paso 2: resetear contraseña con token ──
  const handleResetPassword = async () => {
    setErrorToken('');
    setErrorNewPassword('');
    setErrorConfirmPassword('');
    setErrorMessage('');

    let valid = true;
    if (!token.trim()) {
      setErrorToken('El código de recuperación es obligatorio.');
      valid = false;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorNewPassword('La contraseña debe tener al menos 6 caracteres.');
      valid = false;
    }
    if (newPassword !== confirmPassword) {
      setErrorConfirmPassword('Las contraseñas no coinciden.');
      valid = false;
    }
    if (!valid) return;

    setIsLoading(true);
    try {
      // Reutilizamos /activar (ya documentado) igual que en el registro etapa 2.
      // El backend acepta ACTIVO + activationToken para cambio de clave.
      const response = await fetch(`${API_BASE_URL}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password: newPassword }),
      });

      if (response.ok) {
        setStep(3);
      } else {
        const msg = await response.text();
        setErrorMessage(msg || 'Código inválido o ya utilizado. Solicitá uno nuevo.');
      }
    } catch (error) {
      console.error('ResetPassword error:', error);
      setErrorMessage('No se pudo conectar con el servidor. Verificá tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {step === 3 ? '¡Contraseña\nrestablecida!' : '¿Olvidaste tu\ncontraseña?'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Te enviaremos un código para que puedas restablecerla.'
              : step === 2
              ? 'Ingresá el código que te enviamos por correo.'
              : 'Ya podés iniciar sesión con tu nueva contraseña.'}
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={styles.dividerLineFull} />

        {/* ── Indicador de pasos ── */}
        {step < 3 && (
          <View style={styles.stepsRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            <View style={[styles.stepLine]} />
            <View style={[styles.stepDot]} />
          </View>
        )}

        {/* ── Ícono ── */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>
              {step === 3 ? '✅' : step === 2 ? '📬' : '🔑'}
            </Text>
          </View>
        </View>

        {/* ══════════════ PASO 1: EMAIL ══════════════ */}
        {step === 1 && (
          <>
            <Text style={styles.infoText}>
              Ingresá el correo electrónico asociado a tu cuenta y te enviaremos
              un código para recuperar el acceso.
            </Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, errorEmail ? styles.inputError : null]}
                placeholder="Ej: juan@mail.com"
                placeholderTextColor="#AAAAAA"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrorEmail(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSolicitarRecuperacion}
              />
              {errorEmail ? <Text style={styles.errorText}>⚠ {errorEmail}</Text> : null}
            </View>

            {errorMessage ? (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>⚠️  {errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSolicitarRecuperacion}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Enviar código de recuperación</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════ PASO 2: TOKEN + NUEVA CLAVE ══════════════ */}
        {step === 2 && (
          <>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerInfoTitle}>📧  Revisá tu correo</Text>
              <Text style={styles.bannerInfoText}>
                Si {email} está registrado y activo, habrás recibido un correo con el código.
                Revisá también la carpeta de spam.
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Código de recuperación</Text>
              <TextInput
                style={[styles.input, errorToken ? styles.inputError : null]}
                placeholder="Pegá aquí el código del correo"
                placeholderTextColor="#AAAAAA"
                value={token}
                onChangeText={(t) => { setToken(t); setErrorToken(''); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errorToken ? <Text style={styles.errorText}>⚠ {errorToken}</Text> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <View style={[styles.passwordContainer, errorNewPassword ? styles.inputError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#AAAAAA"
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setErrorNewPassword(''); }}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={{ paddingHorizontal: 10 }}
                >
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color={COLORS.TEXT_MAIN} />
                </TouchableOpacity>
              </View>
              {errorNewPassword ? <Text style={styles.errorText}>⚠ {errorNewPassword}</Text> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View style={[styles.passwordContainer, errorConfirmPassword ? styles.inputError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Repetí tu nueva contraseña"
                  placeholderTextColor="#AAAAAA"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setErrorConfirmPassword(''); }}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ paddingHorizontal: 10 }}
                >
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={COLORS.TEXT_MAIN} />
                </TouchableOpacity>
              </View>
              {errorConfirmPassword ? <Text style={styles.errorText}>⚠ {errorConfirmPassword}</Text> : null}
            </View>

            {errorMessage ? (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>⚠️  {errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Restablecer contraseña</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => { setStep(1); setErrorMessage(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>¿No recibiste el código? Volver a enviar</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════ PASO 3: ÉXITO ══════════════ */}
        {step === 3 && (
          <>
            <View style={styles.bannerSuccess}>
              <Text style={styles.bannerSuccessTitle}>¡Todo listo!</Text>
              <Text style={styles.bannerSuccessText}>
                Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión con tu nueva clave.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.submitText}>Ir al inicio de sesión</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Footer ── */}
        {step === 1 && (
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿Recordaste tu contraseña? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 30, paddingBottom: 60 },

  // ── Header ──
  header: { marginTop: 20, marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backArrow: { color: COLORS.PRIMARY, fontSize: 20, fontWeight: 'bold', marginRight: 6 },
  backText: { color: COLORS.PRIMARY, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.TEXT_TITLE, lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22 },

  // ── Divider ──
  dividerLineFull: { height: 1, backgroundColor: '#DDD', marginHorizontal: -30, marginBottom: 24 },

  // ── Steps indicator ──
  stepsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#DDD',
  },
  stepDotActive: { backgroundColor: COLORS.PRIMARY },
  stepLine: { flex: 1, height: 2, backgroundColor: '#DDD', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.PRIMARY },

  // ── Ícono ──
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E8E8E8',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  iconEmoji: { fontSize: 46 },

  // ── Info text ──
  infoText: { fontSize: 15, color: '#444', lineHeight: 23, marginBottom: 26, textAlign: 'center' },

  // ── Campo ──
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_TITLE, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C0C0C0',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, color: COLORS.TEXT_MAIN,
  },
  inputError: { borderColor: COLORS.ERROR, borderWidth: 1.5 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C0C0C0', borderRadius: 12 },
  passwordInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: COLORS.TEXT_MAIN },
  errorText: { color: COLORS.ERROR, fontSize: 12, marginTop: 5 },

  // ── Banners ──
  bannerInfo: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16,
    marginBottom: 22, borderLeftWidth: 4, borderLeftColor: '#3B82F6',
  },
  bannerInfoTitle: { color: '#1E40AF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  bannerInfoText: { color: '#1E40AF', fontSize: 13, lineHeight: 20 },
  bannerSuccess: {
    backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16,
    marginBottom: 22, borderLeftWidth: 4, borderLeftColor: '#10B981',
  },
  bannerSuccessTitle: { color: '#065F46', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  bannerSuccessText: { color: '#065F46', fontSize: 14, lineHeight: 20 },
  bannerError: {
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 16,
    marginBottom: 22, borderLeftWidth: 4, borderLeftColor: '#B91C1C',
  },
  bannerErrorText: { color: '#7F1D1D', fontSize: 14, lineHeight: 20 },

  // ── Botones ──
  submitButton: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 18, borderRadius: 30,
    alignItems: 'center', marginBottom: 20,
    shadowColor: COLORS.PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  submitButtonDisabled: { opacity: 0.55, shadowOpacity: 0, elevation: 0 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: '500' },

  // ── Footer ──
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  footerText: { color: '#555', fontSize: 14 },
  footerLink: { color: COLORS.TEXT_TITLE, fontSize: 14, fontWeight: 'bold' },
});
