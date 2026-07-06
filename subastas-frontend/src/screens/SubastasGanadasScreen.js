import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
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

  const handleNavigate = (item) => {
    const isPaid = item.estado_pago === 'finalizado' || item.estado_pago === 'pagado';

    if (!isPaid) {
      // Los ítems pendientes se cobran automáticamente — no hay checkout manual
      Alert.alert(
        '⏳ Pago en proceso',
        'El pago de este ítem se procesa automáticamente al ganar la subasta.\n\nSi el cobro fue rechazado, revisá la sección de Deudas para regularizar tu situación.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Solo ítems ya pagados navegan al resumen de compra
    navigation.navigate('CheckoutGanador', { 
      articulo: {
        id: item.id,
        nombre: item.itemNombre,
        itemNombre: item.itemNombre,
        monto: item.monto,
        estado_pago: item.estado_pago,
        deudaId: item.deudaId,
        urlImagen: item.urlImagen,
        fecha: item.fecha,
        subastaId: item.subastaId,
        subastaNombre: item.subastaNombre,
        comision: item.comision,
        // Info para ítems pagados
        medioPagoUsado: item.medioPagoUsado,
        fechaPago: item.fechaPago,
        metodoEnvio: item.metodoEnvio,
        renunciaSeguro: item.renunciaSeguro,
        recibido: item.recibido,
      },
      usuario 
    });

    // ============================================================
    // CÓDIGO ORIGINAL — COMENTADO (navegaba siempre al checkout)
    // ============================================================
    // navigation.navigate('CheckoutGanador', { 
    //   articulo: {
    //     id: item.id,
    //     nombre: item.itemNombre,
    //     itemNombre: item.itemNombre,
    //     monto: item.monto,
    //     estado_pago: item.estado_pago,
    //     deudaId: item.deudaId,
    //     urlImagen: item.urlImagen,
    //     fecha: item.fecha,
    //     subastaId: item.subastaId,
    //     subastaNombre: item.subastaNombre,
    //     comision: item.comision,
    //     medioPagoUsado: item.medioPagoUsado,
    //     fechaPago: item.fechaPago,
    //     metodoEnvio: item.metodoEnvio,
    //     renunciaSeguro: item.renunciaSeguro,
    //     recibido: item.recibido,
    //   },
    //   usuario 
    // });
  };

  const renderItem = ({ item }) => {
    const isPaid = item.estado_pago === 'finalizado' || item.estado_pago === 'pagado';

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleNavigate(item)} activeOpacity={0.8}>
        {/* Imagen del producto */}
        {item.urlImagen ? (
          <Image source={{ uri: item.urlImagen }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={30} color="#CCC" />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemNombre}</Text>
            <Text style={styles.dateText}>Ganado el {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A'}</Text>
            <Text style={styles.montoText}>USD {item.monto?.toFixed(2)}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={[styles.badge, isPaid ? styles.badgePagado : styles.badgePendiente]}>
              <Ionicons 
                name={isPaid ? 'checkmark-circle' : 'time'} 
                size={12} 
                color={isPaid ? '#065F46' : '#991B1B'} 
              />
              <Text style={[styles.badgeText, isPaid ? styles.badgeTextPagado : styles.badgeTextPendiente]}>
                {isPaid ? 'Pagado' : 'Para Pagar'}
              </Text>
            </View>

            <View style={[styles.actionButton, isPaid && { backgroundColor: '#6B7280' }]}>
              <Text style={styles.actionText}>{isPaid ? 'Ver Resumen' : 'Gestionar'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: COLORS.CARD_BG, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE' 
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  emptyCard: { backgroundColor: '#FFF', padding: 40, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16, marginTop: 10 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 140,
  },
  imagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardInfo: {
    marginBottom: 12,
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
    marginBottom: 4,
  },
  montoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgePagado: {
    backgroundColor: '#D1FAE5',
  },
  badgePendiente: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  badgeTextPagado: {
    color: '#065F46',
  },
  badgeTextPendiente: {
    color: '#991B1B',
  }
});
