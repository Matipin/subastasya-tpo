import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, AlertOctagon, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function DebtsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();

  const [debts, setDebts] = useState<any[]>([]);
  const [guarantee, setGuarantee] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [debtsRes, profileRes] = await Promise.all([
        supabase.from('debts').select('*').eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('profiles').select('guarantee_balance').eq('id', user.id).single()
      ]);

      if (debtsRes.data) setDebts(debtsRes.data);
      if (profileRes.data) setGuarantee(Number(profileRes.data.guarantee_balance || 0));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMockDebt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulamos que el usuario ganó una subasta pujando $150,000 y no pagó.
      // La regla dicta una multa del 10%.
      const bidAmount = 150000;
      const fineAmount = bidAmount * 0.10; // 10% = 15,000

      await supabase.from('debts').insert({
        user_id: user.id,
        amount: fineAmount,
        reason: `Multa del 10% por falta de fondos (Puja original: $${bidAmount.toLocaleString()})`,
        status: 'pending'
      });
      fetchData();
      Alert.alert('Multa Generada', `Se generó una multa del 10% ($${fineAmount.toLocaleString()}) por una supuesta puja impaga de $${bidAmount.toLocaleString()}.`);
    } catch(err) {
      console.error(err);
    }
  };

  const handlePay = (debt: any) => {
    Alert.alert('Pagar Deuda', `¿Confirmas el pago de $${debt.amount} deduciendo de tu garantía actual ($${guarantee})?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Pagar', 
        onPress: async () => {
          if (guarantee < debt.amount) {
             Alert.alert('Saldo Insuficiente', 'No tienes suficiente garantía para pagar esta multa. Agrega un método de pago.');
             return;
          }
          
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Mark debt as paid
            await supabase.from('debts').update({ status: 'paid' }).eq('id', debt.id);
            
            // 2. Register transaction
            await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'fine',
              amount: debt.amount,
              description: 'Pago de multa: ' + debt.reason
            });

            // 3. Deduct guarantee
            await supabase.from('profiles').update({ guarantee_balance: guarantee - debt.amount }).eq('id', user.id);

            Alert.alert('Éxito', 'Pago procesado. Tu deuda está saldada.');
            fetchData();
          } catch(err) {
            console.error(err);
            Alert.alert('Error', 'No se pudo pagar la deuda');
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
        <Text style={styles.headerTitle}>Mis Deudas y Multas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceText}>Garantía Disponible: ${guarantee.toLocaleString()}</Text>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color={Colors.light.tint} style={{marginTop: 50}} />
        ) : (
          <>
            {debts.length > 0 && (
              <View style={styles.warningBanner}>
                <AlertOctagon color={Colors.light.error} size={24} />
                <Text style={styles.warningText}>
                  Tienes deudas pendientes. Tu capacidad de pujar puede estar restringida.
                </Text>
              </View>
            )}

            {debts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tienes deudas pendientes.</Text>
              </View>
            ) : (
              debts.map(debt => (
                <View key={debt.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.debtType}>Multa del Sistema</Text>
                    <Text style={styles.debtAmount}>${Number(debt.amount).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.debtConcept}>{debt.reason}</Text>
                  <Text style={styles.debtDate}>Emitida: {new Date(debt.created_at).toLocaleDateString()}</Text>
                  
                  <TouchableOpacity style={styles.payButton} onPress={() => handlePay(debt)}>
                    <Text style={styles.payButtonText}>Pagar con Garantía</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.mockButton} onPress={handleCreateMockDebt}>
               <Plus color={Colors.light.textSecondary} size={20} />
               <Text style={styles.mockButtonText}>Simular Multa (Prueba)</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  content: { padding: 20 },
  balanceInfo: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  balanceText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211,47,47,0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.error,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: Colors.light.error,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  card: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debtType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.error,
  },
  debtConcept: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  debtDate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  payButton: {
    backgroundColor: Colors.light.text,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
