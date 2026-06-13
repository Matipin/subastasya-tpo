import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL.replace('/auth', '/users');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileDashboardScreen({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    if (usuario?.email) {
      fetchMetrics();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/me/metrics?email=${usuario.email}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified metrics for the wireframe view
  const toggleAccordion = () => {};

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró el usuario. Inicia sesión.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', left: 0, top: 0}}>
          <Text style={{color: COLORS.TEXT_TITLE, fontWeight: 'bold', fontSize: 16}}>← Home / Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Notificaciones', { usuario })}
          style={{position: 'absolute', right: 0, top: 0}}
        >
          <Text style={{color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 16}}>🔔 Avisos</Text>
        </TouchableOpacity>
        
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{usuario?.nombre?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
      </View>

      {/* Botones Superiores */}
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.halfButton}>
          <Text style={styles.btnText}>Mis subastas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.halfButton}>
          <Text style={styles.btnText}>Subastas ganadas</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('GestionarMediosPago', { usuario })}
      >
        <Text style={styles.btnText}>Gestionar metodos de pago</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton}
        onPress={() => navigation.navigate('PropuestaArticulo', { usuario })}
      >
        <Text style={styles.btnText}>Postular venta de producto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton}>
        <Text style={styles.btnText}>Mis Productos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton}>
        <Text style={styles.btnText}>Mi categoria</Text>
      </TouchableOpacity>

      {/* Estadísticas */}
      <Text style={styles.sectionTitle}>Estadísticas</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{metrics ? metrics.totalPujas : '-'}</Text>
          <Text style={styles.metricLabel}>Pujas Realizadas</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{metrics ? metrics.subastasParticipadas : '-'}</Text>
          <Text style={styles.metricLabel}>Subastas (Participadas)</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{metrics ? metrics.ventasRealizadas : '-'}</Text>
          <Text style={styles.metricLabel}>Ventas (Catálogo)</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.fullButton, { backgroundColor: '#FEE2E2', marginTop: 15 }]}
        onPress={() => navigation.navigate('Deudas', { usuario })}
      >
        <Text style={[styles.btnText, { color: '#B91C1C' }]}>Deudas Pendientes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 20, paddingBottom: 50 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginTop: 50, color: COLORS.ERROR },
  
  header: { alignItems: 'center', marginVertical: 30 },
  avatar: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  avatarText: { fontSize: 60, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 32, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  
  sectionTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.TEXT_TITLE, marginBottom: 15, marginTop: 20 },
  
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  halfButton: { 
    width: '48%', backgroundColor: '#F0F0F0', paddingVertical: 15, 
    borderRadius: 8, alignItems: 'center' 
  },
  fullButton: { 
    width: '100%', backgroundColor: '#F0F0F0', paddingVertical: 15, 
    borderRadius: 8, alignItems: 'center', marginBottom: 10 
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#111' },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metricBox: { 
    flex: 1, backgroundColor: COLORS.CARD_BG, padding: 15, 
    borderRadius: 12, alignItems: 'center', marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.PRIMARY, marginBottom: 5 },
  metricLabel: { fontSize: 11, color: '#666', textAlign: 'center', fontWeight: '500' }
});
