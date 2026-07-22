import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
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

  const handleAcceptAppraisal = (proposal: any) => {
    Alert.alert(
      'Aceptar Tasación',
      `¿Aceptas subastar "${proposal.title}" con un precio base de $${proposal.proposed_price}? Se aplicará un 10% de comisión en caso de venta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceptar', 
          onPress: async () => {
            try {
              // 1. Update proposal status
              await supabase.from('item_proposals').update({ status: 'accepted' }).eq('id', proposal.id);
              
              // 2. Insert into real items table (Assign to a default auction for the mock)
              await supabase.from('items').insert({
                auction_id: '11111111-1111-1111-1111-111111111111', // Dummy auction from seed
                title: proposal.title,
                description: proposal.description,
                history: proposal.history,
                images: proposal.images,
                starting_price: proposal.proposed_price,
                status: 'approved'
              });

              Alert.alert('Éxito', 'El artículo ha sido programado para la próxima subasta.');
              fetchData();
            } catch(err) {
              Alert.alert('Error', 'No se pudo aceptar la tasación.');
            }
          }
        }
      ]
    );
  };

  const handleRejectAppraisal = (proposalId: string) => {
    Alert.alert(
      'Rechazar Tasación',
      'Si rechazas la tasación, el artículo no será subastado y deberás retirarlo pagando el costo de envío (Simulado).',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rechazar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('item_proposals').update({ status: 'rejected' }).eq('id', proposalId);
              fetchData();
            } catch(err) {}
          }
        }
      ]
    );
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
                  item.status === 'pending_review' && {color: '#ED6C02'},
                ]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              {item.status === 'rejected' && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackTitle}>Tasación rechazada</Text>
                  <Text style={styles.feedbackTextError}>Costo de devolución: $150.00 (Ficticio)</Text>
                </View>
              )}

              {item.status === 'appraised' && (
                <View style={styles.successBox}>
                  <Text style={styles.successTitle}>¡Tasación Lista!</Text>
                  <Text style={styles.successText}>Nuestros expertos sugieren un precio base de:</Text>
                  <Text style={styles.appraisedPrice}>${Number(item.proposed_price).toLocaleString()}</Text>
                  <Text style={styles.feedbackText}>"{item.admin_feedback}"</Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2E7D32'}]} onPress={() => handleAcceptAppraisal(item)}>
                      <Text style={styles.actionButtonText}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, {backgroundColor: Colors.light.error}]} onPress={() => handleRejectAppraisal(item.id)}>
                      <Text style={styles.actionButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {item.status === 'accepted' && (
                <Text style={styles.pendingText}>Artículo aceptado e incluido en el catálogo de subastas.</Text>
              )}

              {item.status === 'pending_review' && (
                <Text style={styles.pendingText}>El artículo está siendo evaluado por nuestros expertos. Te notificaremos pronto (5 segundos).</Text>
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
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
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
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  pendingText: { fontSize: 13, color: Colors.light.textSecondary, fontStyle: 'italic' },
});
