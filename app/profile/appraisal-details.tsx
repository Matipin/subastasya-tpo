import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronLeft, Info, DollarSign, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function AppraisalDetailsScreen() {
  const router = useRouter();
  const { proposalId, notificationId, price } = useLocalSearchParams<{ proposalId: string, notificationId: string, price: string }>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const basePrice = Number(price) || 1500;
  const commissionPercentage = 15; // 15% comisión de plataforma simulada
  const commissionValue = (basePrice * commissionPercentage) / 100;
  const estimatedProfit = basePrice - commissionValue;

  const handleAccept = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!proposalId) throw new Error('Identificador de propuesta no encontrado');

      // 1. Obtener la propuesta
      const { data: proposal, error: propErr } = await supabase
        .from('item_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (propErr || !proposal) throw new Error('No se encontró la información de la propuesta');

      // 2. Marcar notificación como leída
      if (notificationId) {
        await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      }

      // 3. Marcar propuesta como aceptada
      await supabase.from('item_proposals').update({ status: 'accepted' }).eq('id', proposalId);

      // 4. Buscar subasta activa a la cual asignar el artículo
      const { data: activeAuctions } = await supabase
        .from('auctions')
        .select('id')
        .eq('status', 'active')
        .limit(1);

      let targetAuctionId = activeAuctions && activeAuctions.length > 0 ? activeAuctions[0].id : null;
      if (!targetAuctionId) {
        const { data: anyAuction } = await supabase.from('auctions').select('id').limit(1);
        if (anyAuction && anyAuction.length > 0) {
          targetAuctionId = anyAuction[0].id;
        }
      }

      // 5. Insertar el artículo en el catálogo (tabla items) con estado in_auction
      const itemImages = proposal.images && proposal.images.length > 0
        ? proposal.images
        : ['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500'];

      const finalStartingPrice = Number(proposal.proposed_price) || basePrice;

      const { data: newItem, error: itemError } = await supabase.from('items').insert({
        auction_id: targetAuctionId,
        owner_id: proposal.user_id,
        title: proposal.title,
        description: proposal.description,
        history: proposal.history || '',
        images: itemImages,
        starting_price: finalStartingPrice,
        status: 'in_auction'
      }).select().single();

      if (itemError) {
        console.error('Error insertando en items:', itemError);
        throw itemError;
      }

      // 6. Notificar al usuario que su artículo ya está en vivo en el catálogo
      await supabase.from('notifications').insert({
        user_id: proposal.user_id,
        title: '¡Artículo Publicado en Subasta!',
        message: `Tu artículo "${proposal.title}" fue aceptado y ya figura en el catálogo oficial de SubastasYa con un precio base de $${finalStartingPrice.toLocaleString()}.`,
        type: 'INFO',
        metadata: { item_id: newItem?.id }
      });

      // Redirigir a "Mis Productos"
      router.replace('/profile/my-items');
    } catch (err: any) {
      console.error('Error al aceptar tasación:', err);
      setErrorMsg(err.message || 'Ocurrió un error al aceptar la tasación.');
    } finally {
      setLoading(false);
    }
  };


  const handleReject = () => {
    if (proposalId) {
      router.push(`/profile/return-item?proposalId=${proposalId}&notificationId=${notificationId || ''}` as any);
    } else {
      router.back();
    }
  };


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles de Tasación</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.banner}>
          <CheckCircle2 color="#059669" size={24} style={{ marginRight: 10 }} />
          <Text style={styles.bannerText}>¡Tu artículo ha sido tasado exitosamente!</Text>
        </View>

        <Text style={styles.sectionTitle}>Desglose Financiero</Text>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Precio Base Sugerido</Text>
            <Text style={styles.rowValue}>${basePrice.toLocaleString()} USD</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Comisión SubastasYa ({commissionPercentage}%)</Text>
            <Text style={[styles.rowValue, { color: '#EF4444' }]}>-${commissionValue.toLocaleString()} USD</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Ganancia Estimada Mínima</Text>
            <Text style={styles.totalValue}>${estimatedProfit.toLocaleString()} USD</Text>
          </View>
          <Text style={styles.note}>* El precio final de venta puede ser mucho mayor dependiendo de las pujas.</Text>
        </View>

        <Text style={styles.sectionTitle}>Próximos Pasos</Text>
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <Calendar color={Colors.light.tint} size={24} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Inclusión en el Catálogo</Text>
              <Text style={styles.stepDesc}>Al aceptar, tu artículo formará parte de nuestra próxima subasta exclusiva el mes que viene.</Text>
            </View>
          </View>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.disabledButton]} 
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Aceptar y Subastar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleReject}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Rechazar Oferta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// CheckCircle2 needs to be imported, doing it here inline for the component
import { CheckCircle2 } from 'lucide-react-native';

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
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 20,
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
    flex: 1,
    padding: 20,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  note: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
