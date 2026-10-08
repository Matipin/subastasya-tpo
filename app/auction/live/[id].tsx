import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Clock, DollarSign, User, Zap, Trophy, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function LiveAuctionRoom() {
  const { id, item_id } = useLocalSearchParams<{ id: string; item_id?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [item, setItem] = useState<any | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);

  // Estados de subasta en vivo
  const [montoActual, setMontoActual] = useState(0);
  const [ultimoPostor, setUltimoPostor] = useState('Nadie');
  const [ultimoPostorId, setUltimoPostorId] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(120); // 2 minutos para el lote
  const [bidAmount, setBidAmount] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [userPaymentMethods, setUserPaymentMethods] = useState<any[]>([]);

  // Modal de Subasta Finalizada / Ganador
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);

  const channelRef = useRef<any>(null);

  // Reglas de cálculo según TPO:
  // Base: starting_price
  // Incremento mínimo: 1% de la base
  // Incremento máximo: 20% de la base (excepto categorías oro y platino)
  const startingPrice = Number(item?.starting_price || 0);
  const minIncrement = Math.max(1, Math.round(startingPrice * 0.01));
  const maxIncrement = Math.round(startingPrice * 0.20);
  
  const isHighCategory = user?.category === 'gold' || user?.category === 'platinum';
  
  const pujaMinima = montoActual > 0 ? montoActual + minIncrement : startingPrice;
  const pujaMaxima = isHighCategory ? Infinity : (montoActual > 0 ? montoActual + maxIncrement : startingPrice + maxIncrement);

  const isCurrentLeader = user?.id && ultimoPostorId === user.id;

  // 1. Fetch Item & User payment methods
  useEffect(() => {
    let isMounted = true;

    const fetchItemAndContext = async () => {
      try {
        setLoadingItem(true);
        let foundItem: any = null;

        // Si tenemos item_id, buscar ese item
        if (item_id) {
          const { data } = await supabase.from('items').select('*').eq('id', item_id).single();
          if (data) foundItem = data;
        }

        // Si no tenemos item o falló, buscar el primer item del auction_id
        if (!foundItem && id) {
          const { data: auctionItems } = await supabase
            .from('items')
            .select('*')
            .eq('auction_id', id)
            .limit(1);
          if (auctionItems && auctionItems.length > 0) {
            foundItem = auctionItems[0];
          }
        }

        // Fallback global a cualquier item activo
        if (!foundItem) {
          const { data: fallbackItems } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          if (fallbackItems && fallbackItems.length > 0) {
            foundItem = fallbackItems[0];
          }
        }

        if (foundItem && isMounted) {
          setItem(foundItem);
          const base = Number(foundItem.starting_price || 0);
          setMontoActual(base);

          // Buscar historial de pujas previo
          const { data: bidsData } = await supabase
            .from('bids')
            .select('id, amount, created_at, bidder_id, profiles(first_name, last_name)')
            .eq('item_id', foundItem.id)
            .order('amount', { ascending: false });

          if (bidsData && bidsData.length > 0) {
            const highestBid = bidsData[0];
            const bidderProfile = highestBid.profiles as any;
            const bidderName = bidderProfile ? `${bidderProfile.first_name} ${bidderProfile.last_name || ''}`.trim() : 'Postor';
            
            setMontoActual(Number(highestBid.amount));
            setUltimoPostor(bidderName);
            setUltimoPostorId(highestBid.bidder_id);

            const formattedHistory = bidsData.map(b => {
              const prof = b.profiles as any;
              return {
                id: b.id,
                usuario: prof ? `${prof.first_name} ${prof.last_name || ''}`.trim() : 'Postor',
                monto: Number(b.amount),
                time: new Date(b.created_at).toLocaleTimeString()
              };
            });
            setHistory(formattedHistory);
          }
        }

        // Fetch User payment methods
        if (user) {
          const { data: pmData } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id);
          if (pmData && isMounted) {
            setUserPaymentMethods(pmData);
          }
        }

      } catch (err) {
        console.error('Error fetching item and bids:', err);
      } finally {
        if (isMounted) setLoadingItem(false);
      }
    };

    fetchItemAndContext();

    return () => {
      isMounted = false;
    };
  }, [id, item_id, user]);

  // 2. Realtime Channel (broadcast + postgres_changes)
  useEffect(() => {
    if (!item?.id) return;

    const channelName = `auction-room-${item.id}`;
    const myChannel = supabase.channel(channelName, {
      config: { broadcast: { self: true } }
    });

    const handleNewBid = (payload: { id: string; amount: number; bidder_id: string; usuario: string; created_at: string }) => {
      const newAmount = Number(payload.amount);
      setMontoActual(prev => (newAmount > prev ? newAmount : prev));
      setUltimoPostor(payload.usuario);
      setUltimoPostorId(payload.bidder_id);

      setHistory(prev => {
        if (prev.some(h => h.id === payload.id)) return prev;
        return [
          {
            id: payload.id,
            usuario: payload.usuario,
            monto: newAmount,
            time: new Date(payload.created_at || Date.now()).toLocaleTimeString()
          },
          ...prev
        ];
      });

      // Regla Anti-sniping: si quedan menos de 45 segundos, extender 45s
      setTiempoRestante(prev => (prev < 45 ? 45 : prev));
    };

    myChannel
      .on('broadcast', { event: 'new_bid' }, ({ payload }) => {
        handleNewBid(payload);
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${item.id}` },
        async (payload) => {
          const newBidAmount = Number(payload.new.amount);
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', payload.new.bidder_id)
            .single();
          const bidderName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Postor';

          handleNewBid({
            id: payload.new.id,
            amount: newBidAmount,
            bidder_id: payload.new.bidder_id,
            usuario: bidderName,
            created_at: payload.new.created_at
          });
        }
      )
      .on('broadcast', { event: 'auction_ended' }, () => {
        setTiempoRestante(0);
        finishAuction();
      })
      .subscribe();

    channelRef.current = myChannel;

    return () => {
      supabase.removeChannel(myChannel);
    };
  }, [item?.id]);

  // 3. Countdown Timer
  useEffect(() => {
    if (auctionEnded) return;

    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishAuction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionEnded, ultimoPostorId, montoActual, item]);

  const finishAuction = () => {
    setAuctionEnded(true);
    setWinnerModalVisible(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 4. Manejador de Puja
  const handleBid = async (customAmount?: number) => {
    if (!user) {
      Alert.alert('Acceso Requerido', 'Debes iniciar sesión para pujar.');
      return;
    }

    if (!item) return;

    // A. Validar que tenga al menos un método de pago verificado (TPO)
    if (userPaymentMethods.length === 0) {
      Alert.alert(
        'Método de Pago Requerido',
        'El reglamento estipula que debes poseer al menos un medio de pago registrado para pujar en vivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Registrar Método', onPress: () => router.push('/profile/payments') }
        ]
      );
      return;
    }

    // B. No pujar contra uno mismo
    if (isCurrentLeader) {
      Alert.alert('Líder Actual', 'Ya eres el mayor postor de esta subasta.');
      return;
    }

    // C. Determinar monto a pujar
    const finalBidAmount = customAmount !== undefined ? customAmount : Number(bidAmount.replace(/,/g, ''));

    if (!finalBidAmount || isNaN(finalBidAmount)) {
      Alert.alert('Monto Inválido', 'Por favor ingresa un monto numérico válido.');
      return;
    }

    // D. Validar límites de puja (TPO)
    if (finalBidAmount < pujaMinima) {
      Alert.alert('Puja Insuficiente', `La puja mínima es de $${pujaMinima.toLocaleString()} USD (Superando la última oferta en al menos 1% del valor base).`);
      return;
    }

    if (!isHighCategory && finalBidAmount > pujaMaxima) {
      Alert.alert(
        'Límite de Puja Excedido',
        `El reglamento limita la puja máxima a $${pujaMaxima.toLocaleString()} USD (máximo 20% del valor base sobre la oferta anterior). Este límite no aplica a usuarios Oro o Platino.`
      );
      return;
    }

    setSubmitting(true);
    try {
      let bidId = `bid-${Date.now()}`;
      let bidCreatedAt = new Date().toISOString();

      // 1. Intentar insertar en base de datos
      try {
        const { data: newBid, error: bidError } = await supabase
          .from('bids')
          .insert({
            item_id: item.id,
            bidder_id: user.id,
            amount: finalBidAmount
          })
          .select('id, amount, created_at, bidder_id')
          .single();

        if (newBid) {
          bidId = newBid.id;
          bidCreatedAt = newBid.created_at;
        } else if (bidError) {
          console.warn('Aviso de inserción en BD (se sincroniza por Realtime broadcast):', bidError.message);
        }
      } catch (dbErr) {
        console.warn('DB bids insert error:', dbErr);
      }

      const userName = `${user.first_name} ${user.last_name || ''}`.trim();

      // 2. Broadcast instantáneo a todos los participantes en la sala
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_bid',
          payload: {
            id: bidId,
            amount: finalBidAmount,
            bidder_id: user.id,
            usuario: userName,
            created_at: bidCreatedAt
          }
        });
      }

      setBidAmount('');
    } catch (err: any) {
      console.error('Error al realizar puja:', err);
      Alert.alert('Error', err.message || 'No se pudo registrar la oferta.');
    } finally {
      setSubmitting(false);
    }
  };


  if (loadingItem) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={{ color: Colors.light.textSecondary, marginTop: 12 }}>Ingresando a la Sala en Vivo...</Text>
      </View>
    );
  }

  const isUserWinner = user && ultimoPostorId === user.id && montoActual > 0;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header Unificado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{item?.title || 'Sala de Subasta'}</Text>
          <Text style={styles.headerSub}>Lote #{item?.id?.slice(0, 8)}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vista del Lote / Streaming */}
        <View style={styles.mediaContainer}>
          {item?.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.mediaImage} />
          ) : (
            <View style={[styles.mediaImage, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#94A3B8' }}>Sin transmisión de video</Text>
            </View>
          )}
          <View style={styles.mediaOverlay}>
            <Text style={styles.mediaTitle}>{item?.title}</Text>
            <Text style={styles.mediaBasePrice}>Base: ${startingPrice.toLocaleString()} USD</Text>
          </View>
        </View>

        {/* Panel de Estadísticas en Vivo */}
        <View style={styles.statsPanel}>
          <View style={styles.statBox}>
            <DollarSign color={Colors.light.tint} size={22} />
            <Text style={styles.statLabel}>Oferta Actual</Text>
            <Text style={styles.statValue}>${montoActual.toLocaleString()}</Text>
          </View>

          <View style={styles.statBox}>
            <Clock color={tiempoRestante < 30 ? Colors.light.error : Colors.light.text} size={22} />
            <Text style={styles.statLabel}>Tiempo Restante</Text>
            <Text style={[styles.statValue, tiempoRestante < 30 && { color: Colors.light.error }]}>
              {formatTime(tiempoRestante)}
            </Text>
          </View>
        </View>

        {/* Indicador de Líder Actual */}
        <View style={[styles.leaderBar, isCurrentLeader && styles.leaderBarMine]}>
          <User color={isCurrentLeader ? '#059669' : '#1D4ED8'} size={20} />
          <Text style={[styles.leaderText, isCurrentLeader && { color: '#065F46' }]}>
            {isCurrentLeader ? '🎉 ¡Tú eres el postor líder de este lote!' : `Líder actual: ${ultimoPostor}`}
          </Text>
        </View>

        {/* Botón de Test para Finalizar / Cerrar Subasta y probar Adjudicación */}
        <TouchableOpacity 
          style={styles.manualEndBtn}
          onPress={finishAuction}
        >
          <Trophy color="#B45309" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.manualEndText}>Cerrar Subasta / Adjudicar Lote Ahora (Prueba)</Text>
        </TouchableOpacity>

        {/* Historial de Pujas Recientes */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyHeading}>Historial de Ofertas en Vivo</Text>
          {history.length === 0 ? (
            <Text style={styles.noBidsText}>No hay pujas registradas aún. ¡Sé el primero!</Text>
          ) : (
            history.map((h, i) => (
              <View key={h.id || i} style={[styles.historyRow, i === 0 && styles.historyRowLatest]}>
                <View>
                  <Text style={[styles.historyUser, i === 0 && { fontWeight: 'bold', color: Colors.light.tint }]}>
                    {h.usuario} {i === 0 ? ' (Líder)' : ''}
                  </Text>
                  <Text style={styles.historyTime}>{h.time}</Text>
                </View>
                <Text style={[styles.historyAmount, i === 0 && { color: Colors.light.tint, fontSize: 16 }]}>
                  ${h.monto.toLocaleString()} USD
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Dock Inferior de Pujas (Siempre visible, nunca cortado) */}
      <View style={styles.biddingDock}>
        <View style={styles.biddingRulesRow}>
          <Text style={styles.biddingRuleText}>
            Mín: <Text style={{ fontWeight: 'bold' }}>${pujaMinima.toLocaleString()}</Text> (+1%)
          </Text>
          {!isHighCategory && (
            <Text style={styles.biddingRuleText}>
              Máx: <Text style={{ fontWeight: 'bold' }}>${pujaMaxima.toLocaleString()}</Text> (+20%)
            </Text>
          )}
        </View>

        {/* Botones de Puja Rápida */}
        <View style={styles.quickBidsRow}>
          <TouchableOpacity 
            style={styles.quickBidBtn} 
            onPress={() => handleBid(pujaMinima)}
            disabled={Boolean(submitting || isCurrentLeader)}
          >
            <Text style={styles.quickBidBtnText}>+ Mín (${pujaMinima.toLocaleString()})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickBidBtn} 
            onPress={() => handleBid(montoActual + Math.round(startingPrice * 0.05))}
            disabled={Boolean(submitting || isCurrentLeader)}
          >
            <Text style={styles.quickBidBtnText}>+ 5%</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickBidBtn} 
            onPress={() => handleBid(montoActual + Math.round(startingPrice * 0.10))}
            disabled={Boolean(submitting || isCurrentLeader)}
          >
            <Text style={styles.quickBidBtnText}>+ 10%</Text>
          </TouchableOpacity>

          {!isHighCategory && (
            <TouchableOpacity 
              style={styles.quickBidBtn} 
              onPress={() => handleBid(pujaMaxima)}
              disabled={Boolean(submitting || isCurrentLeader)}
            >
              <Text style={styles.quickBidBtnText}>Máx (20%)</Text>
            </TouchableOpacity>
          )}
        </View>


        {/* Input de Puja Personalizada + Botón Pujar */}
        <View style={styles.inputActionRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.bidInput}
              placeholder={`Mínimo: ${pujaMinima}`}
              keyboardType="numeric"
              value={bidAmount}
              onChangeText={setBidAmount}
              editable={!isCurrentLeader && !submitting}
            />
          </View>

          <TouchableOpacity 
            style={[styles.bidSubmitButton, (isCurrentLeader || submitting) && styles.bidSubmitButtonDisabled]}
            onPress={() => handleBid()}
            disabled={isCurrentLeader || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Zap color="#FFF" size={18} style={{ marginRight: 6 }} />
                <Text style={styles.bidSubmitButtonText}>
                  {isCurrentLeader ? 'Liderando' : 'Pujar'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Finalización de Subasta */}
      <Modal
        visible={winnerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWinnerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {isUserWinner ? (
              <>
                <View style={[styles.modalIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <Trophy color="#059669" size={48} />
                </View>
                <Text style={styles.modalTitle}>¡FELICITACIONES!</Text>
                <Text style={styles.modalSubtitle}>Has ganado la subasta del lote:</Text>
                <Text style={styles.modalItemName}>{item?.title}</Text>
                <Text style={styles.modalPrice}>Monto final: ${montoActual.toLocaleString()} USD</Text>
                <Text style={styles.modalDesc}>
                  Para concretar la compra, selecciona el medio de pago a utilizar y la modalidad de entrega (retiro o envío).
                </Text>
                
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    setWinnerModalVisible(false);
                    router.replace(`/auction/settlement?itemId=${item?.id}&amount=${montoActual}`);
                  }}
                >
                  <Text style={styles.modalActionButtonText}>Proceder al Pago y Envío</Text>
                  <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.modalIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Clock color="#1D4ED8" size={48} />
                </View>
                <Text style={styles.modalTitle}>Subasta Finalizada</Text>
                <Text style={styles.modalSubtitle}>Este lote ha sido adjudicado:</Text>
                <Text style={styles.modalItemName}>{item?.title}</Text>
                <Text style={styles.modalPrice}>
                  {ultimoPostor !== 'Nadie' ? `Ganador: ${ultimoPostor} ($${montoActual.toLocaleString()} USD)` : 'Sin ofertas (Adquirido por SubastasYa)'}
                </Text>
                <Text style={styles.modalDesc}>
                  Gracias por tu participación. Puedes seguir explorando otros lotes activos en el catálogo.
                </Text>

                <TouchableOpacity 
                  style={[styles.modalActionButton, { backgroundColor: Colors.light.text }]}
                  onPress={() => {
                    setWinnerModalVisible(false);
                    router.replace('/(main)');
                  }}
                >
                  <Text style={styles.modalActionButtonText}>Volver al Catálogo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 50, paddingBottom: 12,
    backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 11, color: '#9CA3AF' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 5 },
  liveText: { color: '#EF4444', fontWeight: 'bold', fontSize: 11 },
  scrollContent: { paddingBottom: 20 },
  mediaContainer: { height: 220, position: 'relative', backgroundColor: '#000' },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  mediaOverlay: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: 10, borderRadius: 8,
  },
  mediaTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  mediaBasePrice: { color: '#93C5FD', fontSize: 12, marginTop: 2 },
  statsPanel: {
    flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#111827',
    borderBottomWidth: 1, borderBottomColor: '#1F2937',
  },
  statBox: {
    flex: 1, backgroundColor: '#1F2937', padding: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  leaderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E3A8A', marginHorizontal: 12, marginTop: 12,
    padding: 10, borderRadius: 8,
  },
  leaderBarMine: { backgroundColor: '#D1FAE5' },
  leaderText: { color: '#DBEAFE', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },
  manualEndBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF3C7', marginHorizontal: 12, marginTop: 8,
    padding: 8, borderRadius: 6,
  },
  manualEndText: { color: '#92400E', fontSize: 12, fontWeight: '600' },
  historyContainer: { padding: 16 },
  historyHeading: { fontSize: 14, fontWeight: 'bold', color: '#E2E8F0', marginBottom: 10 },
  noBidsText: { color: '#64748B', fontStyle: 'italic', fontSize: 13, textAlign: 'center', marginTop: 10 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  historyRowLatest: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, borderRadius: 6 },
  historyUser: { color: '#F1F5F9', fontSize: 13 },
  historyTime: { color: '#64748B', fontSize: 11, marginTop: 2 },
  historyAmount: { color: '#F1F5F9', fontSize: 14, fontWeight: 'bold' },
  biddingDock: {
    backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1F2937',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  biddingRulesRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  biddingRuleText: { color: '#9CA3AF', fontSize: 12 },
  quickBidsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  quickBidBtn: {
    flex: 1, backgroundColor: '#1F2937', paddingVertical: 8, borderRadius: 6,
    alignItems: 'center', borderWidth: 1, borderColor: '#374151',
  },
  quickBidBtnText: { color: '#93C5FD', fontSize: 11, fontWeight: 'bold' },
  inputActionRow: { flexDirection: 'row', gap: 10 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1F2937', borderRadius: 8, borderWidth: 1, borderColor: '#374151',
    paddingHorizontal: 12,
  },
  currencySymbol: { color: '#9CA3AF', fontSize: 16, fontWeight: 'bold', marginRight: 4 },
  bidInput: { flex: 1, height: 44, color: '#FFF', fontSize: 16 },
  bidSubmitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.light.tint, paddingHorizontal: 20, borderRadius: 8,
  },
  bidSubmitButtonDisabled: { opacity: 0.5 },
  bidSubmitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 24,
    alignItems: 'center', width: '100%', maxWidth: 400,
  },
  modalIconBox: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  modalSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
  modalItemName: { fontSize: 18, fontWeight: 'bold', color: Colors.light.tint, marginTop: 6, textAlign: 'center' },
  modalPrice: { fontSize: 16, fontWeight: 'bold', color: '#065F46', marginTop: 4 },
  modalDesc: { fontSize: 13, color: Colors.light.textSecondary, textAlign: 'center', marginVertical: 16, lineHeight: 18 },
  modalActionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.light.tint, width: '100%', paddingVertical: 14,
    borderRadius: 10,
  },
  modalActionButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
