import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';
import MercadoPagoBrick from '../components/MercadoPagoBrick';

const API_BASE = API_BASE_URL.replace('/v1/auth', '');

export default function GestionarMediosPagoScreen({ navigation, route }) {
  // Try to get the user from route params, or somehow you need it passed or stored globally
  // In the wireframe flow, usually user is in route params or context.
  // ProfileDashboardScreen receives it, let's assume it passes it here
  const usuario = route?.params?.usuario;

  const [mediosPago, setMediosPago] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    if (usuario?.identificador) {
      fetchMediosPago();
    } else {
      setIsLoading(false);
      setMensaje({ tipo: 'error', texto: 'No se encontró el usuario' });
    }
  }, []);

  const fetchMediosPago = async () => {
    try {
      const response = await fetch(`${API_BASE}/medios-de-pago/lista?clienteId=${usuario.identificador}`);
      if (response.ok) {
        const data = await response.json();
        setMediosPago(data);
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al obtener tarjetas' });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/medios-de-pago/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchMediosPago();
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al eliminar tarjeta' });
        setIsLoading(false);
      }
    } catch (e) {
      setIsLoading(false);
      setMensaje({ tipo: 'error', texto: 'Error de conexión' });
    }
  };

  const handleMercadoPagoSubmit = async (cardFormData) => {
    setIsLoading(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const resPago = await fetch(`${API_BASE}/medios-de-pago/tarjeta?email=${encodeURIComponent(usuario.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardFormData),
      });

      if (resPago.ok) {
        setMensaje({ tipo: 'success', texto: 'Tarjeta añadida (Pendiente de validación)' });
        setShowAdd(false);
        fetchMediosPago();
      } else {
        const text = await resPago.text();
        setMensaje({ tipo: 'error', texto: text || 'Error al guardar la tarjeta.' });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error de conexión.' });
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Metodos{'\n'}de pago</Text>
        <Text style={styles.subtitle}>Gestiona tus tarjetas para{'\n'}pujar sin demoras</Text>

        {mensaje.texto ? (
          <View style={[styles.msgBox, mensaje.tipo === 'error' ? styles.msgError : styles.msgSuccess]}>
            <Text style={[styles.msgText, mensaje.tipo === 'error' ? styles.msgTextError : styles.msgTextSuccess]}>
              {mensaje.texto}
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.cardsContainer}>
            {mediosPago.map((mp, index) => {
              const isDefault = index === 0; // Simulation
              return (
                <View key={mp.identificador} style={styles.cardItem}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardBrand}>
                       {/* Hardcoded visual representation as per wireframe */}
                       {mp.entidad?.toLowerCase().includes('visa') ? (
                         <Text style={{fontWeight:'bold', color:'blue', fontSize:20}}>VISA</Text>
                       ) : (
                         <View style={{flexDirection:'row'}}>
                           <View style={{width:20,height:20,borderRadius:10,backgroundColor:'red'}}/>
                           <View style={{width:20,height:20,borderRadius:10,backgroundColor:'orange',marginLeft:-10}}/>
                         </View>
                       )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardNumber}>{mp.entidad || 'Tarjeta'}</Text>
                      {mp.titular ? <Text style={styles.cardOwner}>{mp.titular}</Text> : null}
                    </View>
                    {isDefault && mp.verificado && (
                      <View style={styles.badgeDefault}>
                        <Text style={styles.badgeText}>Predeterminada</Text>
                      </View>
                    )}
                    {!mp.verificado && (
                      <View style={styles.badgePending}>
                         <Text style={styles.badgePendingText}>Pendiente</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.iconBtn}>
                      <Ionicons name="pencil-outline" size={20} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleEliminar(mp.identificador)}>
                      <Ionicons name="trash-outline" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!showAdd ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(true)}>
            <Text style={styles.addText}>+ Añadir una nueva tarjeta</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <MercadoPagoBrick onSubmit={handleMercadoPagoSubmit} usuarioEmail={usuario?.email} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { padding: 20, paddingBottom: 50 },
  header: { marginBottom: 20, marginLeft: -10 },
  backButton: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  
  title: { fontSize: 48, fontWeight: 'bold', color: '#2C3E50', lineHeight: 52, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 30, lineHeight: 22 },

  cardsContainer: { marginBottom: 30 },
  cardItem: { 
    backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 15,
    borderWidth: 1, borderColor: '#DDD', shadowColor: '#000', shadowOffset:{width:0, height:2},
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardBrand: { width: 50, marginRight: 15, alignItems: 'center' },
  cardNumber: { fontSize: 16, fontWeight: '600', color: '#111' },
  cardOwner: { fontSize: 13, color: '#666', marginTop: 2 },
  badgeDefault: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, color: '#4F46E5', fontWeight: 'bold' },
  badgePending: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 5 },
  badgePendingText: { fontSize: 10, color: '#D97706', fontWeight: 'bold' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  iconBtn: { marginLeft: 15 },

  addButton: { 
    borderWidth: 1, borderColor: '#555', borderStyle: 'dashed', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginBottom: 30
  },
  addText: { fontSize: 16, fontWeight: '600', color: '#111' },

  addForm: { marginTop: 20 },
  cancelButton: { alignItems: 'center', padding: 15, marginTop: 10 },
  cancelText: { color: COLORS.ERROR, fontWeight: 'bold' },

  msgBox: { padding: 15, borderRadius: 8, marginBottom: 20 },
  msgSuccess: { backgroundColor: '#D1FAE5' },
  msgError: { backgroundColor: '#FEE2E2' },
  msgText: { fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  msgTextSuccess: { color: '#065F46' },
  msgTextError: { color: '#991B1B' },
});
