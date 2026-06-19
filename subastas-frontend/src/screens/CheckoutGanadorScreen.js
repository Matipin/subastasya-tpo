import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';
import MercadoPagoBrick from '../components/MercadoPagoBrick';

export default function CheckoutGanadorScreen({ route, navigation }) {
  const { articulo, checkoutDetails, usuario } = route.params || {};
  
  const item = articulo || {
    id: 1,
    nombre: 'Reloj Vintage',
    urlImagen: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop',
    estado_pago: 'pendiente'
  };

  const isFinalizado = item.estado_pago === 'finalizado' || item.estado_pago === 'pagado';

  const [metodoEntrega, setMetodoEntrega] = useState('domicilio');
  const [mediosPago, setMediosPago] = useState([]);
  const [selectedMedioId, setSelectedMedioId] = useState(null);
  const [showMPBrick, setShowMPBrick] = useState(false);
  const [mpLoading, setMpLoading] = useState(false);

  useEffect(() => {
    if (!isFinalizado && usuario?.email) {
      fetch(`${API_BASE_URL.replace('/auth', '/users')}/me/medios-de-pago?email=${encodeURIComponent(usuario.email)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            setMediosPago(data);
            setSelectedMedioId(data[0].idMedioDePago);
          }
        })
        .catch(e => console.error(e));
    }
  }, [isFinalizado, usuario]);
  
  const details = checkoutDetails || {
    valorPujado: 15000,
    comision: 1500,
    costoEnvioDomicilio: 1000,
    medioPago: 'Visa ****1234',
  };

  const valorPujado = item.monto || details.valorPujado;
  const comision = valorPujado * 0.10;
  const costoEnvio = metodoEntrega === 'domicilio' ? details.costoEnvioDomicilio : 0;
  const totalPagado = valorPujado + comision + costoEnvio;

  const handleConfirmar = () => {
    if (!selectedMedioId && !showMPBrick && mediosPago.length > 0) {
      Alert.alert('Error', 'Debes seleccionar un método de pago.');
      return;
    }
    if (showMPBrick) {
      // If showing MP brick, they must submit through the brick
      Alert.alert('Info', 'Por favor completa el formulario de Mercado Pago para continuar.');
      return;
    }
    procesarPago();
  };

  const procesarPago = () => {
    Alert.alert('Pago realizado', 'El pago se procesó exitosamente con tu medio de pago.', [
      { text: 'Volver', onPress: () => navigation.navigate('Home', { usuario }) }
    ]);
  };

  const handleMPSubmit = (cardFormData) => {
    // Faking success to bypass MP internal issues as requested
    console.log("MP Form Data received:", cardFormData);
    setMpLoading(false);
    procesarPago();
  };

  if (isFinalizado) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{color: COLORS.TEXT_TITLE}}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen de Compra</Text>
        </View>
        <ScrollView style={{padding: 20}}>
          <View style={styles.summaryCard}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" style={{alignSelf:'center', marginBottom:20}}/>
            <Text style={styles.summaryTitle}>Objeto Recibido</Text>
            <Text style={styles.summaryText}>Articulo: <Text style={{fontWeight:'bold'}}>{item.nombre}</Text></Text>
            <Text style={styles.summaryText}>Importe Abonado: <Text style={{fontWeight:'bold'}}>${valorPujado}</Text></Text>
            <Text style={[styles.summaryText, {marginTop: 20, fontStyle:'italic', textAlign:'center'}]}>La transacción se ha completado y has recibido tu artículo correctamente.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>¡felicidades!</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <Text style={styles.subtitle}>usted gano la puja</Text>

      <Image 
        source={{ uri: item.urlImagen }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <Text style={styles.itemTitle}>{item.nombre}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen de compra</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Valor pujado</Text>
          <Text style={styles.rowValue}>${valorPujado.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Comision (10%)</Text>
          <Text style={styles.rowValue}>${comision.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Costo de envio</Text>
          <Text style={styles.rowValue}>${costoEnvio.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>total a pagar</Text>
          <Text style={styles.totalValue}>${totalPagado.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20 }]}>Metodo de entrega</Text>

      <TouchableOpacity 
        style={[styles.deliveryOption, metodoEntrega === 'domicilio' && styles.deliveryOptionSelected]}
        onPress={() => setMetodoEntrega('domicilio')}
      >
        <Text style={styles.deliveryTitle}>Envío a domicilio</Text>
        <Text style={styles.deliverySubtitle}>Con seguro incluido - ${details.costoEnvioDomicilio.toLocaleString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.deliveryOption, metodoEntrega === 'retiro' && styles.deliveryOptionSelected]}
        onPress={() => setMetodoEntrega('retiro')}
      >
        <Text style={styles.deliveryTitle}>Retirar personalmente</Text>
        <Text style={styles.deliverySubtitle}>Sin costo - Retirar en Av. Libertador 1234, CABA</Text>
        {metodoEntrega === 'retiro' && (
          <View style={styles.warningBox}>
             <Ionicons name="warning-outline" size={16} color="#B45309" />
             <Text style={styles.warningText}>Al retirar personalmente, perdés la cobertura del seguro</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.paymentMethodSection}>
        <Text style={[styles.sectionTitle, { marginLeft: 20 }]}>Método de Pago</Text>
        
        {mediosPago.map(mp => (
          <TouchableOpacity 
            key={mp.idMedioDePago} 
            style={[styles.card, styles.paymentCard, selectedMedioId === mp.idMedioDePago && !showMPBrick && { borderColor: COLORS.PRIMARY, borderWidth: 2 }]}
            onPress={() => { setSelectedMedioId(mp.idMedioDePago); setShowMPBrick(false); }}
          >
            <Ionicons name={mp.tipo === 'TARJETA' ? 'card' : 'business'} size={24} color="#555" />
            <Text style={styles.paymentText}>
              {mp.tipo === 'TARJETA' ? `Tarjeta terminada en ${mp.numero?.slice(-4) || '****'}` : `Cuenta terminada en ${mp.numero?.slice(-4) || '****'}`}
            </Text>
            {selectedMedioId === mp.idMedioDePago && !showMPBrick && <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[styles.card, styles.paymentCard, showMPBrick && { borderColor: COLORS.PRIMARY, borderWidth: 2 }]}
          onPress={() => { setShowMPBrick(true); setSelectedMedioId(null); }}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.paymentText, { color: COLORS.PRIMARY }]}>Pagar con una nueva tarjeta (MercadoPago)</Text>
        </TouchableOpacity>
        
        {showMPBrick && (
          <View style={{ marginHorizontal: 20, marginTop: 10, borderRadius: 10, overflow: 'hidden' }}>
            {mpLoading && <ActivityIndicator color={COLORS.PRIMARY} style={{ margin: 20 }} />}
            <MercadoPagoBrick onSubmit={handleMPSubmit} usuarioEmail={usuario?.email} />
          </View>
        )}
      </View>

      {!showMPBrick && (
        <TouchableOpacity style={styles.submitButton} onPress={handleConfirmar}>
          <Text style={styles.submitButtonText}>Confirmar compra</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: '90%',
    height: 200,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.TEXT_TITLE,
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#666',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  deliveryOption: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deliveryOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#FFF5F5',
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#B45309',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 15, elevation: 2, marginTop: 20 },
  summaryTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  summaryText: { fontSize: 16, color: '#555', marginBottom: 10 },
  paymentMethodSection: { marginTop: 20, marginBottom: 10 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, justifyContent: 'space-between', marginHorizontal: 20, marginVertical: 0 },
  paymentText: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' }
});
