import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL.replace('/auth', '/users');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MetricCard = ({ icon, label, value, color }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIconBg, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

export default function ProfileDashboardScreen({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', left: 0, top: 0, flexDirection: 'row', alignItems: 'center'}}>
          <Ionicons name="arrow-back" size={18} color="#222" style={{marginRight: 8}} />
          <Text style={{color: '#222', fontWeight: 'bold', fontSize: 14}}>Home / Perfil</Text>
        </TouchableOpacity>
        
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{usuario?.nombre?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditarPerfil', { usuario })}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
        >
          <Ionicons name="pencil" size={16} color={COLORS.PRIMARY} />
          <Text style={{ color: COLORS.PRIMARY, marginLeft: 4, fontWeight: '600' }}>Editar Perfil</Text>
        </TouchableOpacity>
        <View style={styles.categoriaBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
          <Text style={styles.categoriaText}>{(usuario?.cliente?.categoria || 'COMUN').toUpperCase()}</Text>
        </View>
      </View>

      {/* Métricas visuales */}
      {metrics && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <MetricCard icon="gavel" label="Pujas" value={metrics.totalPujas || 0} color="#3B82F6" />
            <MetricCard icon="calendar" label="Subastas" value={metrics.subastasParticipadas || 0} color="#8B5CF6" />
            <MetricCard icon="trophy" label="Ganadas" value={metrics.subastasGanadas || 0} color="#F59E0B" />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard icon="trending-up" label="Ofertado" value={`$${(metrics.totalOfertado || 0).toLocaleString()}`} color="#10B981" />
            <MetricCard icon="wallet" label="Pagado" value={`$${(metrics.totalPagado || 0).toLocaleString()}`} color="#EF4444" />
            <MetricCard icon="storefront" label="Ventas" value={metrics.ventasRealizadas || 0} color="#06B6D4" />
          </View>
        </View>
      )}

      {/* Botones Superiores */}
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.halfButton} onPress={() => navigation.navigate('MisSubastas', { usuario })}>
          <Ionicons name="list-outline" size={18} color="#222" style={{ marginBottom: 4 }} />
          <Text style={styles.btnText}>Mis subastas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.halfButton} onPress={() => navigation.navigate('SubastasGanadas', { usuario })}>
          <Ionicons name="trophy-outline" size={18} color="#222" style={{ marginBottom: 4 }} />
          <Text style={styles.btnText}>Subastas ganadas</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('GestionarMediosPago', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="card-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Gestionar métodos de pago</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton}
        onPress={() => navigation.navigate('PropuestaArticulo', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="add-circle-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Postular venta de producto</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate('MisProductos', { usuario })}>
        <View style={styles.buttonContent}>
          <Ionicons name="cube-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Mis Productos</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate('MiCategoria', { usuario })}>
        <View style={styles.buttonContent}>
          <Ionicons name="ribbon-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Mi categoría</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      {/* Estadísticas */}
      <Text style={styles.sectionTitle}>Estadísticas</Text>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('HistorialPujas', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="analytics-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Total de pujas realizadas</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('SubastasGanadas', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="time-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Historial de subastas</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('MisVentas', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="pricetag-outline" size={20} color="#222" />
          <Text style={styles.btnText}>Ventas Realizadas (vendedor)</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.fullButton, { backgroundColor: '#FEE2E2', marginTop: 15 }]}
        onPress={() => navigation.navigate('Deudas', { usuario })}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="warning-outline" size={20} color="#B91C1C" />
          <Text style={[styles.btnText, { color: '#B91C1C' }]}>Deudas Pendientes</Text>
          <Ionicons name="chevron-forward" size={18} color="#B91C1C" />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 20, paddingBottom: 50 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginTop: 50, color: COLORS.ERROR },
  
  header: { alignItems: 'center', marginVertical: 30, paddingTop: 20 },
  avatar: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  avatarText: { fontSize: 60, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  categoriaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoriaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 4,
  },

  // Métricas
  metricsContainer: {
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  sectionTitle: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 15, marginTop: 10 },
  
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  halfButton: { 
    width: '48%', backgroundColor: '#F3F4F6', paddingVertical: 14, 
    borderRadius: 10, alignItems: 'center' 
  },
  fullButton: { 
    width: '100%', backgroundColor: '#F3F4F6', paddingVertical: 14, 
    borderRadius: 10, alignItems: 'center', marginBottom: 10,
    paddingHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  btnText: { fontSize: 14, fontWeight: 'bold', color: '#222', flex: 1, marginLeft: 10 }
});
