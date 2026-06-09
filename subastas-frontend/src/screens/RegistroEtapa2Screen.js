import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';
import MercadoPagoBrick from '../components/MercadoPagoBrick';

export default function RegistroEtapa2Screen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Payment state
  const [tipoPago, setTipoPago] = useState(null); // 'BANK', 'CARD', 'CHECK'
  const [numeroPago, setNumeroPago] = useState('');
  const [titularPago, setTitularPago] = useState('');

  const [errors, setErrors] = useState({});
  const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim() || !email.includes('@')) e.email = 'Ingresá tu email.';
    if (!token.trim()) e.token = 'Pegá acá el token de activación.';
    if (!password || password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';
    
    if (!tipoPago) e.tipoPago = 'Seleccioná un método de pago.';
    if (tipoPago && !numeroPago.trim()) e.numeroPago = 'Ingresá el número correspondiente.';
    if (tipoPago && !titularPago.trim()) e.titularPago = 'Ingresá el titular.';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMercadoPagoSubmit = async (cardFormData) => {
    if (!validate()) return;
    setIsLoading(true);
    setMensajeGeneral({ tipo: '', texto: '' });
    
    try {
      // 1. Activar cuenta
      const resActivar = await fetch(`${API_BASE_URL}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      if (!resActivar.ok && resActivar.status !== 409) {
        const text = await resActivar.text();
        setMensajeGeneral({ tipo: 'error', texto: text || 'Error al guardar la clave.' });
        setIsLoading(false);
        return;
      }

      // 2. Guardar tarjeta en MP
      const resPago = await fetch(`${API_BASE_URL}/medios-de-pago/tarjeta?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardFormData),
      });

      if (resPago.ok) {
        setMensajeGeneral({ tipo: 'success', texto: '¡Cuenta activada y tarjeta guardada! Ya podés iniciar sesión.' });
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } else {
        const text = await resPago.text();
        setMensajeGeneral({ tipo: 'error', texto: text || 'Error al guardar el medio de pago.' });
      }
    } catch (error) {
      console.error(error);
      setMensajeGeneral({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngresar = async () => {
    if (tipoPago === 'CARD') {
      // MP Brick maneja su propio submit
      return;
    }
    if (!validate()) return;
    setIsLoading(true);
    setMensajeGeneral({ tipo: '', texto: '' });
    
    try {
      // 1. Activar cuenta (Set Password usando el token)
      const resActivar = await fetch(`${API_BASE_URL}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      if (!resActivar.ok && resActivar.status !== 409) {
        const text = await resActivar.text();
        setMensajeGeneral({ tipo: 'error', texto: text || 'Error al guardar la clave.' });
        setIsLoading(false);
        return;
      }

      // 2. Registrar Medio de Pago
      const resPago = await fetch(`${API_BASE_URL}/medio-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          tipo: tipoPago === 'BANK' ? 'CUENTA_BANCARIA' : tipoPago === 'CARD' ? 'TARJETA' : 'CHEQUE',
          numero: numeroPago.trim(),
          titular: titularPago.trim(),
        }),
      });

      if (resPago.ok) {
        const usuarioActualizado = await resPago.json();
        navigation.replace('Home', { usuario: usuarioActualizado });
      } else {
        const text = await resPago.text();
        setMensajeGeneral({ tipo: 'error', texto: text || 'Error al guardar el medio de pago.' });
      }
    } catch (error) {
      console.error(error);
      setMensajeGeneral({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccordion = (key, title) => {
    const isExpanded = tipoPago === key;
    return (
      <View style={styles.accordionContainer} key={key}>
        <TouchableOpacity 
          style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]} 
          onPress={() => { setTipoPago(isExpanded ? null : key); setErrors(p => ({...p, tipoPago: undefined})); }}
        >
          <Text style={styles.accordionTitle}>{title}</Text>
          <Text style={styles.accordionIcon}>+</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.accordionBody}>
            {key === 'CARD' ? (
              <MercadoPagoBrick onSubmit={handleMercadoPagoSubmit} />
            ) : (
              <>
                <TextInput
                  style={[styles.input, errors.numeroPago && styles.inputError]}
                  placeholder={key === 'BANK' ? 'CBU / Alias' : 'Numero de cheque'}
                  value={numeroPago}
                  onChangeText={v => { setNumeroPago(v); setErrors(p => ({...p, numeroPago: undefined})); }}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, {marginTop: 10}, errors.titularPago && styles.inputError]}
                  placeholder="Nombre del Titular"
                  value={titularPago}
                  onChangeText={v => { setTitularPago(v); setErrors(p => ({...p, titularPago: undefined})); }}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{marginBottom: 10}}>
            <Text style={{color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 16}}>← Volver al Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Etapa 3 de 3</Text>
        </View>
        <View style={styles.dividerLineFull} />

        <Text style={styles.sectionTitle}>Activación de Cuenta</Text>
        <Text style={styles.infoText}>Pegá tu email y el token que te enviamos por correo para validar tu cuenta y crear tu clave.</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tu Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Ej: juan@mail.com"
          placeholderTextColor="#AAAAAA"
          value={email}
          onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: undefined })); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Token de Activación</Text>
        <TextInput
          style={[styles.input, errors.token && styles.inputError]}
          placeholder="Pegá el token acá..."
          placeholderTextColor="#AAAAAA"
          value={token}
          onChangeText={v => { setToken(v); setErrors(p => ({ ...p, token: undefined })); }}
          autoCapitalize="none"
        />
        {errors.token ? <Text style={styles.errorText}>{errors.token}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Ej: Juan_Perez1234"
            placeholderTextColor="#AAAAAA"
            value={password}
            onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: undefined })); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingHorizontal: 10 }}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={COLORS.TEXT_MAIN} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Confirmar Contraseña</Text>
        <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Ej: Juan_Perez1234"
            placeholderTextColor="#AAAAAA"
            value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ paddingHorizontal: 10 }}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={COLORS.TEXT_MAIN} />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      <Text style={[styles.sectionTitle, {marginTop: 20}]}>Medios de pago</Text>
      <Text style={styles.infoText}>Selecciona y registra un metodo de pago (Obligatorio)</Text>
      
      {errors.tipoPago ? <Text style={styles.errorText}>{errors.tipoPago}</Text> : null}

      <View style={styles.accordionsWrapper}>
        {renderAccordion('BANK', 'Cuenta bancaria')}
        {renderAccordion('CARD', 'Tarjeta de credito')}
        {renderAccordion('CHECK', 'Cheque certificado')}
      </View>

      {mensajeGeneral.texto ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>⚠️ {mensajeGeneral.texto}</Text>
        </View>
      ) : null}

      {tipoPago !== 'CARD' && (
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleIngresar}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitText}>Ingresar</Text>
          }
        </TouchableOpacity>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 30, paddingBottom: 50 },
  header: { marginBottom: 20, marginTop: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  dividerLineFull: { height: 1, backgroundColor: '#DDD', marginHorizontal: -30, marginBottom: 20 },
  sectionTitle: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.TEXT_TITLE,
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: '#444', marginBottom: 20 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.TEXT_TITLE, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1,
    borderColor: '#777', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.TEXT_MAIN,
  },
  inputError: { borderColor: COLORS.ERROR, borderWidth: 1.5 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#777', borderRadius: 10 },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: COLORS.TEXT_MAIN },
  errorText: { color: COLORS.ERROR, fontSize: 12, marginTop: 4, marginBottom: 8 },
  
  accordionsWrapper: { marginBottom: 30 },
  accordionContainer: { marginBottom: 15 },
  accordionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#999', borderStyle: 'dashed', borderRadius: 10,
    padding: 18, backgroundColor: '#FAFAFA'
  },
  accordionHeaderActive: { borderColor: COLORS.PRIMARY, borderStyle: 'solid', backgroundColor: '#FDF0F0' },
  accordionTitle: { fontSize: 16, color: COLORS.PRIMARY, fontWeight: 'bold' },
  accordionIcon: { fontSize: 20, color: COLORS.PRIMARY, fontWeight: 'bold' },
  accordionBody: {
    borderWidth: 1, borderColor: '#DDD', borderTopWidth: 0,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    padding: 15, backgroundColor: '#FFF', marginTop: -5
  },

  submitButton: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 18,
    borderRadius: 30, alignItems: 'center', marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  bannerError: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#B91C1C',
  },
  bannerErrorText: { color: '#7F1D1D', fontSize: 14, lineHeight: 20 },
});
