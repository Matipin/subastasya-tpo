import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Gavel, ArrowRight } from 'lucide-react-native';

export default function MyAuctionsScreen() {
  const router = useRouter();

  const mockMyAuctions = [
    {
      id: 1,
      titulo: "Colección Relojes Vintage",
      status: "En progreso",
      pujas_realizadas: 5,
      fecha: "Hoy, 18:00 hs",
      isLive: true
    },
    {
      id: 2,
      titulo: "Arte Moderno Argentino",
      status: "Próximamente",
      pujas_realizadas: 0,
      fecha: "15 Jun, 19:00 hs",
      isLive: false
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Subastas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Subastas en las que estás participando o a las que te has anotado.
        </Text>

        {mockMyAuctions.map(auction => (
          <View key={auction.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Gavel color={Colors.light.tint} size={24} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.auctionTitle}>{auction.titulo}</Text>
                <Text style={styles.auctionDate}>{auction.fecha}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, auction.isLive && { color: Colors.light.error }]}>
                  {auction.isLive ? '🔴 EN VIVO' : '⏳ PENDIENTE'}
                </Text>
              </View>
              <Text style={styles.bidsText}>Pujas: {auction.pujas_realizadas}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.joinButton, !auction.isLive && styles.joinButtonDisabled]}
              disabled={!auction.isLive}
              onPress={() => router.push(`/auction/live/${auction.id}`)}
            >
              <Text style={[styles.joinButtonText, !auction.isLive && styles.joinButtonTextDisabled]}>
                {auction.isLive ? 'Ingresar a la sala' : 'Sala no disponible'}
              </Text>
              {auction.isLive && <ArrowRight color="#FFF" size={18} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        ))}
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
  iconBox: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8 },
  titleContainer: { flex: 1, marginLeft: 12 },
  auctionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  auctionDate: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: Colors.light.textSecondary },
  bidsText: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '500' },
  joinButton: {
    flexDirection: 'row', backgroundColor: Colors.light.tint, padding: 14, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  joinButtonDisabled: { backgroundColor: '#E2E8F0' },
  joinButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  joinButtonTextDisabled: { color: '#A0AAB2' },
});
