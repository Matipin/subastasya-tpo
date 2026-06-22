import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function DeudasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeudas = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/debts?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDeudas(data);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las deudas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeudas();
  }, []);

  const handlePay = (id, monto, motivo) => {
    navigation.navigate('CheckoutGanador', { 
      articulo: {
        id: id,
        deudaId: id,
        itemNombre: motivo,
        monto: monto,
        isDeuda: true,
        estado_pago: 'pendiente'
      },
      usuario 
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.motivoText}>{item.motivo}</Text>
        <Text style={styles.dateText}>
          {
            item.fechaCreacion ? (() => {
              // Assume format YYYY-MM-DD or similar if it's a string. If it's a timestamp, new Date is ok.
              if (typeof item.fechaCreacion === 'string' && item.fechaCreacion.includes('-') && !item.fechaCreacion.includes('T')) {
                 const parts = item.fechaCreacion.split('-');
                 if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
              }
              return new Date(item.fechaCreacion).toLocaleDateString();
            })() : ''
          }
        </Text>
        <Text style={[styles.montoText, item.pagada && { color: '#10B981' }]}>
          USD {item.monto.toFixed(2)}
        </Text>
      </View>
      <View style={styles.cardAction}>
        {item.pagada ? (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAGADO</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => handlePay(item.id, item.monto, item.motivo)}
          >
            <Text style={styles.payButtonText}>Pagar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deudas Pendientes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : deudas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={60} color="#10B981" />
          <Text style={styles.emptyText}>No tienes deudas pendientes.</Text>
        </View>
      ) : (
        <FlatList
          data={deudas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 15,
  },
  motivoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  montoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  cardAction: {
    justifyContent: 'center',
  },
  payButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paidBadgeText: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
