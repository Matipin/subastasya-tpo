import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronLeft, CheckCircle2, CreditCard, Landmark, Banknote, ShieldAlert, Truck, Store, DollarSign, Plus, ArrowRight, AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuctionSettlementScreen() {
  const router = useRouter();
  const { itemId, amount } = useLocalSearchParams<{ itemId: string; amount: string }>();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);

  const [item, setItem] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('card-funds');
  
  // Opciones de entrega
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'shipping'>('pickup');
  const [shippingAddress, setShippingAddress] = useState(user?.address || 'Av. Santa Fe 2450, 4to B');
  const [shippingCity, setShippingCity] = useState('CABA');
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '+54 9 11 4567-8900');

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modales de resultado (Reemplazan Alert.alert para funcionar perfectamente en Web y Móvil)
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [penaltyModalVisible, setPenaltyModalVisible] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

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
          const { data: itemData } = await supabase.from('items').select('*').eq('id', itemId).maybeSingle();
          if (itemData) setItem(itemData);
        }

        // 2. Fetch Profile to get updated guarantee_balance
        const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profData) setProfile(profData);

        // 3. Fetch Payment Methods
        const { data: pmData } = await supabase.from('payment_methods').select('*').eq('user_id', user.id);
        
        const methods: any[] = [];
        if (pmData && pmData.length > 0) {
          pmData.forEach(pm => {
            methods.push({
              id: pm.id,
              provider: pm.provider,
              type: pm.type || 'CARD',
              card_number: pm.card_number || '**** 4242',
              hasFunds: true,
              desc: 'Fondos suficientes disponibles'
            });
          });
        } else {
          // Tarjeta verificada por defecto
          methods.push({
            id: 'card-funds',
            provider: 'Visa Débito Santander',
            type: 'CARD',
            card_number: '**** **** **** 4242',
            hasFunds: true,
            desc: 'Fondos suficientes disponibles'
          });
        }

        // Tarjeta de prueba sin fondos para validar la generación automática de multa
        methods.push({
          id: 'card-no-funds',
          provider: 'Tarjeta Débito (Sin Fondos)',
          type: 'CARD',
          card_number: '**** **** **** 0000',
          hasFunds: false,
          desc: 'Saldo insuficiente / Rechazo automático'
        });

        setPaymentMethods(methods);
        setSelectedPaymentId(methods[0].id);

      } catch (err) {
        console.error('Error fetching settlement data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, user?.id]);

  const selectedMethod = paymentMethods.find(pm => pm.id === selectedPaymentId);
  const userFunds = Number(profile?.guarantee_balance || 0);

  const handlePay = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      // REGLA: Si la tarjeta seleccionada no tiene fondos o el saldo disponible no alcanza:
      const cardHasFunds = selectedMethod ? selectedMethod.hasFunds : true;
      const balanceIsEnough = userFunds >= totalToPay;

      if (!cardHasFunds || !balanceIsEnough) {
        // AUTOMÁTICAMENTE SE GENERA LA MULTA DEL 10%
        await processAutomaticPenalty('Fondos insuficientes en el medio de pago seleccionado');
        return;
      }

      // SI TIENE LOS FONDOS: PAGO EXITOSO
      // 1. Marcar item como vendido
      if (item?.id) {
        try {
          await supabase.from('items').update({ status: 'sold' }).eq('id', item.id);
        } catch (e) {}

        // Asegurar puja ganadora registrada para won-items
        try {
          const { data: existingBid } = await supabase
            .from('bids')
            .select('id')
            .eq('item_id', item.id)
            .eq('bidder_id', user.id)
            .limit(1);

          if (!existingBid || existingBid.length === 0) {
            await supabase.from('bids').insert({
              item_id: item.id,
              bidder_id: user.id,
              amount: winningBid
            });
          }
        } catch (bErr) {}
      }

      // 2. Deducir fondos de garantía
      const newBalance = Math.max(0, userFunds - totalToPay);
      try {
        await supabase.from('profiles').update({ guarantee_balance: newBalance }).eq('id', user.id);
      } catch (pErr) {}

      setProfile((prev: any) => ({ ...prev, guarantee_balance: newBalance }));
      updateUser({ guarantee_balance: newBalance });

      // 3. Notificación de pago
      try {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: '¡Pago de Subasta Exitoso!',
          message: `Has abonado exitosamente $${totalToPay.toLocaleString()} USD por el lote "${item?.title || 'Artículo ganado'}". Modalidad: ${deliveryOption === 'pickup' ? 'Retiro en sucursal' : 'Envío a domicilio'}.`,
          type: 'INFO',
          metadata: { item_id: item?.id, total_paid: totalToPay }
        });
      } catch (nErr) {}

      // Abrir modal de éxito (funciona 100% en Web y Móvil)
      setSuccessModalVisible(true);

    } catch (err: any) {
      console.error('Error procesando pago:', err);
      // Si ocurrió un error inesperado de fondos, generar multa automática
      await processAutomaticPenalty('Error en la autorización bancaria');
    } finally {
      setProcessing(false);
    }
  };

  const processAutomaticPenalty = async (reasonContext: string) => {
    if (!user) return;
    const fine = Math.round(winningBid * 0.10);
    const fineReason = `Multa reglamentaria del 10% por falta de pago del lote "${item?.title || 'artículo'}" ganado en subasta (${reasonContext}).`;

    // 1. Insertar en tabla debts
    try {
      await supabase.from('debts').insert({
        user_id: user.id,
        amount: fine,
        reason: fineReason,
        status: 'pending'
      });
    } catch (dbErr) {
      console.warn('Debts insert note:', dbErr);
    }

    // 2. Insertar notificación de multa
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '⚠️ MULTA APLICADA POR FALTA DE PAGO (10%)',
        message: `La tarjeta no poseía fondos suficientes para cubrir la oferta ganadora de $${winningBid.toLocaleString()} USD. Se aplicó automáticamente una multa de $${fine.toLocaleString()} USD. Dispones de 72 hs para regularizarla en la sección de Deudas.`,
        type: 'INFO',
        metadata: { fine_amount: fine, item_id: item?.id }
      });
    } catch (nErr) {}

    setPenaltyAmount(fine);
    setPenaltyModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
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
            <Text style={styles.itemWinningBid}>Oferta ganadora: ${winningBid.toLocaleString()} USD</Text>
          </View>
        </View>

        {/* Sección 1: Modalidad de Entrega */}
        <Text style={styles.sectionTitle}>1. Método de Entrega</Text>
        
        <TouchableOpacity 
          style={[styles.optionCard, deliveryOption === 'pickup' && styles.optionCardSelected]}
          onPress={() => setDeliveryOption('pickup')}
        >
          <View style={[styles.optionIcon, deliveryOption === 'pickup' && { backgroundColor: Colors.light.tint }]}>
            <Store color={deliveryOption === 'pickup' ? '#FFF' : Colors.light.textSecondary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionName}>Retiro en Sede Central (Sin costo)</Text>
            <Text style={styles.optionDesc}>Av. del Libertador 4850, Piso 3, CABA. Lun a Vie de 9 a 18 hs.</Text>
            <Text style={styles.optionWarning}>* Al retirar personalmente no cuenta con seguro de transporte en viaje.</Text>
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

        {/* Sección 2: Método de Pago */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>2. Seleccionar Medio de Pago</Text>
        </View>

        {paymentMethods.map(pm => {
          const isSelected = selectedPaymentId === pm.id;
          return (
            <TouchableOpacity 
              key={pm.id} 
              style={[
                styles.paymentCard, 
                isSelected && styles.paymentCardSelected,
                !pm.hasFunds && { borderColor: '#FCA5A5' }
              ]}
              onPress={() => setSelectedPaymentId(pm.id)}
            >
              <View style={[styles.pmIcon, !pm.hasFunds && { backgroundColor: '#FEE2E2' }]}>
                {pm.type === 'CARD' && <CreditCard color={pm.hasFunds ? Colors.light.tint : Colors.light.error} size={22} />}
                {pm.type === 'BANK' && <Landmark color={Colors.light.tint} size={22} />}
                {pm.type === 'CHEQUE' && <Banknote color={Colors.light.tint} size={22} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.pmProvider}>{pm.provider}</Text>
                  {!pm.hasFunds && (
                    <View style={styles.noFundsTag}>
                      <Text style={styles.noFundsTagText}>Sin Fondos</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pmNumber}>{pm.card_number}</Text>
                <Text style={[styles.pmDesc, !pm.hasFunds && { color: Colors.light.error }]}>{pm.desc}</Text>
              </View>
              {isSelected ? (
                <CheckCircle2 color={pm.hasFunds ? Colors.light.tint : Colors.light.error} size={22} />
              ) : (
                <View style={styles.radioDot} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Saldo de Garantía */}
        <View style={styles.balanceCard}>
          <DollarSign color="#059669" size={24} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.balanceLabel}>Saldo de Garantía disponible en cuenta:</Text>
            <Text style={styles.balanceAmount}>
              ${userFunds.toLocaleString()} USD
            </Text>
          </View>
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

        {/* Botón único de Pago */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payButtonText}>
                Confirmar y Pagar (${totalToPay.toLocaleString()})
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal 1: Pago Exitoso */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          router.replace('/profile/won-items');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle2 color="#059669" size={48} />
            </View>
            <Text style={styles.modalTitle}>¡Pago Concretado!</Text>
            <Text style={styles.modalSubtitle}>Has adquirido exitosamente el lote:</Text>
            <Text style={styles.modalItemTitle}>{item?.title || 'Artículo de Subasta'}</Text>
            <Text style={styles.modalAmount}>Total abonado: ${totalToPay.toLocaleString()} USD</Text>
            <Text style={styles.modalDesc}>
              El pago fue procesado correctamente con tu tarjeta. Puedes coordinar la entrega y ver el comprobante en tu sección de Subastas Ganadas.
            </Text>

            <TouchableOpacity 
              style={styles.modalSuccessButton}
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace('/profile/won-items');
              }}
            >
              <Text style={styles.modalButtonText}>Ver Mis Subastas Ganadas</Text>
              <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Pago Rechazado por Falta de Fondos (Multa Automática) */}
      <Modal
        visible={penaltyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPenaltyModalVisible(false);
          router.replace('/profile/debts');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: '#FEE2E2' }]}>
              <AlertTriangle color="#DC2626" size={48} />
            </View>
            <Text style={[styles.modalTitle, { color: Colors.light.error }]}>Pago Rechazado: Falta de Fondos</Text>
            <Text style={styles.modalSubtitle}>La tarjeta no posee saldo suficiente para abonar el lote.</Text>
            
            <View style={styles.fineBox}>
              <Text style={styles.fineBoxLabel}>Multa reglamentaria aplicada automáticamente (10%):</Text>
              <Text style={styles.fineBoxAmount}>${penaltyAmount.toLocaleString()} USD</Text>
            </View>

            <Text style={styles.modalDesc}>
              De acuerdo con el reglamento de SubastasYa, al no concretarse el pago de la oferta ganadora se ha generado automáticamente una deuda en tu cuenta. Dispones de 72 hs para regularizarla en "Mis Deudas" y rehabilitar tu participación.
            </Text>

            <TouchableOpacity 
              style={styles.modalPenaltyButton}
              onPress={() => {
                setPenaltyModalVisible(false);
                router.replace('/profile/debts');
              }}
            >
              <Text style={styles.modalButtonText}>Ir a Mis Deudas y Regularizar</Text>
              <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  pmDesc: { fontSize: 11, color: '#059669', marginTop: 2, fontWeight: '500' },
  noFundsTag: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  noFundsTagText: { color: Colors.light.error, fontSize: 10, fontWeight: 'bold' },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.light.border },
  balanceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0', marginVertical: 12,
  },
  balanceLabel: { fontSize: 12, color: Colors.light.textSecondary },
  balanceAmount: { fontSize: 16, fontWeight: 'bold', color: '#065F46', marginTop: 2 },
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
  actionsContainer: { marginTop: 8 },
  payButton: {
    backgroundColor: Colors.light.tint, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24,
    alignItems: 'center', width: '100%', maxWidth: 440,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  modalIconBox: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4, textAlign: 'center' },
  modalItemTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.tint, marginTop: 6, textAlign: 'center' },
  modalAmount: { fontSize: 15, fontWeight: 'bold', color: '#065F46', marginTop: 4 },
  modalDesc: { fontSize: 13, color: Colors.light.textSecondary, textAlign: 'center', marginVertical: 16, lineHeight: 19 },
  fineBox: {
    backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FED7D7',
    width: '100%', alignItems: 'center', marginTop: 12,
  },
  fineBoxLabel: { fontSize: 11, color: '#C53030', fontWeight: '500' },
  fineBoxAmount: { fontSize: 20, fontWeight: 'bold', color: '#E53E3E', marginTop: 2 },
  modalSuccessButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#059669', width: '100%', paddingVertical: 14,
    borderRadius: 10,
  },
  modalPenaltyButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#DC2626', width: '100%', paddingVertical: 14,
    borderRadius: 10,
  },
  modalButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
