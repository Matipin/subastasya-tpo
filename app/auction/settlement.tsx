import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronLeft, CheckCircle2, CreditCard, Landmark, Banknote, ShieldAlert, Truck, Store, MapPin, DollarSign, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuctionSettlementScreen() {
  const router = useRouter();
  const { itemId, amount } = useLocalSearchParams<{ itemId: string; amount: string }>();
  const user = useAuthStore(state => state.user);

  const [item, setItem] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  
  // Opciones de entrega
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'shipping'>('pickup');
  const [shippingAddress, setShippingAddress] = useState(user?.address || 'Av. Santa Fe 2450, 4to B');
  const [shippingCity, setShippingCity] = useState('CABA');
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '+54 9 11 4567-8900');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const winningBid = Number(amount) || 10000;
  const commissionPercentage = 0.10; // 10% comisiones de subasta
  const commissionAmount = Math.round(winningBid * commissionPercentage);
  const shippingCost = deliveryOption === 'shipping' ? 15000 : 0;
  const totalToPay = winningBid + commissionAmount + shippingCost;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // 1. Fetch Item
        if (itemId) {
          const { data: itemData } = await supabase.from('items').select('*').eq('id', itemId).single();
          if (itemData) setItem(itemData);
        }

        // 2. Fetch Profile to get updated guarantee_balance
        const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profData) setProfile(profData);

        // 3. Fetch Payment Methods
        const { data: pmData } = await supabase.from('payment_methods').select('*').eq('user_id', user.id);
        if (pmData && pmData.length > 0) {
          setPaymentMethods(pmData);
          setSelectedPaymentId(pmData[0].id);
        }
      } catch (err) {
        console.error('Error fetching settlement data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, user]);

  const handlePay = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      const availableFunds = Number(profile?.guarantee_balance || 0);

      // Si no posee el dinero para cumplir con el pago:
      if (availableFunds < totalToPay) {
        await applyPenaltyFine('Fondos insuficientes al momento de procesar el pago');
        return;
      }

      // Si tiene los fondos suficientes:
      // 1. Marcar item como vendido
      if (item?.id) {
        await supabase.from('items').update({ status: 'sold' }).eq('id', item.id);
      }

      // 2. Deducir fondos de garantía
      const newBalance = availableFunds - totalToPay;
      await supabase.from('profiles').update({ guarantee_balance: newBalance }).eq('id', user.id);

      // 3. Generar notificación de comprobante
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '¡Pago de Subasta Exitoso!',
        message: `Has abonado exitosamente $${totalToPay.toLocaleString()} por el lote "${item?.title || 'Artículo ganado'}". Método: ${deliveryOption === 'pickup' ? 'Retiro en sucursal' : 'Envío a domicilio'}.`,
        type: 'INFO',
        metadata: { item_id: item?.id, total_paid: totalToPay }
      });

      Alert.alert(
        '¡Pago Concretado!',
        `Se han procesado $${totalToPay.toLocaleString()} exitosamente. Puedes coordinar y seguir tu entrega en "Subastas Ganadas".`,
        [
          { text: 'Ver Mis Subastas Ganadas', onPress: () => router.replace('/profile/won-items') }
        ]
      );

    } catch (err: any) {
      console.error('Error procesando pago:', err);
      Alert.alert('Error', err.message || 'No se pudo procesar el pago.');
    } finally {
      setProcessing(false);
    }
  };

  const applyPenaltyFine = async (reasonContext: string) => {
    try {
      if (!user) return;
      // Regla TPO: "Si al momento de pagar el usuario no posee el dinero para cumplir con el pago, 
      // el usuario recibirá una multa equivalente al 10% del valor ofertado..."
      const fineAmount = Math.round(winningBid * 0.10);
      const fineReason = `Multa del 10% por falta de pago del lote "${item?.title || 'artículo'}" ganado en subasta (${reasonContext}).`;

      // Intentar insertar en tabla debts
      try {
        await supabase.from('debts').insert({
          user_id: user.id,
          amount: fineAmount,
          reason: fineReason,
          status: 'pending'
        });
      } catch (dbErr) {
        console.warn('Debts table insert warning (will notify user regardless):', dbErr);
      }

      // Crear notificación de alta prioridad al usuario
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '⚠️ MULTA APLICADA POR FALTA DE PAGO (10%)',
        message: `Se te ha aplicado una multa de $${fineAmount.toLocaleString()} USD por incumplimiento de pago de la oferta ganadora de $${winningBid.toLocaleString()}. Dispones de 72 hs para regularizar antes de pase judicial.`,
        type: 'INFO',
        metadata: { fine_amount: fineAmount, item_id: item?.id }
      });

      Alert.alert(
        'Multa Aplicada por Falta de Fondos',
        `De acuerdo con el reglamento oficial, se ha aplicado una multa del 10% ($${fineAmount.toLocaleString()}).\n\nDebes abonar esta multa antes de las 72 hs para poder volver a participar en futuras subastas.`,
        [
          { text: 'Ir a Mis Deudas y Multas', onPress: () => router.replace('/profile/debts') }
        ]
      );
    } catch (e: any) {
      console.error('Error aplicando multa:', e);
      router.replace('/profile/debts');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  const userFunds = Number(profile?.guarantee_balance || 0);
  const hasEnoughFunds = userFunds >= totalToPay;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adjudicación y Pago</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner de Victoria */}
        <View style={styles.winnerBanner}>
          <CheckCircle2 color="#059669" size={28} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.winnerText}>¡Felicitaciones! Has ganado el lote.</Text>
            <Text style={styles.winnerSubtext}>Completa el medio de pago y entrega para cerrar la operación.</Text>
          </View>
        </View>

        {/* Resumen del Lote */}
        <View style={styles.itemCard}>
          {item?.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#888' }}>Sin foto</Text>
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item?.title || 'Artículo de Subasta'}</Text>
            <Text style={styles.itemLot}>Lote #{item?.id?.slice(0, 8)}</Text>
            <Text style={styles.itemWinningBid}>Puja ganadora: ${winningBid.toLocaleString()} USD</Text>
          </View>
        </View>

        {/* Sección: Modalidad de Entrega */}
        <Text style={styles.sectionTitle}>1. Método de Entrega</Text>
        
        <TouchableOpacity 
          style={[styles.optionCard, deliveryOption === 'pickup' && styles.optionCardSelected]}
          onPress={() => setDeliveryOption('pickup')}
        >
          <View style={[styles.optionIcon, deliveryOption === 'pickup' && { backgroundColor: Colors.light.tint }]}>
            <Store color={deliveryOption === 'pickup' ? '#FFF' : Colors.light.textSecondary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionName}>Retiro en Sede Central (Sin costo adicional)</Text>
            <Text style={styles.optionDesc}>Av. del Libertador 4850, Piso 3, CABA. Lun a Vie de 9 a 18 hs.</Text>
            <Text style={styles.optionWarning}>* Al retirar personalmente, no cuenta con seguro de transporte en viaje.</Text>
          </View>
          {deliveryOption === 'pickup' && <CheckCircle2 color={Colors.light.tint} size={22} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, deliveryOption === 'shipping' && styles.optionCardSelected]}
          onPress={() => setDeliveryOption('shipping')}
        >
          <View style={[styles.optionIcon, deliveryOption === 'shipping' && { backgroundColor: Colors.light.tint }]}>
            <Truck color={deliveryOption === 'shipping' ? '#FFF' : Colors.light.textSecondary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionName}>Envío a Domicilio con Seguro ($15.000)</Text>
            <Text style={styles.optionDesc}>Transporte certificado y cobertura de seguro puerta a puerta.</Text>
          </View>
          {deliveryOption === 'shipping' && <CheckCircle2 color={Colors.light.tint} size={22} />}
        </TouchableOpacity>

        {deliveryOption === 'shipping' && (
          <View style={styles.addressForm}>
            <Text style={styles.formLabel}>Dirección de Envío Declarada</Text>
            <TextInput
              style={styles.input}
              placeholder="Calle y número"
              value={shippingAddress}
              onChangeText={setShippingAddress}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Ciudad"
                value={shippingCity}
                onChangeText={setShippingCity}
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Teléfono"
                value={shippingPhone}
                onChangeText={setShippingPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Sección: Método de Pago */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>2. Seleccionar Medio de Pago</Text>
          <TouchableOpacity onPress={() => router.push('/profile/payments')}>
            <Text style={{ color: Colors.light.tint, fontWeight: '600', fontSize: 13 }}>+ Administrar</Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.noPaymentsBox}>
            <CreditCard color={Colors.light.textSecondary} size={32} />
            <Text style={styles.noPaymentsText}>No tienes medios de pago registrados.</Text>
            <TouchableOpacity style={styles.addPaymentBtn} onPress={() => router.push('/profile/payments')}>
              <Plus color="#FFF" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.addPaymentBtnText}>Agregar Medio de Pago</Text>
            </TouchableOpacity>
          </View>
        ) : (
          paymentMethods.map(pm => {
            const isSelected = selectedPaymentId === pm.id;
            return (
              <TouchableOpacity 
                key={pm.id} 
                style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                onPress={() => setSelectedPaymentId(pm.id)}
              >
                <View style={styles.pmIcon}>
                  {pm.type === 'CARD' && <CreditCard color={Colors.light.tint} size={22} />}
                  {pm.type === 'BANK' && <Landmark color={Colors.light.tint} size={22} />}
                  {pm.type === 'CHEQUE' && <Banknote color={Colors.light.tint} size={22} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.pmProvider}>{pm.provider}</Text>
                  <Text style={styles.pmNumber}>{pm.card_number || 'Verificado'}</Text>
                </View>
                {isSelected ? <CheckCircle2 color={Colors.light.tint} size={22} /> : <View style={styles.radioDot} />}
              </TouchableOpacity>
            );
          })
        )}

        {/* Saldo de Garantía / Fondos del Usuario */}
        <View style={[styles.balanceCard, !hasEnoughFunds && { borderColor: Colors.light.error, backgroundColor: '#FFF5F5' }]}>
          <DollarSign color={hasEnoughFunds ? '#059669' : Colors.light.error} size={24} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.balanceLabel}>Fondos / Saldo de Garantía disponible:</Text>
            <Text style={[styles.balanceAmount, !hasEnoughFunds && { color: Colors.light.error }]}>
              ${userFunds.toLocaleString()} USD
            </Text>
          </View>
          {!hasEnoughFunds && (
            <View style={styles.insufficientBadge}>
              <Text style={styles.insufficientText}>Insuficiente</Text>
            </View>
          )}
        </View>

        {/* Desglose Financiero */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>3. Desglose Total a Abonar</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Oferta Ganadora en Sala:</Text>
            <Text style={styles.breakdownVal}>${winningBid.toLocaleString()} USD</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Comisiones de Martillero (10%):</Text>
            <Text style={styles.breakdownVal}>+${commissionAmount.toLocaleString()} USD</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Costo de Envío y Seguro:</Text>
            <Text style={styles.breakdownVal}>
              {deliveryOption === 'pickup' ? '$0 (Retiro en sede)' : '+$15.000 ARS'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.breakdownRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Total Liquidación:</Text>
            <Text style={styles.totalVal}>${totalToPay.toLocaleString()}</Text>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.payButton, (!hasEnoughFunds || processing) && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>
                {hasEnoughFunds ? `Confirmar y Pagar ($${totalToPay.toLocaleString()})` : 'Fondos Insuficientes'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Opción para simular / aplicar multa por falta de fondos requerida en TPO */}
          <TouchableOpacity 
            style={styles.penaltyButton}
            onPress={() => {
              Alert.alert(
                'Simulación de Falta de Pago',
                `¿Deseas simular que no posees los fondos para pagar la subasta de $${winningBid.toLocaleString()}?\n\nSe aplicará la multa reglamentaria del 10% ($${Math.round(winningBid * 0.1).toLocaleString()}).`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Aplicar Multa (10%)', style: 'destructive', onPress: () => applyPenaltyFine('No poseo los fondos requeridos') }
                ]
              );
            }}
          >
            <ShieldAlert color={Colors.light.error} size={18} style={{ marginRight: 6 }} />
            <Text style={styles.penaltyButtonText}>Declarar falta de fondos (Aplicar Multa 10%)</Text>
          </TouchableOpacity>
        </View>

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
  content: { padding: 20, paddingBottom: 40 },
  winnerBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5',
    padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#A7F3D0',
  },
  winnerText: { fontSize: 16, fontWeight: 'bold', color: '#065F46' },
  winnerSubtext: { fontSize: 13, color: '#047857', marginTop: 2 },
  itemCard: {
    flexDirection: 'row', backgroundColor: Colors.light.card,
    padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 20,
  },
  itemImage: { width: 90, height: 90, borderRadius: 8, resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  itemLot: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  itemWinningBid: { fontSize: 14, fontWeight: 'bold', color: Colors.light.tint, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.light.card,
    padding: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.light.border, marginBottom: 12,
  },
  optionCardSelected: { borderColor: Colors.light.tint, backgroundColor: '#FDF8F8' },
  optionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.background,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionName: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text },
  optionDesc: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  optionWarning: { fontSize: 11, color: '#B45309', marginTop: 4, fontStyle: 'italic' },
  addressForm: {
    backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  formLabel: { fontSize: 13, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 8, paddingHorizontal: 12, height: 42, fontSize: 14, marginBottom: 8,
  },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card,
    padding: 14, borderRadius: 10, borderWidth: 2, borderColor: Colors.light.border, marginBottom: 10,
  },
  paymentCardSelected: { borderColor: Colors.light.tint, backgroundColor: '#FDF8F8' },
  pmIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  pmProvider: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text },
  pmNumber: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.light.border },
  noPaymentsBox: {
    alignItems: 'center', padding: 24, backgroundColor: Colors.light.card,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  noPaymentsText: { color: Colors.light.textSecondary, marginTop: 8, marginBottom: 12 },
  addPaymentBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.tint,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
  },
  addPaymentBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0', marginVertical: 12,
  },
  balanceLabel: { fontSize: 12, color: Colors.light.textSecondary },
  balanceAmount: { fontSize: 16, fontWeight: 'bold', color: '#065F46', marginTop: 2 },
  insufficientBadge: { backgroundColor: Colors.light.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  insufficientText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  breakdownCard: {
    backgroundColor: Colors.light.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 20,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: Colors.light.textSecondary },
  breakdownVal: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  totalVal: { fontSize: 20, fontWeight: 'bold', color: Colors.light.tint },
  actionsContainer: { gap: 12 },
  payButton: {
    backgroundColor: Colors.light.tint, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  penaltyButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.error,
    backgroundColor: 'rgba(211, 47, 47, 0.05)',
  },
  penaltyButtonText: { color: Colors.light.error, fontSize: 14, fontWeight: '600' },
});
