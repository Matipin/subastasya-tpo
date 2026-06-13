import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', left: 0, top: 0, flexDirection: 'row', alignItems: 'center'}}>
          <Ionicons name="arrow-back" size={18} color="#222" style={{marginRight: 8}} />
          <Text style={{color: '#222', fontWeight: 'bold', fontSize: 14}}>Home / Perfil</Text>
        </TouchableOpacity>
        
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{usuario?.nombre?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
      </View>

      {/* Botones Superiores Eliminados porque están en estadísticas */}

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('GestionarMediosPago', { usuario })}
      >
        <Text style={styles.btnText}>Gestionar métodos de pago</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton}
        onPress={() => navigation.navigate('PropuestaArticulo', { usuario })}
      >
        <Text style={styles.btnText}>Postular venta de producto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate('MisProductos', { usuario })}>
        <Text style={styles.btnText}>Mis Productos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fullButton} onPress={() => navigation.navigate('MiCategoria', { usuario })}>
        <Text style={styles.btnText}>Mi categoría</Text>
      </TouchableOpacity>

      {/* Estadísticas */}
      <Text style={styles.sectionTitle}>Estadísticas</Text>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('MisSubastas', { usuario })}
      >
        <Text style={styles.btnText}>Total de pujas realizadas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('SubastasGanadas', { usuario })}
      >
        <Text style={styles.btnText}>Historial de subastas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.fullButton} 
        onPress={() => navigation.navigate('MisProductos', { usuario })}
      >
        <Text style={styles.btnText}>Ventas Realizadas (vendedor)</Text>
      </TouchableOpacity>

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
  
  header: { alignItems: 'center', marginVertical: 30, paddingTop: 20 },
  avatar: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#222',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  avatarText: { fontSize: 60, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  
  sectionTitle: { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 15, marginTop: 10 },
  
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  halfButton: { 
    width: '48%', backgroundColor: '#F3F4F6', paddingVertical: 12, 
    borderRadius: 6, alignItems: 'center' 
  },
  fullButton: { 
    width: '100%', backgroundColor: '#F3F4F6', paddingVertical: 14, 
    borderRadius: 6, alignItems: 'center', marginBottom: 10 
  },
  btnText: { fontSize: 13, fontWeight: 'bold', color: '#222' }
});
