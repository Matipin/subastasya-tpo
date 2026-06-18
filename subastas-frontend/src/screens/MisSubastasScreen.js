import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function MisSubastasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [subastas, setSubastas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubastas();
  }, []);

  const fetchSubastas = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/profile?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSubastas(data.subastasAnotadas || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={COLORS.PRIMARY} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.subastaNombre}>{item.nombre}</Text>
          <Text style={styles.subastaCategoria}>Categoría: {item.categoria || 'comun'}</Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.infoText}>Día: {item.fecha}</Text>
        <Text style={styles.infoText}>Hora: {item.hora ? item.hora.substring(0,5) : ''}</Text>
        <Text style={styles.estadoText}>Estado: {item.estado}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Subastas (Anotado)</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : subastas.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aún no estás anotado en ninguna subasta.</Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={subastas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
  content: { padding: 20 },
  emptyCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  listContent: { padding: 20 },
  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  subastaNombre: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  subastaCategoria: { fontSize: 14, color: '#666', marginTop: 2, textTransform: 'capitalize' },
  cardInfo: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  infoText: { fontSize: 14, color: '#333', marginBottom: 4 },
  estadoText: { fontSize: 14, fontWeight: 'bold', color: COLORS.PRIMARY, marginTop: 4, textTransform: 'capitalize' }
});
