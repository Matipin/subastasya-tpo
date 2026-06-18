import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function SubastasGanadasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [wonItems, setWonItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWonItems = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/items/won?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWonItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWonItems();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="trophy" size={24} color="#F59E0B" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.itemName}>{item.itemNombre}</Text>
        <Text style={styles.dateText}>Ganado el {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A'}</Text>
        <Text style={styles.montoText}>Por USD {item.monto?.toFixed(2)}</Text>
      </View>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('CheckoutGanador', { item, usuario })}
      >
        <Text style={styles.actionText}>Gestionar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subastas Ganadas</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : wonItems.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyCard}>
            <Ionicons name="sad-outline" size={50} color="#CCC" />
            <Text style={styles.emptyText}>Aún no has ganado ninguna subasta.</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={wonItems}
          keyExtractor={(item) => item.id.toString()}
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 50,
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  montoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
