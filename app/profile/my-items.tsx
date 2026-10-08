import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Box, CheckCircle, XCircle, Clock, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function MyItemsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('item_proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setProposals(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppraisal = async (proposal: any) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás autenticado');

      // 1. Update proposal status
      await supabase.from('item_proposals').update({ status: 'accepted' }).eq('id', proposal.id);

      // 2. Find active auction
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

      // 3. Insert into items table
      const itemImages = proposal.images && proposal.images.length > 0 
        ? proposal.images 
        : ['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500'];

      const finalPrice = Number(proposal.proposed_price) || 1500;

      const { data: newItem, error: itemError } = await supabase.from('items').insert({
        auction_id: targetAuctionId,
        owner_id: user.id,
        title: proposal.title,
        description: proposal.description,
        history: proposal.history || '',
        images: itemImages,
        starting_price: finalPrice,
        status: 'in_auction'
      }).select().single();

      if (itemError) throw itemError;

      // 4. Send notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '¡Artículo Publicado en Catálogo!',
        message: `Tu artículo "${proposal.title}" fue aceptado e incorporado a la subasta activa.`,
        type: 'INFO',
        metadata: { item_id: newItem?.id }
      });

      Alert.alert('¡Éxito!', 'El artículo ha sido aceptado e incorporado al catálogo de subastas.');
      fetchData();
    } catch(err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'No se pudo aceptar la tasación.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'accepted': return <CheckCircle color="#2E7D32" size={24} />;
      case 'rejected': return <XCircle color={Colors.light.error} size={24} />;
      case 'appraised': return <Search color="#1976D2" size={24} />;
      default: return <Clock color="#ED6C02" size={24} />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Productos (Seguimiento)</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Seguimiento de los artículos que has propuesto para subastar.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} />
        ) : proposals.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No tienes propuestas activas.</Text>
        ) : (
          proposals.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Box color={Colors.light.textSecondary} size={24} />
                <View style={styles.titleContainer}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.solicitudId}>Solicitud #{item.id.slice(0, 8)}</Text>
                </View>
                {getStatusIcon(item.status)}
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Estado Actual:</Text>
                <Text style={[styles.statusValue, 
                  item.status === 'accepted' && {color: '#2E7D32'},
                  item.status === 'rejected' && {color: Colors.light.error},
                  item.status === 'appraised' && {color: '#1976D2'},
                  item.status === 'pending_shipping' && {color: '#ED6C02'},
                ]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              {item.status === 'rejected' && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackTitle}>Tasación rechazada</Text>
                  <Text style={styles.feedbackText}>
                    {item.admin_feedback || 'Se gestionó la devolución del artículo hacia su propietario.'}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.actionBtnOutline, { marginTop: 8 }]}
                    onPress={() => router.push(`/profile/return-item?proposalId=${item.id}` as any)}
                  >
                    <Text style={styles.actionBtnOutlineText}>Ver Detalles de Devolución</Text>
                  </TouchableOpacity>

                </View>
              )}

              {item.status === 'appraised' && (
                <View style={styles.successBox}>
                  <Text style={styles.successTitle}>¡Tasación Lista!</Text>
                  <Text style={styles.successText}>Nuestros peritos tasaron este bien en:</Text>
                  <Text style={styles.appraisedPrice}>${Number(item.proposed_price || 1500).toLocaleString()} USD</Text>
                  <Text style={styles.feedbackText}>"{item.admin_feedback || 'Pieza auténtica en óptimas condiciones'}"</Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#2E7D32' }]} 
                      onPress={() => router.push(`/profile/appraisal-details?proposalId=${item.id}&price=${item.proposed_price || 1500}` as any)}
                    >
                      <Text style={styles.actionButtonText}>Ver y Aceptar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: Colors.light.error }]} 
                      onPress={() => router.push(`/profile/return-item?proposalId=${item.id}` as any)}
                    >
                      <Text style={styles.actionButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {item.status === 'accepted' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.pendingText}>Artículo aceptado e incorporado en el catálogo oficial de subastas.</Text>
                  <TouchableOpacity 
                    style={[styles.actionBtnOutline, { marginTop: 10 }]}
                    onPress={() => router.push('/(main)' as any)}
                  >
                    <Text style={styles.actionBtnOutlineText}>Ver en Catálogo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'pending_shipping' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.pendingText}>Propuesta en revisión. Por favor confirma el despacho hacia nuestra central.</Text>
                  <TouchableOpacity 
                    style={[styles.actionBtnOutline, { marginTop: 10 }]}
                    onPress={() => router.push(`/profile/confirm-shipping?proposalId=${item.id}` as any)}
                  >
                    <Text style={styles.actionBtnOutlineText}>Confirmar Envío a Central</Text>
                  </TouchableOpacity>
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
  infoText: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: Colors.light.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  titleContainer: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  solicitudId: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 14, color: Colors.light.textSecondary, marginRight: 8 },
  statusValue: { fontSize: 14, fontWeight: 'bold' },
  feedbackBox: { backgroundColor: 'rgba(211,47,47,0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(211,47,47,0.2)' },
  feedbackTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.error, marginBottom: 4 },
  feedbackText: { fontSize: 13, color: Colors.light.textSecondary, fontStyle: 'italic', marginBottom: 12 },
  feedbackTextError: { fontSize: 12, fontWeight: 'bold', color: Colors.light.error },
  successBox: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#90CAF9' },
  successTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0', marginBottom: 8 },
  successText: { fontSize: 14, color: '#333', marginBottom: 4 },
  appraisedPrice: { fontSize: 24, fontWeight: 'bold', color: '#1565C0', marginVertical: 8 },
  actionButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  pendingText: { fontSize: 13, color: Colors.light.textSecondary, fontStyle: 'italic' },
  actionBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    backgroundColor: 'rgba(133, 34, 33, 0.05)',
  },
  actionBtnOutlineText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    fontSize: 14,
  },
});


