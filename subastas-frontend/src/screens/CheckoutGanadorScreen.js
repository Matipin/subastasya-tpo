import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function CheckoutGanadorScreen({ route, navigation }) {
  // Datos recibidos por parametro desde la notificación o listado
  const { articulo, checkoutDetails } = route.params || {};
  
  const [metodoEntrega, setMetodoEntrega] = useState('domicilio');
  
  // Valores default de demostracion si no vienen en params
  const item = articulo || {
    id: 1,
    nombre: 'Reloj Vintage',
    urlImagen: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop',
  };

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

  const handleConfirmar = async () => {
    if (metodoEntrega === 'retiro') {
      Alert.alert(
        'Atención',
        'Al retirar personalmente perderás la cobertura del seguro. ¿Estás de acuerdo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Aceptar y Confirmar', onPress: () => procesarPago() }
        ]
      );
    } else {
      procesarPago();
    }
  };

  const procesarPago = async () => {
    try {
      // Simulación de llamada al backend
      // const response = await fetch(`${API_BASE_URL}/users/me/items/won/${item.id}/checkout`, { method: 'POST', ... });
      
      Alert.alert('Pago realizado', 'El pago se procesó exitosamente con su medio predeterminado.', [
        { text: 'Volver al menu', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Hubo un error procesando el pago. Intente nuevamente.');
    }
  };

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
        
        <Text style={styles.paymentMethod}>Medio de pago: {details.medioPago}</Text>
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
        <Text style={styles.deliverySubtitle}>Sin costo</Text>
        {metodoEntrega === 'retiro' && (
          <View style={styles.warningBox}>
             <Ionicons name="warning-outline" size={16} color="#B45309" />
             <Text style={styles.warningText}>Al retirar personalmente, perdés la cobertura del seguro</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleConfirmar}>
        <Text style={styles.submitButtonText}>Confirmar compra</Text>
      </TouchableOpacity>

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
  paymentMethod: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 10,
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
  }
});
