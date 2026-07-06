import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
            setSelectedMedioId(data[0].identificador);
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

  const isDeuda = item.isDeuda;
  const valorPujado = item.monto || details.valorPujado;
  
  const isAdjudicacion = isDeuda ? (item.motivo && item.motivo.includes('Adjudicación Item de Subasta')) : true;
  
  const valorBase = valorPujado;
  const comision = isAdjudicacion ? (valorBase * 0.10) : 0;
  const costoEnvio = (isAdjudicacion && metodoEntrega === 'domicilio') ? 50 : 0;
  const totalPagado = valorBase + comision + costoEnvio;

  const handleConfirmar = () => {
    if (!selectedMedioId && !showMPBrick) {
      Alert.alert('Error', 'Debes seleccionar un método de pago o utilizar Mercado Pago.');
      return;
    }
    if (showMPBrick) {
      Alert.alert('Info', 'Por favor completa el formulario de Mercado Pago para continuar.');
      return;
    }

    // Confirmar renuncia de seguro si elige retiro personal
    if (metodoEntrega === 'retiro') {
      Alert.alert(
        'Confirmación de Retiro',
        'Al retirar personalmente, renuncias a la cobertura del seguro de transporte. ¿Estás seguro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => procesarPago() }
        ]
      );
    } else {
      procesarPago();
    }
  };

  const procesarPago = async () => {
    try {
      let dId = item.deudaId;
      if (!dId) {
        const wonRes = await fetch(`${API_BASE_URL.replace('/auth', '/users')}/me/items/won?email=${encodeURIComponent(usuario?.email)}`);
        const wonItems = await wonRes.json();
        const wonMatch = wonItems.find(w => w.id === item.id || w.id === item.id?.toString());
        if (wonMatch && wonMatch.deudaId) {
          dId = wonMatch.deudaId;
        }
      }
      
      // Obtener nombre del medio de pago seleccionado
      let medioPagoNombre = 'Medio de pago registrado';
      if (selectedMedioId) {
        const mp = mediosPago.find(m => m.identificador === selectedMedioId);
        if (mp) {
          medioPagoNombre = `${mp.tipo} ${mp.entidad || ''} ****${mp.numero?.slice(-4) || '****'}`;
        }
      }

      if (dId) {
        const payRes = await fetch(`${API_BASE_URL.replace('/auth', '/users')}/me/debts/${dId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metodoEnvio: metodoEntrega,
            medioPagoNombre: medioPagoNombre,
            medioPagoId: selectedMedioId,
            renunciaSeguro: metodoEntrega === 'retiro',
          })
        });

        if (!payRes.ok) {
          // El backend rechazó el pago (fondos insuficientes u otro error)
          const errorMsg = await payRes.text();
          Alert.alert(
            '❌ Pago Rechazado',
            errorMsg || 'No fue posible procesar el pago. Verificá tu saldo y volvé a intentarlo.',
            [{ text: 'Entendido', style: 'cancel' }]
          );
          return; // No navegar, dejar al usuario en el checkout
        }
      }
    } catch(e) {
      console.error(e);
      Alert.alert('Error', 'Ocurrió un problema de conexión. Intentá nuevamente.');
      return;
    }
    
    Alert.alert('✅ Pago realizado', 'El pago se procesó exitosamente.', [
      { text: 'Ver mis compras', onPress: () => navigation.navigate('Home', { usuario }) }
    ]);
  };

  const handleMPSubmit = (cardFormData) => {
    console.log("MP Form Data received:", cardFormData);
    setMpLoading(false);
    procesarPago();
  };

  // ========== VISTA PARA ÍTEMS YA PAGADOS ==========
  if (isFinalizado) {
    const metodoEnvioDisplay = item.metodoEnvio === 'retiro' ? 'Retiro personal' : 'Envío a domicilio';
    const medioPagoDisplay = item.medioPagoUsado || 'Medio de pago registrado';
    const fechaPagoDisplay = item.fechaPago 
      ? new Date(item.fechaPago).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'N/A';
    const montoDisplay = typeof item.monto === 'number' ? item.monto.toLocaleString() : item.monto;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen de Compra</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Imagen del producto */}
          {item.urlImagen && (
            <Image 
              source={{ uri: item.urlImagen }}
              style={styles.paidImage}
              resizeMode="cover"
            />
          )}

          {/* Badge de estado */}
          <View style={styles.paidBadgeContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            <Text style={styles.paidBadgeText}>Compra Completada</Text>
          </View>

          {/* Card de info del artículo */}
          <View style={styles.paidInfoCard}>
            <Text style={styles.paidItemName}>{item.itemNombre || item.nombre}</Text>
            {item.subastaNombre && (
              <Text style={styles.paidSubastaName}>{item.subastaNombre}</Text>
            )}
          </View>

          {/* Card de desglose de pago */}
          <View style={styles.paidCard}>
            <Text style={styles.paidSectionTitle}>Detalle del Pago</Text>
            
            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="cash-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Importe abonado</Text>
              </View>
              <Text style={styles.paidRowValue}>USD {montoDisplay}</Text>
            </View>

            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="calculator-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Comisión (10%)</Text>
              </View>
              <Text style={styles.paidRowValue}>USD {item.comision ? item.comision.toLocaleString() : (valorPujado * 0.10).toLocaleString()}</Text>
            </View>

            <View style={styles.paidDivider} />

            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="card-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Método de pago</Text>
              </View>
              <Text style={styles.paidRowValueSmall}>{medioPagoDisplay}</Text>
            </View>

            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Fecha de pago</Text>
              </View>
              <Text style={styles.paidRowValueSmall}>{fechaPagoDisplay}</Text>
            </View>
          </View>

          {/* Card de envío */}
          <View style={styles.paidCard}>
            <Text style={styles.paidSectionTitle}>Entrega</Text>
            
            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name={item.metodoEnvio === 'retiro' ? 'walk-outline' : 'car-outline'} size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Método de entrega</Text>
              </View>
              <Text style={styles.paidRowValueSmall}>{metodoEnvioDisplay}</Text>
            </View>

            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Seguro</Text>
              </View>
              <Text style={[styles.paidRowValueSmall, { color: item.renunciaSeguro ? '#EF4444' : '#10B981' }]}>
                {item.renunciaSeguro ? 'Renunció' : 'Cubierto'}
              </Text>
            </View>

            <View style={styles.paidRow}>
              <View style={styles.paidRowLeft}>
                <Ionicons name="cube-outline" size={18} color="#6B7280" />
                <Text style={styles.paidRowLabel}>Estado</Text>
              </View>
              <View style={styles.receivedBadge}>
                <Ionicons name="checkmark" size={14} color="#065F46" />
                <Text style={styles.receivedBadgeText}>{item.recibido ? 'Recibido' : 'En camino'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ========== VISTA DE CHECKOUT PARA PENDIENTES ==========
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isDeuda ? 'pago pendiente' : '¡felicidades!'}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <Text style={styles.subtitle}>{isDeuda ? 'abona tu deuda para regularizar' : 'usted gano la puja'}</Text>

      {item.urlImagen ? (
        <Image 
          source={{ uri: item.urlImagen }} 
          style={styles.image} 
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
        </View>
      )}
      <Text style={styles.itemTitle}>{item.itemNombre || item.nombre}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen de compra</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{isDeuda ? 'Valor original' : 'Valor pujado'}</Text>
          <Text style={styles.rowValue}>${isDeuda ? valorBase.toLocaleString(undefined, {minimumFractionDigits: 2}) : valorPujado.toLocaleString()}</Text>
        </View>
        {comision > 0 && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{isDeuda ? 'Recargo por atraso (10%)' : 'Comision (10%)'}</Text>
            <Text style={styles.rowValue}>${comision.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
        )}
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
        <View style={styles.deliveryHeader}>
          <Ionicons name={metodoEntrega === 'domicilio' ? 'radio-button-on' : 'radio-button-off'} size={22} color={metodoEntrega === 'domicilio' ? COLORS.PRIMARY : '#9CA3AF'} />
          <Text style={styles.deliveryTitle}>Envío a domicilio</Text>
        </View>
        <Text style={styles.deliverySubtitle}>Con seguro incluido - $50</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.deliveryOption, metodoEntrega === 'retiro' && styles.deliveryOptionSelected]}
        onPress={() => setMetodoEntrega('retiro')}
      >
        <View style={styles.deliveryHeader}>
          <Ionicons name={metodoEntrega === 'retiro' ? 'radio-button-on' : 'radio-button-off'} size={22} color={metodoEntrega === 'retiro' ? COLORS.PRIMARY : '#9CA3AF'} />
          <Text style={styles.deliveryTitle}>Retirar personalmente</Text>
        </View>
        <Text style={styles.deliverySubtitle}>Sin costo - Retirar en Av. Libertador 1234, CABA</Text>
        {metodoEntrega === 'retiro' && (
          <View style={styles.warningBox}>
             <Ionicons name="warning-outline" size={16} color="#B45309" />
             <Text style={styles.warningText}>Al retirar personalmente, renunciás a la cobertura del seguro de transporte</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.paymentMethodSection}>
        <Text style={[styles.sectionTitle, { marginLeft: 20 }]}>Método de Pago</Text>
        
        {mediosPago.map(mp => (
          <TouchableOpacity 
            key={mp.identificador} 
            style={[styles.card, styles.paymentCard, selectedMedioId === mp.identificador && !showMPBrick && { borderColor: COLORS.PRIMARY, borderWidth: 2 }]}
            onPress={() => { setSelectedMedioId(mp.identificador); setShowMPBrick(false); }}
          >
            <Ionicons name={mp.tipo === 'TARJETA' ? 'card' : 'business'} size={24} color="#555" />
            <Text style={styles.paymentText}>
              {mp.tipo === 'TARJETA' ? `Tarjeta terminada en ${mp.numero?.slice(-4) || '****'}` : `Cuenta terminada en ${mp.numero?.slice(-4) || '****'}`}
            </Text>
            {selectedMedioId === mp.identificador && !showMPBrick && <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />}
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
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginLeft: 8,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 30,
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
  paymentMethodSection: { marginTop: 20, marginBottom: 10 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, justifyContent: 'space-between', marginHorizontal: 20, marginVertical: 0 },
  paymentText: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  // ========== ESTILOS PARA VISTA DE ÍTEMS PAGADOS ==========
  paidImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  paidBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  paidBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065F46',
    marginLeft: 8,
  },
  paidInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  paidItemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    textAlign: 'center',
  },
  paidSubastaName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  paidCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  paidSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 16,
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  paidRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidRowLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 10,
  },
  paidRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  paidRowValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    maxWidth: 160,
    textAlign: 'right',
  },
  paidDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  receivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  receivedBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
    marginLeft: 4,
  },
});
