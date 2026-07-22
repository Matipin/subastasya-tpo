import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, PackageCheck, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function WonItemsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  
  const [wonItems, setWonItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generamos un item simulado para probar el flujo financiero
  const generateMockWonItem = () => {
    const newItem = {
      item_id: Math.floor(Math.random() * 1000),
      titulo: "Reloj de pulsera simulado",
      monto_pujado: 12000.00,
      comisiones: 1200.00,
      envio: 500.00,
      total_a_pagar: 13700.00,
      estado_pago: 'pendiente'
    };
    setWonItems([newItem, ...wonItems]);
  };

  const handleCheckout = (item: any) => {
    Alert.alert('Checkout', `¿Deseas pagar $${item.total_a_pagar} ahora con tu método de pago principal?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Pagar', 
        onPress: async () => {
          setLoading(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Transaction para el pago del artículo (Venta)
            await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'sale_payment',
              amount: item.total_a_pagar,
              description: `Pago de subasta ganada: ${item.titulo}`
            });

            // 2. Transaction interna de comisión retenida por la plataforma
            await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'commission',
              amount: item.comisiones,
              description: `Comisión cobrada por: ${item.titulo}`
            });

            setWonItems(prev => prev.map(w => w.item_id === item.item_id ? { ...w, estado_pago: 'pagado' } : w));
            Alert.alert('¡Felicidades!', 'El pago ha sido procesado exitosamente. La empresa retuvo su comisión.');
          } catch(err) {
             Alert.alert('Error', 'No se pudo procesar el pago.');
          } finally {
             setLoading(false);
          }
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
        {loading && <ActivityIndicator size="large" color={Colors.light.tint} style={{marginBottom: 20}} />}

        {wonItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aún no has ganado ninguna subasta.</Text>
          </View>
        ) : (
          wonItems.map((item, idx) => (
            <View key={idx} style={styles.card}>
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
                  <Text style={styles.totalValue}>${item.total_a_pagar.toLocaleString()} USD</Text>
                </View>
              </View>

              {item.estado_pago === 'pendiente' ? (
                <TouchableOpacity style={styles.checkoutButton} onPress={() => handleCheckout(item)}>
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

        <TouchableOpacity style={styles.mockButton} onPress={generateMockWonItem}>
           <Plus color={Colors.light.textSecondary} size={20} />
           <Text style={styles.mockButtonText}>Simular ganar una subasta</Text>
        </TouchableOpacity>
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
  mockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 40,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  mockButtonText: {
    marginLeft: 8,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});
