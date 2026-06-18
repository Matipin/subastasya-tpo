import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchProductos();
  }, []);

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

  const renderItem = ({ item }) => {
    const isConOferta = item.descripcionCatalogo === 'Con Oferta';
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.descripcionCompleta}</Text>
          <Text style={styles.dateText}>Registrado: {new Date(item.fecha).toLocaleDateString()}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.descripcionCatalogo === 'si' ? 'Aprobado' : (item.descripcionCatalogo || 'En revisión')}</Text>
          </View>
        </View>

        {isConOferta && (
          <View style={styles.offerActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAcceptOffer(item.identificador)}>
              <Text style={styles.actionBtnText}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectOffer(item.identificador)}>
              <Text style={styles.actionBtnText}>Rechazar</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  actionBtn: {
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
    fontWeight: 'bold',
    fontSize: 14,
  }
});
