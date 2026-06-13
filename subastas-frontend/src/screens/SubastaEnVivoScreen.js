import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function SubastaEnVivoScreen({ route, navigation }) {
  const { articulo, subasta, usuario } = route.params || {};
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);

  const fetchStatus = async () => {
    try {
      const url = API_BASE_URL.replace('/auth', '/auctions') + `/${subasta?.identificador || 1}/items/${articulo?.id}/status`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling cada 3 segundos
    const intervalId = setInterval(fetchStatus, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleBid = async () => {
    if (!status) return;
    setBidding(true);
    try {
      const url = API_BASE_URL.replace('/auth', '/auctions') + `/${subasta?.identificador || 1}/items/${articulo?.id}/bid`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: status.puja_minima,
          asistenteId: 1 // Default if we don't have the user's asistente mapping
        })
      });

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Tu puja ha sido registrada.');
        fetchStatus();
      } else {
        const msg = await response.text();
        Alert.alert('Error', msg || 'No se pudo realizar la puja.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setBidding(false);
    }
  };

  if (loading && !status) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={{ marginTop: 10, color: '#666' }}>Conectando a la sala en vivo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Live Room */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala en Vivo</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Item Info */}
        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{articulo?.nombre || 'Artículo de Subasta'}</Text>
          <Text style={styles.auctionName}>{subasta?.nombre}</Text>
        </View>

        {/* Status Board */}
        <View style={styles.statusBoard}>
          <Text style={styles.statusLabel}>Monto Actual</Text>
          <Text style={styles.currentAmount}>USD {status?.monto_actual || articulo?.precioBase || '0'}</Text>
          
          <View style={styles.postorInfo}>
            <Ionicons name="person" size={16} color="#852221" />
            <Text style={styles.postorText}>Líder: {status?.ultimo_postor || 'Nadie'}</Text>
          </View>
        </View>

        <View style={styles.bidControls}>
          <View style={styles.bidInfoRow}>
            <Text style={styles.bidInfoLabel}>Siguiente puja sugerida (Mínima)</Text>
            <Text style={styles.bidInfoValue}>USD {status?.puja_minima?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.bidInfoRow}>
            <Text style={styles.bidInfoLabel}>Puja Máxima Permitida</Text>
            <Text style={styles.bidInfoValue}>USD {status?.puja_maxima?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.bidButton} 
          onPress={handleBid}
          disabled={bidding}
        >
          {bidding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.bidButtonText}>PUJAR POR USD {status?.puja_minima?.toFixed(2) || '0'}</Text>
              <Ionicons name="flash" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Al pujar, aceptas los términos de penalización del 10% en caso de impago.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1B263B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveBadge: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'red',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 6,
  },
  liveText: {
    color: 'red',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  itemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B263B',
  },
  auctionName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBoard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#852221',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#852221',
    marginVertical: 10,
  },
  postorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postorText: {
    color: '#852221',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bidControls: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
  },
  bidInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bidInfoLabel: {
    color: '#555',
    fontSize: 15,
  },
  bidInfoValue: {
    color: '#1B263B',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  bidButton: {
    backgroundColor: '#852221',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#852221',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  bidButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 12,
  }
});
