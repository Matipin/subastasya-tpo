import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function MisProductosScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductos = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/items/proposed?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProductos();
    }, [usuario])
  );

  const handleAcceptOffer = async (id) => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/items')}/${id}/decision?decision=aceptar&email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url, { method: 'POST' });
      if (response.ok) {
        const text = await response.text();
        Alert.alert('Oferta Aceptada', text || 'El producto pasará al catálogo.');
        fetchProductos();
      } else {
        Alert.alert('Error', 'No se pudo aceptar la oferta.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  const handleRejectOffer = async (id) => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/items')}/${id}/decision?decision=rechazar&email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url, { method: 'POST' });
      if (response.ok) {
        const text = await response.text();
        Alert.alert('Oferta Rechazada', text || 'Has rechazado la oferta sugerida. El producto no entrará a esta subasta.');
        fetchProductos();
      } else {
        Alert.alert('Error', 'No se pudo rechazar la oferta.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Con Oferta': return { color: '#F59E0B', bg: '#FEF3C7', icon: 'pricetag', text: 'Con Oferta' };
      case 'En validación': return { color: '#3B82F6', bg: '#DBEAFE', icon: 'hourglass', text: 'En validación' };
      case 'Pendiente de Envío': return { color: '#8B5CF6', bg: '#EDE9FE', icon: 'cube', text: 'Pendiente de Envío' };
      case 'Subastado': return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', text: 'Subastado' };
      case 'si': return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', text: 'Aprobado' };
      case 'vendido': return { color: '#059669', bg: '#A7F3D0', icon: 'cash', text: 'Vendido' };
      default: return { color: '#6B7280', bg: '#F3F4F6', icon: 'time', text: status || 'En revisión' };
    }
  };

  const renderItem = ({ item }) => {
    // Si disponible == 'no', significa que está pendiente de decisión de oferta
    const isConOferta = item.disponible === 'no';
    // Mantenemos el estado visual
    const status = isConOferta ? getStatusConfig('Con Oferta') : getStatusConfig(item.disponible === 'si' ? 'si' : item.descripcionCatalogo);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.descripcionCompleta}</Text>
          <Text style={styles.dateText}>
            Registrado: {
              item.fecha ? (() => {
                const parts = item.fecha.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : new Date(item.fecha).toLocaleDateString();
              })() : ''
            }
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        {isConOferta && (
          <View style={styles.offerSection}>
            <View style={styles.offerDetails}>
              <Text style={styles.offerLabel}>Precio base sugerido:</Text>
              <Text style={styles.offerPrice}>USD {item.precioSugerido || '1500.00'}</Text>
              <Text style={styles.offerNote}>Comisión estimada: 10% (USD {( (item.precioSugerido || 1500) * 0.1).toFixed(2)})</Text>
              <Text style={styles.offerNote}>Fecha asignada: dentro de 15 días</Text>
            </View>
            <View style={styles.offerActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAcceptOffer(item.identificador)}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectOffer(item.identificador)}>
                <Ionicons name="close" size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {item.disponible === 'vendido' && (
          <View style={styles.soldSection}>
            <View style={styles.soldDetails}>
              <Ionicons name="checkmark-done-circle" size={24} color="#059669" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.soldTitle}>¡Vendido y cobrado!</Text>
                <Text style={styles.soldText}>El monto de la venta ya ha sido transferido a tu cuenta.</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Productos</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : productos.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={50} color="#CCC" />
            <Text style={styles.emptyText}>No tienes productos listados.</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.identificador.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { padding: 20, paddingTop: 50, backgroundColor: COLORS.CARD_BG, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginBottom: 10 },
  backText: { color: COLORS.PRIMARY, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  emptyCard: { backgroundColor: '#FFF', padding: 40, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16, marginTop: 10 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardInfo: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  offerSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    marginTop: 10,
  },
  offerDetails: {
    marginBottom: 10,
  },
  offerLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  offerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginVertical: 2,
  },
  offerNote: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  offerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  soldSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  soldDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
  },
  soldTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
  },
  soldText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
    paddingRight: 30,
  }
});
