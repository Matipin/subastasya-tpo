import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, PackageCheck } from 'lucide-react-native';

export default function WonItemsScreen() {
  const router = useRouter();

  const [wonItems, setWonItems] = useState([
    {
      item_id: 55,
      titulo: "Reloj de pulsera años 60",
      monto_pujado: 12000.00,
      comisiones: 1200.00,
      envio: 500.00,
      total_a_pagar: 13700.00,
      moneda: "ARS",
      estado_pago: "pendiente"
    }
  ]);

  const handleCheckout = (id: number) => {
    Alert.alert('Checkout', '¿Deseas pagar ahora y coordinar el retiro/envío?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Pagar', 
        onPress: () => {
          setWonItems(prev => prev.map(item => item.item_id === id ? { ...item, estado_pago: 'pagado' } : item));
          Alert.alert('¡Felicidades!', 'El pago ha sido procesado exitosamente.');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subastas Ganadas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {wonItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aún no has ganado ninguna subasta.</Text>
          </View>
        ) : (
          wonItems.map(item => (
            <View key={item.item_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <PackageCheck color={Colors.light.tint} size={24} />
                <Text style={styles.itemTitle}>{item.titulo}</Text>
              </View>
              
              <View style={styles.detailsBox}>
                <View style={styles.row}>
                  <Text style={styles.label}>Monto Pujado:</Text>
                  <Text style={styles.value}>${item.monto_pujado.toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Comisiones (10%):</Text>
                  <Text style={styles.value}>${item.comisiones.toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Costo de Envío:</Text>
                  <Text style={styles.value}>${item.envio.toLocaleString()}</Text>
                </View>
                <View style={[styles.row, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total a Pagar:</Text>
                  <Text style={styles.totalValue}>${item.total_a_pagar.toLocaleString()} {item.moneda}</Text>
                </View>
              </View>

              {item.estado_pago === 'pendiente' ? (
                <TouchableOpacity style={styles.checkoutButton} onPress={() => handleCheckout(item.item_id)}>
                  <Text style={styles.checkoutText}>Pagar y Coordinar Retiro</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>Pagado - Pendiente de Envío</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.light.card, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  content: { padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary },
  card: {
    backgroundColor: Colors.light.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginLeft: 12, flex: 1 },
  detailsBox: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 8, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: Colors.light.textSecondary, fontSize: 14 },
  value: { color: Colors.light.text, fontWeight: '500', fontSize: 14 },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.light.border },
  totalLabel: { color: Colors.light.text, fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: Colors.light.tint, fontSize: 18, fontWeight: 'bold' },
  checkoutButton: {
    backgroundColor: Colors.light.tint, padding: 16, borderRadius: 8, alignItems: 'center',
  },
  checkoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  paidBadge: {
    backgroundColor: '#E8F5E9', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#A5D6A7'
  },
  paidText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
});
