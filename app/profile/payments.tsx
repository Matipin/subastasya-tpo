import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, CreditCard, Landmark, Plus, Trash2, ShieldCheck, Banknote, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import MercadoPagoBrick from '@/components/MercadoPagoBrick';

export default function PaymentsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [guarantee, setGuarantee] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [addingLoading, setAddingLoading] = useState(false);

  // States for Bank Account / Cheque
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!authUser) return;
      
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

  const handleSaveBankOrCheque = async () => {
    if (selectedPayment === 'BANK' && (!cbu || !bankName)) {
      Alert.alert('Error', 'Debe completar el nombre del banco y el CBU.');
      return;
    }
    if (selectedPayment === 'CHEQUE' && !chequeNumber) {
      Alert.alert('Error', 'Debe ingresar el número de cheque.');
      return;
    }

    setAddingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      let provider = '';
      let cardNumber = '';

      if (selectedPayment === 'BANK') {
        provider = `Transferencia - ${bankName}`;
        cardNumber = `CBU: ${cbu}`;
      } else {
        provider = 'Cheque Electrónico';
        cardNumber = `Nº ${chequeNumber}`;
      }

      const { error } = await supabase.from('payment_methods').insert({
        user_id: user.id,
        provider,
        card_number: cardNumber,
        type: selectedPayment
      });

      if (error) throw error;
      
      Alert.alert('Éxito', 'Medio de pago agregado correctamente');
      setIsAdding(false);
      resetForms();
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar el medio de pago');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleMpSubmit = async (data: any) => {
    setAddingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { error } = await supabase.from('payment_methods').insert({
        user_id: user.id,
        provider: 'MercadoPago - Tarjeta',
        card_number: 'Tokenizado por MP',
        type: 'CARD'
      });

      if (error) throw error;
      
      Alert.alert('Éxito', 'Tarjeta validada por MercadoPago correctamente');
      setIsAdding(false);
      resetForms();
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar la tarjeta');
    } finally {
      setAddingLoading(false);
    }
  };

  const resetForms = () => {
    setSelectedPayment(null);
    setCbu('');
    setAlias('');
    setBankName('');
    setChequeNumber('');
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
            <Text style={styles.guaranteeLabel}>Saldo de Garantía Activo</Text>
            <Text style={styles.guaranteeAmount}>${guarantee.toLocaleString()}</Text>
          </View>
        </View>

        {!isAdding ? (
          <>
            <Text style={styles.sectionTitle}>Tus Medios de Pago</Text>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.light.tint} />
            ) : (
              <>
                {payments.length === 0 && (
                  <Text style={styles.description}>No tienes métodos de pago guardados.</Text>
                )}
                {payments.map(payment => (
                  <View key={payment.id} style={styles.card}>
                    <View style={styles.cardIcon}>
                      {payment.type === 'CARD' && <CreditCard color={Colors.light.tint} size={28} />}
                      {payment.type === 'BANK' && <Landmark color={Colors.light.tint} size={28} />}
                      {payment.type === 'CHEQUE' && <Banknote color={Colors.light.tint} size={28} />}
                    </View>
                    <View style={styles.cardDetails}>
                      <Text style={styles.cardProvider}>{payment.provider}</Text>
                      <Text style={styles.cardNumber}>{payment.card_number}</Text>
                      <Text style={styles.cardExp}>Verificado</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(payment.id)} style={styles.deleteButton}>
                      <Trash2 color={Colors.light.error} size={24} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                  <Plus color={Colors.light.tint} size={24} />
                  <Text style={styles.addButtonText}>Agregar Método de Pago</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Nuevo Método de Pago</Text>
            
            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'CARD' && styles.paymentOptionSelected]} 
              onPress={() => setSelectedPayment('CARD')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CreditCard color={selectedPayment === 'CARD' ? Colors.light.tint : Colors.light.textSecondary} size={24} style={{ marginRight: 12 }} />
                <Text style={styles.paymentText}>Tarjeta de Crédito / Débito</Text>
              </View>
              {selectedPayment === 'CARD' ? <CheckCircle2 color={Colors.light.tint} size={20} /> : <Plus color={Colors.light.textSecondary} size={20} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'BANK' && styles.paymentOptionSelected]} 
              onPress={() => setSelectedPayment('BANK')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Landmark color={selectedPayment === 'BANK' ? Colors.light.tint : Colors.light.textSecondary} size={24} style={{ marginRight: 12 }} />
                <Text style={styles.paymentText}>Cuenta Bancaria</Text>
              </View>
              {selectedPayment === 'BANK' ? <CheckCircle2 color={Colors.light.tint} size={20} /> : <Plus color={Colors.light.textSecondary} size={20} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, selectedPayment === 'CHEQUE' && styles.paymentOptionSelected]} 
              onPress={() => setSelectedPayment('CHEQUE')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Banknote color={selectedPayment === 'CHEQUE' ? Colors.light.tint : Colors.light.textSecondary} size={24} style={{ marginRight: 12 }} />
                <Text style={styles.paymentText}>Cheque Electrónico</Text>
              </View>
              {selectedPayment === 'CHEQUE' ? <CheckCircle2 color={Colors.light.tint} size={20} /> : <Plus color={Colors.light.textSecondary} size={20} />}
            </TouchableOpacity>

            {selectedPayment === 'CARD' && (
              <View style={{ marginTop: 24 }}>
                <MercadoPagoBrick 
                  usuarioEmail={authUser?.email || 'usuario@test.com'} 
                  onSubmit={handleMpSubmit}
                />
              </View>
            )}

            {selectedPayment === 'BANK' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del Banco</Text>
                <TextInput style={styles.input} placeholder="Ej: Banco Nación" value={bankName} onChangeText={setBankName} />
                <Text style={styles.label}>CBU / CVU</Text>
                <TextInput style={styles.input} placeholder="22 dígitos" keyboardType="numeric" value={cbu} onChangeText={setCbu} />
                <Text style={styles.label}>Alias (Opcional)</Text>
                <TextInput style={styles.input} placeholder="Ej: mi.cuenta.banco" value={alias} onChangeText={setAlias} />
                
                <TouchableOpacity style={[styles.saveBtn, addingLoading && { opacity: 0.7 }]} onPress={handleSaveBankOrCheque} disabled={addingLoading}>
                  {addingLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Guardar Cuenta Bancaria</Text>}
                </TouchableOpacity>
              </View>
            )}

            {selectedPayment === 'CHEQUE' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Cheque</Text>
                <TextInput style={styles.input} placeholder="Ej: 12345678" keyboardType="numeric" value={chequeNumber} onChangeText={setChequeNumber} />
                
                <TouchableOpacity style={[styles.saveBtn, addingLoading && { opacity: 0.7 }]} onPress={handleSaveBankOrCheque} disabled={addingLoading}>
                  {addingLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Registrar Cheque</Text>}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsAdding(false); resetForms(); }} disabled={addingLoading}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  guaranteeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2F1',
    padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#B2DFDB',
  },
  guaranteeDetails: { marginLeft: 16 },
  guaranteeLabel: { fontSize: 14, color: '#004D40', fontWeight: '500' },
  guaranteeAmount: { fontSize: 28, fontWeight: 'bold', color: '#004D40', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 16 },
  description: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardDetails: { flex: 1 },
  cardProvider: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  cardNumber: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  cardExp: { fontSize: 12, color: Colors.light.tint, marginTop: 4, fontWeight: '600' },
  deleteButton: { padding: 8 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(133, 34, 33, 0.05)',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.tint, borderStyle: 'dashed', marginTop: 8,
  },
  addButtonText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: Colors.light.tint },
  addSection: { marginTop: 8 },
  paymentOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.light.border, borderRadius: 8, padding: 16,
    backgroundColor: Colors.light.card, marginBottom: 12,
  },
  paymentOptionSelected: { borderColor: Colors.light.tint, backgroundColor: 'rgba(133, 34, 33, 0.05)' },
  paymentText: { fontSize: 16, color: Colors.light.text, fontWeight: '500' },
  formGroup: { marginTop: 16, backgroundColor: Colors.light.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 16, marginBottom: 8
  },
  saveBtn: {
    backgroundColor: Colors.light.tint, height: 50, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 16
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { marginTop: 16, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: Colors.light.textSecondary, fontSize: 16, fontWeight: 'bold' },
});
