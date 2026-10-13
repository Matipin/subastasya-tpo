import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Gavel, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function MyAuctionsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAuctions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('auction_participants')
          .select('auction_id, auctions(*)')
          .eq('user_id', user.id);

        if (error) throw error;
        if (data) {
          const now = new Date();
          const mapped = data
            .map((item: any) => item.auctions)
            .filter(Boolean)
            .map((a: any) => {
              const start = new Date(a.start_date);
              const end = new Date(a.end_date);
              const isLive = a.status === 'active' && start <= now && end >= now;
              return {
                id: a.id,
                titulo: a.title,
                status: isLive ? 'En vivo' : (start > now ? 'Próximamente' : 'Finalizada'),
                fecha: start.toLocaleDateString() + ' ' + start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isLive
              };
            });
          setAuctions(mapped);
        }
      } catch (err) {
        console.error('Error fetching my auctions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAuctions();
  }, [user]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Subastas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Subastas en las que estás inscripto para participar.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 40 }} />
        ) : auctions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No estás inscripto en ninguna subasta actualmente.</Text>
            <TouchableOpacity onPress={() => router.replace('/(main)')} style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explorar Catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          auctions.map(auction => (
            <View key={auction.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Gavel color={Colors.light.tint} size={24} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.auctionTitle}>{auction.titulo}</Text>
                  <Text style={styles.auctionDate}>Inicio: {auction.fecha}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  <Text style={[styles.statusText, auction.isLive && { color: Colors.light.error }]}>
                    {auction.isLive ? '🔴 EN VIVO AHORA' : `⏳ ${auction.status.toUpperCase()}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.joinButton, !auction.isLive && styles.joinButtonDisabled]}
                disabled={!auction.isLive}
                onPress={() => router.push(`/auction/live/${auction.id}`)}
              >
                <Text style={[styles.joinButtonText, !auction.isLive && styles.joinButtonTextDisabled]}>
                  {auction.isLive ? 'Ingresar a la Sala en Vivo' : 'Sala no iniciada aún'}
                </Text>
                {auction.isLive && <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
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
  iconBox: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8 },
  titleContainer: { flex: 1, marginLeft: 12 },
  auctionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  auctionDate: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: Colors.light.textSecondary },
  joinButton: {
    flexDirection: 'row', backgroundColor: Colors.light.tint, padding: 14, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  joinButtonDisabled: { backgroundColor: '#E2E8F0' },
  joinButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  joinButtonTextDisabled: { color: '#A0AAB2' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.light.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  exploreButton: { backgroundColor: Colors.light.tint, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  exploreButtonText: { color: '#FFF', fontWeight: 'bold' }
});
