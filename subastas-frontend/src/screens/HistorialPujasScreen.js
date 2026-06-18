import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function HistorialPujasScreen({ navigation }) {
  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPujas();
  }, []);

  const fetchPujas = async () => {
    try {
      // Simulación de llamada a la API
      // const response = await fetch(`${API_BASE_URL}/users/me/bids`, { ... });
      // const data = await response.json();
      
      // Data de prueba basada en Figma 38
      const dummyData = [
        { id: '1', articulo: 'Reloj Vintage', subasta: 'Subasta de Arte y Antigüedades', monto: 15000, fecha: '10/06/2026' },
        { id: '2', articulo: 'Juego de Tazas', subasta: 'Subasta Colección Privada', monto: 3500, fecha: '08/06/2026' },
        { id: '3', articulo: 'Máquina de Coser', subasta: 'Subasta de Arte y Antigüedades', monto: 8000, fecha: '01/06/2026' },
      ];
      setPujas(dummyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.pujaCard}>
      <View style={styles.pujaHeader}>
        <Text style={styles.articuloTitle}>{item.articulo}</Text>
        <Text style={styles.monto}>${item.monto.toLocaleString()}</Text>
      </View>
      <Text style={styles.subastaText}>{item.subasta}</Text>
      <Text style={styles.fechaText}>Fecha de puja: {item.fecha}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Historial de pujas</Text>
          <Text style={styles.headerSubtitle}>realizadas(monto, subasta y articulo)</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pujas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No has realizado ninguna puja aún.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  pujaCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  pujaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articuloTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    flex: 1,
  },
  monto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  subastaText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  }
});
