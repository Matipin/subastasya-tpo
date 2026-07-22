import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, CreditCard, Landmark, Plus, Trash2, ShieldCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function PaymentsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [guarantee, setGuarantee] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!authUser) return;
      
      // Fetch supabase user ID (assuming user state might just be the mock object, let's get the real session)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [paymentsRes, profileRes] = await Promise.all([
        supabase.from('payment_methods').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('guarantee_balance').eq('id', user.id).single()
      ]);

      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (profileRes.data) setGuarantee(Number(profileRes.data.guarantee_balance || 0));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    Alert.alert(
      'Agregar Tarjeta',
      '¿Deseas agregar una tarjeta de crédito simulada y acreditar $1000 a tu saldo de garantía?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Agregar', 
          onPress: async () => {
            setLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("No user");

              // 1. Insert Payment Method
              await supabase.from('payment_methods').insert({
                user_id: user.id,
                provider: 'Visa',
                card_number: '**** **** **** ' + Math.floor(1000 + Math.random() * 9000),
                type: 'CARD'
              });

              // 2. Add $1000 to guarantee
              await supabase.from('profiles').update({
                guarantee_balance: guarantee + 1000
              }).eq('id', user.id);

              Alert.alert('Éxito', 'Tarjeta agregada y garantía fondeada con $1000');
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'No se pudo agregar el medio de pago');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Estás seguro que deseas eliminar este medio de pago?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('payment_methods').delete().eq('id', id);
            setPayments(prev => prev.filter(p => p.id !== id));
            Alert.alert('Éxito', 'Medio de pago eliminado');
          } catch(err) {
            Alert.alert('Error', 'Error al eliminar');
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
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.guaranteeCard}>
          <ShieldCheck color={Colors.light.tint} size={32} />
          <View style={styles.guaranteeDetails}>
            <Text style={styles.guaranteeLabel}>Saldo de Garantía</Text>
            <Text style={styles.guaranteeAmount}>${guarantee.toLocaleString()}</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Administra tus tarjetas y cuentas bancarias. Es necesario tener al menos un medio de pago verificado y saldo de garantía para participar en las subastas.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} />
        ) : (
          <>
            {payments.map(payment => (
              <View key={payment.id} style={styles.card}>
                <View style={styles.cardIcon}>
                  {payment.type === 'CARD' ? (
                    <CreditCard color={Colors.light.tint} size={32} />
                  ) : (
                    <Landmark color={Colors.light.tint} size={32} />
                  )}
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.cardProvider}>{payment.provider}</Text>
                  <Text style={styles.cardNumber}>{payment.card_number}</Text>
                  <Text style={styles.cardExp}>Autenticado</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(payment.id)} style={styles.deleteButton}>
                  <Trash2 color={Colors.light.error} size={24} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={handleAddPayment}>
              <Plus color={Colors.light.tint} size={24} />
              <Text style={styles.addButtonText}>Agregar nueva tarjeta (Mock)</Text>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    padding: 20,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  guaranteeDetails: {
    marginLeft: 16,
  },
  guaranteeLabel: {
    fontSize: 14,
    color: '#004D40',
    fontWeight: '500',
  },
  guaranteeAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#004D40',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardProvider: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  cardExp: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(133, 34, 33, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
});
