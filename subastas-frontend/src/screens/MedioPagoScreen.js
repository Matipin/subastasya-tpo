import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';
import MercadoPagoBrick from '../components/MercadoPagoBrick';

const TIPOS_PAGO = [
  { key: 'TARJETA', label: '💳 Tarjeta de Crédito/Débito' },
  { key: 'CUENTA_BANCARIA', label: '🏦 Cuenta Bancaria (CBU)' },
  { key: 'CHEQUE', label: '📄 Cheque' },
];

export default function MedioPagoScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;

  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [errors, setErrors] = useState({});
  const [mensajeError, setMensajeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!tipoSeleccionado) e.tipo = 'Seleccioná un tipo de medio de pago.';
    if (!numero.trim()) e.numero = 'Ingresá el número de tarjeta, CBU o cheque.';
    if (!titular.trim()) e.titular = 'Ingresá el nombre del titular.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMercadoPagoSubmit = async (cardFormData) => {
    setMensajeError('');
    if (!usuario?.email) {
      setMensajeError('No se pudo identificar al usuario. Cerrá sesión y volvé a ingresar.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/medios-de-pago/tarjeta?email=${encodeURIComponent(usuario.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardFormData),
      });

      if (response.ok) {
        const result = await response.json();
        // Return home on success
        navigation.replace('Home', { usuario });
      } else {
        const text = await response.text();
        setMensajeError(text || 'No se pudo guardar la tarjeta.');
      }
    } catch (error) {
      console.error(error);
      setMensajeError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (tipoSeleccionado === 'TARJETA') {
      // The MP Brick handles its own submit
      return;
    }

    if (!validate()) return;
    setMensajeError('');
    if (!usuario?.email) {
      setMensajeError('No se pudo identificar al usuario. Cerrá sesión y volvé a ingresar.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/medio-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usuario.email,
          tipo: tipoSeleccionado,
          numero: numero.trim(),
          titular: titular.trim(),
        }),
      });

      if (response.ok) {
        const usuarioActualizado = await response.json();
        navigation.replace('Home', { usuario: usuarioActualizado });
      } else {
        const text = await response.text();
        setMensajeError(text || 'No se pudo registrar el medio de pago.');
      }
    } catch (error) {
      console.error(error);
      setMensajeError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>💳</Text>
        <Text style={styles.title}>Medio de Pago</Text>
        <Text style={styles.subtitle}>Obligatorio para pujar en subastas</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Para participar activamente en las subastas, necesitás registrar al menos un medio de pago. Sin él, solo podrás ver las subastas.
        </Text>
      </View>

      {/* Selector de tipo */}
      <Text style={styles.sectionLabel}>Tipo de medio de pago *</Text>
      {errors.tipo ? <Text style={styles.errorText}>{errors.tipo}</Text> : null}
      <View style={styles.tiposContainer}>
        {TIPOS_PAGO.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tipoBtn, tipoSeleccionado === t.key && styles.tipoBtnSelected]}
            onPress={() => {
              setTipoSeleccionado(t.key);
              setErrors(p => ({ ...p, tipo: undefined }));
            }}
          >
            <Text style={[styles.tipoBtnText, tipoSeleccionado === t.key && styles.tipoBtnTextSelected]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MP Brick or standard inputs */}
      {tipoSeleccionado === 'TARJETA' ? (
        <MercadoPagoBrick onSubmit={handleMercadoPagoSubmit} usuarioEmail={usuario?.email} />
      ) : tipoSeleccionado ? (
        <>
          {/* Número */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              {tipoSeleccionado === 'CUENTA_BANCARIA' ? 'CBU *' : 'Número de cheque *'}
            </Text>
            <TextInput
              style={[styles.input, errors.numero && styles.inputError]}
              placeholder={
                tipoSeleccionado === 'CUENTA_BANCARIA' ? '0000000000000000000000' : 'Nro. de cheque'
              }
              placeholderTextColor="#AAAAAA"
              value={numero}
              onChangeText={v => { setNumero(v); setErrors(p => ({ ...p, numero: undefined })); }}
              keyboardType="numeric"
            />
            {errors.numero ? <Text style={styles.errorText}>{errors.numero}</Text> : null}
          </View>

          {/* Titular */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nombre del titular *</Text>
            <TextInput
              style={[styles.input, errors.titular && styles.inputError]}
              placeholder="Nombre Apellido"
              placeholderTextColor="#AAAAAA"
              value={titular}
              onChangeText={v => { setTitular(v); setErrors(p => ({ ...p, titular: undefined })); }}
              autoCapitalize="words"
            />
            {errors.titular ? <Text style={styles.errorText}>{errors.titular}</Text> : null}
          </View>
        </>
      ) : null}

      {mensajeError ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>⚠️  {mensajeError}</Text>
        </View>
      ) : null}

      {tipoSeleccionado !== 'TARJETA' && (
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleGuardar}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.submitText}>Guardar Medio de Pago</Text>
          }
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.replace('Home', { usuario })}
      >
        <Text style={styles.skipText}>Solo quiero ver subastas (sin pujar)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 24, paddingBottom: 50 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 20 },
  emoji: { fontSize: 50, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  infoBox: {
    backgroundColor: '#FFF8E1', borderRadius: 10,
    padding: 14, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#F59E0B',
  },
  infoText: { fontSize: 13, color: '#78350F', lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  tiposContainer: { marginBottom: 16 },
  tipoBtn: {
    borderWidth: 1.5, borderColor: '#DDD', borderRadius: 10,
    padding: 14, marginBottom: 10, backgroundColor: COLORS.CARD_BG,
  },
  tipoBtnSelected: { borderColor: COLORS.PRIMARY, backgroundColor: '#FDF0F0' },
  tipoBtnText: { fontSize: 15, color: '#555' },
  tipoBtnTextSelected: { color: COLORS.PRIMARY, fontWeight: '700' },
  fieldContainer: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.CARD_BG, borderWidth: 1,
    borderColor: '#DDD', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.TEXT_MAIN,
  },
  inputError: { borderColor: COLORS.ERROR, borderWidth: 1.5 },
  errorText: { color: COLORS.ERROR, fontSize: 12, marginTop: 4, marginBottom: 6 },
  submitButton: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 16,
    borderRadius: 10, alignItems: 'center', marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  skipBtn: { marginTop: 16, alignItems: 'center', padding: 10 },
  skipText: { color: '#888', fontSize: 13 },
  bannerError: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#B91C1C',
  },
  bannerErrorText: { color: '#7F1D1D', fontSize: 14, lineHeight: 20 },
});
