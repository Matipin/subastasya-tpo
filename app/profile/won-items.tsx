import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, PackageCheck, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function WonItemsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  
  const [wonItems, setWonItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWonItems = async () => {
      if (!authUser) return;
      setLoading(true);
      try {
        // Find items that are sold and where this user has the highest bid
        const { data: allBids, error: bidsErr } = await supabase
          .from('bids')
          .select('item_id')
          .eq('bidder_id', authUser.id);
          
        if (bidsErr || !allBids || allBids.length === 0) return;
        
        const uniqueItems = Array.from(new Set(allBids.map(b => b.item_id)));
        const { data: items } = await supabase
          .from('items')
          .select('*')
          .in('id', uniqueItems);
        
        if (items) {
          const wonList = [];
          for (const item of items) {
            const { data: maxBid } = await supabase
              .from('bids')
              .select('amount, bidder_id')
              .eq('item_id', item.id)
              .order('amount', { ascending: false })
              .limit(1);

            if (maxBid && maxBid[0].bidder_id === authUser.id) {
              const amount = Number(maxBid[0].amount);
              wonList.push({
                item_id: item.id,
                titulo: item.title,
                monto_pujado: amount,
                comisiones: Math.round(amount * 0.1),
                envio: 15000,
                total_a_pagar: amount + Math.round(amount * 0.1),
                estado_pago: item.status === 'sold' ? 'pagado' : 'pendiente'
              });
            }
          }
          setWonItems(wonList);
        }
      } catch (err) {
        console.error('Error fetching won items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWonItems();
  }, [authUser]);

  const handleCheckout = (item: any) => {
    router.push(`/auction/settlement?itemId=${item.item_id}&amount=${item.monto_pujado}`);
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
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

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 16,
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
