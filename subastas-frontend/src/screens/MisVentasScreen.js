import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function MisVentasScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/items/proposed?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filtrar aquellos que tienen informacion de venta incrustada (isVendido == true)
        const soldItems = data.filter(item => item.isVendido === true);
        
        // Mapear los campos viejos esperados a partir de los datos combinados
        const mappedSales = soldItems.map(p => ({
            id: p.identificador,
            nombre: p.descripcionCatalogo,
            montoVenta: p.montoVenta,
            comisionEmpresa: p.comisionEmpresa,
            pagoAlDuenio: p.pagoAlDuenio,
            pagadoPorComprador: p.pagadoPorComprador,
            fechaVenta: p.fechaVenta,
            urlImagen: p.urlImagen
        }));
        
        setVentas(mappedSales);
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
        {item.urlImagen ? (
          <Image source={{ uri: item.urlImagen }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.itemTitle}>{item.nombre}</Text>
          <Text style={styles.dateText}>Vendido: {item.fechaVenta}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name={item.pagadoPorComprador ? "checkmark-circle" : "time"} size={12} color={item.pagadoPorComprador ? "#059669" : "#D97706"} />
            <Text style={[styles.statusText, { color: item.pagadoPorComprador ? "#059669" : "#D97706" }]}>
              {item.pagadoPorComprador ? 'Pagado por el comprador' : 'Esperando pago'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.financialRow}>
        <Text style={styles.finLabel}>Precio Final de Venta</Text>
        <Text style={styles.finValue}>USD {item.montoVenta?.toLocaleString()}</Text>
      </View>
      <View style={styles.financialRow}>
        <Text style={styles.finLabel}>Comisión SubastasYa (Aprox 15%)</Text>
        <Text style={[styles.finValue, { color: '#DC2626' }]}>- USD {item.comisionEmpresa?.toLocaleString()}</Text>
      </View>
      
      <View style={[styles.divider, { borderStyle: 'dashed' }]} />
      
      <View style={styles.financialRow}>
        <Text style={styles.totalLabel}>Líquido a Cobrar</Text>
        <Text style={styles.totalValue}>USD {item.pagoAlDuenio?.toLocaleString()}</Text>
      </View>

      {item.pagadoPorComprador ? (
        <View style={styles.transferBox}>
          <Ionicons name="cash-outline" size={20} color="#059669" />
          <Text style={styles.transferText}>Dinero transferido a tu cuenta</Text>
        </View>
      ) : (
        <View style={[styles.transferBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
          <Text style={[styles.transferText, { color: '#D97706' }]}>El saldo se liberará al confirmarse el pago.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ventas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : ventas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetags-outline" size={60} color="#9CA3AF" />
          <Text style={styles.emptyText}>Aún no tienes productos vendidos.</Text>
        </View>
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
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
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  finValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  transferBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#34D399',
  },
  transferText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  }
});
