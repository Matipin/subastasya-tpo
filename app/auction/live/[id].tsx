import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Clock, DollarSign, User } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function LiveAuctionRoom() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  // Mock de estado de subasta en vivo
  const [montoActual, setMontoActual] = useState(15000);
  const [pujaMinima, setPujaMinima] = useState(15100);
  const [pujaMaxima, setPujaMaxima] = useState(17000);
  const [ultimoPostor, setUltimoPostor] = useState('Mernes, E.');
  const [tiempoRestante, setTiempoRestante] = useState(300); // 5 minutos en segundos
  const [bidAmount, setBidAmount] = useState('');

  // Historial de pujas simulado
  const [history, setHistory] = useState([
    { id: 1, usuario: 'Mernes, E.', monto: 15000, time: '10:45:00' },
    { id: 2, usuario: 'Gomez, P.', monto: 14500, time: '10:44:30' },
    { id: 3, usuario: 'Perez, J.', monto: 14000, time: '10:43:10' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBid = () => {
    const amount = Number(bidAmount);
    if (!amount || isNaN(amount)) {
      Alert.alert('Error', 'Ingrese un monto válido');
      return;
    }
    
    const isOroOrPlatino = user?.categoria === 'oro' || user?.categoria === 'platino';
    
    if (amount < pujaMinima) {
      Alert.alert('Puja inválida', `El monto debe ser de al menos $${pujaMinima}`);
      return;
    }
    
    if (!isOroOrPlatino && amount > pujaMaxima) {
      Alert.alert('Puja inválida', `El monto no puede superar $${pujaMaxima} (límite del 20%)`);
      return;
    }

    // Aceptar puja
    setMontoActual(amount);
    setPujaMinima(amount + 100); // Simulando incremento minimo
    setPujaMaxima(amount + 2000); // Simulando incremento maximo
    setUltimoPostor(user?.nombre || 'Tú');
    
    setHistory(prev => [
      { id: Date.now(), usuario: user?.nombre || 'Tú', monto: amount, time: new Date().toLocaleTimeString() },
      ...prev
    ]);
    
    setBidAmount('');
    Alert.alert('Éxito', `Has pujado $${amount}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala en Vivo</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
      </View>

      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoText}>Transmisión en Vivo</Text>
        <View style={styles.overlayInfo}>
          <Text style={styles.itemTitle}>Reloj de pulsera años 60</Text>
          <Text style={styles.itemLot}>Lote #A-123</Text>
        </View>
      </View>

      <View style={styles.statusPanel}>
        <View style={styles.statusRow}>
          <View style={styles.statusBox}>
            <DollarSign color={Colors.light.tint} size={24} />
            <Text style={styles.statusLabel}>Oferta Actual</Text>
            <Text style={styles.currentBid}>${montoActual.toLocaleString()}</Text>
          </View>
          <View style={styles.statusBox}>
            <Clock color={tiempoRestante < 60 ? Colors.light.error : Colors.light.text} size={24} />
            <Text style={styles.statusLabel}>Tiempo Restante</Text>
            <Text style={[styles.timeRemaining, tiempoRestante < 60 && { color: Colors.light.error }]}>
              {formatTime(tiempoRestante)}
            </Text>
          </View>
        </View>

        <View style={styles.highestBidder}>
          <User color={Colors.light.textSecondary} size={20} />
          <Text style={styles.highestBidderText}>
            Líder actual: <Text style={{ fontWeight: 'bold' }}>{ultimoPostor}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.biddingSection}>
        <Text style={styles.biddingRules}>
          Puja Mínima: ${pujaMinima.toLocaleString()} 
          {user?.categoria !== 'oro' && user?.categoria !== 'platino' && ` • Máxima: $${pujaMaxima.toLocaleString()}`}
        </Text>
        
        <View style={styles.bidInputRow}>
          <TextInput
            style={styles.bidInput}
            placeholder="Ingrese monto a pujar"
            keyboardType="numeric"
            value={bidAmount}
            onChangeText={setBidAmount}
          />
          <TouchableOpacity style={styles.bidButton} onPress={handleBid}>
            <Text style={styles.bidButtonText}>Pujar</Text>
          </TouchableOpacity>
        </View>
        
        {/* Quick bids */}
        <View style={styles.quickBids}>
          <TouchableOpacity style={styles.quickBidBtn} onPress={() => setBidAmount(pujaMinima.toString())}>
            <Text style={styles.quickBidText}>+ Mínimo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBidBtn} onPress={() => setBidAmount((pujaMinima + 500).toString())}>
            <Text style={styles.quickBidText}>+ $500</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.historySection}>
        <Text style={styles.historyTitle}>Historial de Ofertas</Text>
        {history.map((h, i) => (
          <View key={h.id} style={[styles.historyItem, i === 0 && styles.historyItemLatest]}>
            <View>
              <Text style={styles.historyUser}>{h.usuario}</Text>
              <Text style={styles.historyTime}>{h.time}</Text>
            </View>
            <Text style={styles.historyAmount}>${h.monto.toLocaleString()}</Text>
          </View>
        ))}
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
    backgroundColor: '#111', // Dark header for live view
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.error,
    marginRight: 6,
  },
  liveText: {
    color: Colors.light.error,
    fontWeight: 'bold',
    fontSize: 12,
  },
  videoPlaceholder: {
    height: 220,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoText: {
    color: '#666',
    fontSize: 16,
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  itemTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  itemLot: {
    color: '#DDD',
    fontSize: 14,
  },
  statusPanel: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  currentBid: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginTop: 4,
  },
  timeRemaining: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 4,
  },
  highestBidder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
  },
  highestBidderText: {
    marginLeft: 8,
    color: '#1565C0',
    fontSize: 14,
  },
  biddingSection: {
    padding: 20,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  biddingRules: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  bidInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bidInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginRight: 12,
    backgroundColor: Colors.light.background,
  },
  bidButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  bidButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickBids: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  quickBidBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  quickBidText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  historyItemLatest: {
    backgroundColor: 'rgba(133, 34, 33, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  historyUser: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
});
