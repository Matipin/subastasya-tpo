import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function HistorialPujasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPujas();
  }, []);

  const fetchPujas = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/bids?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPujas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isWinner = item.ganador === true;
    const montoFormateado = `USD ${Number(item.monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    return (
      <View style={[styles.pujaCard, isWinner && styles.pujaCardGanador]}>
        <View style={styles.pujaHeader}>
          <Text style={styles.articuloTitle} numberOfLines={1}>{item.articulo}</Text>
          <Text style={[styles.monto, isWinner && styles.montoGanador]}>{montoFormateado}</Text>
        </View>
        <Text style={styles.subastaText}>{item.subasta}</Text>
        <View style={styles.pujaFooter}>
          <Text style={styles.fechaText}>
            {item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
          </Text>
          <View style={[styles.badge, isWinner ? styles.badgeGanador : styles.badgePerdedor]}>
            <Text style={[styles.badgeText, isWinner ? styles.badgeGanadorText : styles.badgePerdedorText]}>
              {isWinner ? '🏆 Ganador' : 'Participación'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Historial de pujas</Text>
          <Text style={styles.headerSubtitle}>Todas las pujas realizadas</Text>
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
  },
  pujaCardGanador: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  montoGanador: {
    color: '#059669',
  },
  pujaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeGanador: {
    backgroundColor: '#D1FAE5',
  },
  badgePerdedor: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeGanadorText: {
    color: '#065F46',
  },
  badgePerdedorText: {
    color: '#6B7280',
  },
});
