import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function SubastaEnVivoScreen({ route, navigation }) {
  const { articulo, subasta, usuario } = route.params || {};
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [customBid, setCustomBid] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);

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

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Inicializar estado por REST y luego conectar WS
    fetchStatus();

    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1/auth', '/ws-auction');
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WS Connected');
    };

    websocket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'BID' || msg.type === 'STATE') {
        setStatus(prev => ({
          ...prev,
          monto_actual: msg.amount,
          puja_minima: msg.minBid,
          puja_maxima: msg.maxBid,
          ultimo_postor: msg.user,
        }));
        setCustomBid(msg.minBid.toString());
        setTimeLeft(60); // reset local timer 60s
      } else if (msg.type === 'CHAT') {
        setChatMessages(prev => [...prev, msg]);
      } else if (msg.type === 'ENDED') {
        setStatus(prev => ({ ...prev, isEnded: true }));
        setTimeLeft(0);
        
        const isWinner = msg.user === (usuario?.nombre || 'Usuario App');
        if (isWinner) {
          Alert.alert('¡Subasta Finalizada!', `¡Felicidades! Ganaste la subasta por $${msg.amount}.`, [
            { 
              text: 'Proceder al pago', 
              onPress: () => {
                const wonItem = {
                  id: articulo?.id || 1,
                  nombre: articulo?.nombre || 'Artículo de Subasta',
                  urlImagen: articulo?.urlImagen,
                  estado_pago: 'pendiente',
                  monto: msg.amount,
                };
                navigation.replace('CheckoutGanador', { item: wonItem, usuario });
              }
            }
          ]);
        } else {
          Alert.alert('Subasta Finalizada', `El ganador es ${msg.user} con $${msg.amount}`);
        }
      }
    };

    websocket.onerror = (e) => console.log('WS error', e.message);

    setWs(websocket);

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      websocket.close();
    };
  }, []);

  const handleBid = () => {
    if (!status || !ws) return;
    if (status.isEnded || timeLeft === 0) {
      Alert.alert('Error', 'La subasta ha finalizado.');
      return;
    }
    if (status.ultimo_postor === (usuario?.nombre || 'Usuario App')) {
      Alert.alert('Error', 'Ya eres el líder actual de la puja.');
      return;
    }

    const amountToBid = parseFloat(customBid);
    if (isNaN(amountToBid) || amountToBid < status.puja_minima || amountToBid > status.puja_maxima) {
      Alert.alert('Error', `La puja debe estar entre USD ${status.puja_minima} y USD ${status.puja_maxima}`);
      return;
    }

    setBidding(true);

    const bidMsg = {
      auctionId: subasta?.identificador || 1,
      itemId: articulo?.id || 1,
      user: usuario?.nombre || 'Usuario App',
      type: 'BID',
      amount: amountToBid
    };

    ws.send(JSON.stringify(bidMsg));
    
    setTimeout(() => {
      Alert.alert('¡Éxito!', 'Tu puja ha sido registrada.');
      setBidding(false);
    }, 500);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !ws) return;
    const chatMsg = {
      auctionId: subasta?.identificador || 1,
      itemId: articulo?.id || 1,
      user: usuario?.nombre || 'Usuario App',
      type: 'CHAT',
      content: chatInput
    };
    ws.send(JSON.stringify(chatMsg));
    setChatInput('');
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

          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={18} color="#852221" />
            <Text style={styles.timerText}>
              {timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60) < 10 ? '0'+(timeLeft % 60) : timeLeft % 60}` : 'FINALIZADO'}
            </Text>
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

        {/* Chat en Vivo */}
        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>Chat en vivo</Text>
          <View style={styles.chatBox}>
            {chatMessages.map((msg, index) => (
              <View key={index} style={styles.chatMsg}>
                <Text style={styles.chatUser}>{msg.user}: </Text>
                <Text style={styles.chatContent}>{msg.content}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chatInputContainer}>
            <TextInput style={styles.chatInput} placeholder="Participa de la conversacion..." value={chatInput} onChangeText={setChatInput} />
            <TouchableOpacity onPress={handleSendChat} style={styles.sendBtn}>
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
          <Text style={{fontWeight: 'bold', marginRight: 10}}>Tu Puja:</Text>
          <TextInput 
            style={styles.customBidInput}
            keyboardType="numeric"
            value={customBid}
            onChangeText={setCustomBid}
            placeholder={`Mín: ${status?.puja_minima || '0'}`}
          />
        </View>

        <TouchableOpacity 
          style={[styles.bidButton, (status?.isEnded || timeLeft === 0) && {backgroundColor: '#CCC'}]} 
          onPress={handleBid}
          disabled={bidding || status?.isEnded || timeLeft === 0}
        >
          {bidding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.bidButtonText}>PUJAR AHORA</Text>
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
    backgroundColor: '#852221',
    paddingTop: 10,
    paddingBottom: 15,
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
  timerBadge: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#852221',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
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
    paddingVertical: 14,
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
  customBidInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  },
  chatSection: {
    marginTop: 20,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.TEXT_TITLE,
  },
  chatBox: {
    minHeight: 100,
    maxHeight: 200,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  chatMsg: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chatUser: {
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  chatContent: {
    color: '#333',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: 20,
  }
});
