import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Store, Truck, ChevronLeft, CheckCircle2, MapPin, AlertCircle, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ReturnItemScreen() {
  const router = useRouter();
  const { proposalId, notificationId } = useLocalSearchParams<{ proposalId: string, notificationId: string }>();
  const user = useAuthStore(state => state.user);
  
  const [proposal, setProposal] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<'pickup' | 'shipping'>('pickup');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState('Buenos Aires');
  const [postalCode, setPostalCode] = useState('1425');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (proposalId) {
      supabase.from('item_proposals').select('*').eq('id', proposalId).single().then(({ data }) => {
        if (data) setProposal(data);
      });
    }
  }, [proposalId]);

  const handleConfirm = async () => {
    if (selectedOption === 'shipping' && (!address.trim() || !phone.trim())) {
      Alert.alert('Datos Incompletos', 'Por favor ingresa la dirección de entrega y un teléfono de contacto.');
      return;
    }

    setLoading(true);
    try {
      const detailsMsg = selectedOption === 'pickup'
        ? 'Retiro presencial en Sede Central (Av. Libertador 4850, Piso 3, CABA).'
        : `Envío a domicilio: ${address}, ${city} (CP: ${postalCode}). Tel: ${phone}. Costo: $15.000.`;

      // 1. Rechazamos la tasación
      if (proposalId) {
        await supabase
          .from('item_proposals')
          .update({ 
            status: 'rejected',
            admin_feedback: `Devolución solicitada por el usuario: ${detailsMsg}`
          })
          .eq('id', proposalId);
      }
      
      // 2. Marcamos notificación como leída
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }

      // 3. Crear notificación con las instrucciones de retiro / envío
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: selectedOption === 'pickup' ? 'Instrucciones de Retiro en Sede' : 'Devolución Despachada',
          message: selectedOption === 'pickup'
            ? 'Puedes pasar a retirar tu artículo por Sede Central: Av. del Libertador 4850, Piso 3, CABA de Lun a Vie de 9 a 18 hs con tu DNI.'
            : `Tu artículo será enviado a ${address}, ${city}. Costo de envío: $15.000.`,
          type: 'INFO'
        });
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Hubo un problema procesando tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/profile/my-items')} style={styles.backButton}>
            <ChevronLeft color={Colors.light.text} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Devolución Registrada</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5', width: 80, height: 80, borderRadius: 40 }]}>
            <CheckCircle2 color="#059669" size={48} />
          </View>
          <Text style={[styles.title, { textAlign: 'center', marginTop: 16 }]}>¡Solicitud Confirmada!</Text>
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
            {selectedOption === 'pickup' 
              ? 'Tu artículo se encuentra resguardado en nuestra sede central listo para ser retirado.' 
              : 'Hemos programado el despacho de tu artículo hacia el domicilio especificado.'}
          </Text>

          <View style={[styles.summaryCard, { width: '100%' }]}>
            <Text style={styles.summaryTitle}>
              {selectedOption === 'pickup' ? '📍 Dónde Retirar:' : '🚚 Datos de Envío:'}
            </Text>
            {selectedOption === 'pickup' ? (
              <>
                <Text style={styles.summaryItem}>• Dirección: Av. del Libertador 4850, Piso 3, CABA (CP 1426)</Text>
                <Text style={styles.summaryItem}>• Horario: Lunes a Viernes de 09:00 a 18:00 hs</Text>
                <Text style={styles.summaryItem}>• Requisitos: Presentar DNI titular en ventanilla</Text>
                <Text style={[styles.summaryItem, { color: '#B45309', marginTop: 8 }]}>
                  * Nota: Al retirar personalmente, el artículo cesa su cobertura de póliza de seguro de transporte.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.summaryItem}>• Destino: {address}, {city} (CP: {postalCode})</Text>
                <Text style={styles.summaryItem}>• Contacto: {phone}</Text>
                <Text style={styles.summaryItem}>• Costo de logística asegurada: $15.000 ARS</Text>
                <Text style={styles.summaryItem}>• Tiempo estimado: 48 a 72 hs hábiles</Text>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.confirmButton, { width: '100%', marginTop: 32 }]}
            onPress={() => router.replace('/profile/my-items')}
          >
            <Text style={styles.confirmButtonText}>Ir a Mis Productos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Devolución</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Rechazo de Tasación</Text>
        {proposal && (
          <Text style={styles.itemRefText}>
            Artículo: <Text style={{ fontWeight: 'bold' }}>{proposal.title}</Text>
          </Text>
        )}
        <Text style={styles.subtitle}>
          Has decidido no aceptar el valor base de tasación o comisiones ofrecidas. De acuerdo con el reglamento, procedemos a coordinar la restitución del bien:
        </Text>

        {/* Opción 1: Retiro en Sucursal */}
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedOption === 'pickup' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedOption('pickup')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, selectedOption === 'pickup' && { backgroundColor: Colors.light.tint }]}>
            <Store color={selectedOption === 'pickup' ? '#FFF' : Colors.light.textSecondary} size={28} />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Retirar en Sede Central (Gratis)</Text>
            <Text style={styles.optionDescription}>
              Sin cargo adicional ($0). Retiras personalmente por nuestra central en CABA.
            </Text>
          </View>
          {selectedOption === 'pickup' && <CheckCircle2 color={Colors.light.tint} size={24} />}
        </TouchableOpacity>

        {selectedOption === 'pickup' && (
          <View style={styles.detailBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin color={Colors.light.tint} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.detailBoxTitle}>Dirección de Retiro</Text>
            </View>
            <Text style={styles.detailBoxText}>• Sede Central: Av. del Libertador 4850, Piso 3, CABA (CP 1426)</Text>
            <Text style={styles.detailBoxText}>• Horarios: Lunes a Viernes de 09:00 a 18:00 hs</Text>
            <Text style={styles.detailBoxText}>• Requisito: Presentar DNI físico del titular registrado</Text>
            
            <View style={styles.warningNote}>
              <AlertCircle color="#B45309" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.warningNoteText}>
                Al retirar personalmente el bien, cesa la cobertura de la póliza de seguro de transporte de la empresa una vez entregado.
              </Text>
            </View>
          </View>
        )}

        {/* Opción 2: Envío a Domicilio */}
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedOption === 'shipping' && styles.optionCardSelected
          ]}
          onPress={() => setSelectedOption('shipping')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, selectedOption === 'shipping' && { backgroundColor: Colors.light.tint }]}>
            <Truck color={selectedOption === 'shipping' ? '#FFF' : Colors.light.textSecondary} size={28} />
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionTitle}>Envío a Domicilio ($15.000)</Text>
            <Text style={styles.optionDescription}>
              Enviamos el artículo embalado con seguro de traslado hasta tu domicilio. Costo a cargo del solicitante.
            </Text>
          </View>
          {selectedOption === 'shipping' && <CheckCircle2 color={Colors.light.tint} size={24} />}
        </TouchableOpacity>

        {selectedOption === 'shipping' && (
          <View style={styles.formContainer}>
            <Text style={styles.formHeading}>Dirección y Datos para el Envío</Text>
            
            <Text style={styles.inputLabel}>Dirección (Calle y Número)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Av. Santa Fe 2450, 4to B"
              value={address}
              onChangeText={setAddress}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>Ciudad / Localidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: CABA"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Cód. Postal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1425"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: +54 9 11 4567-8900"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.costBadge}>
              <Text style={styles.costLabel}>Costo total de logística y seguro:</Text>
              <Text style={styles.costValue}>$15.000 ARS</Text>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {selectedOption === 'pickup' ? 'Confirmar Retiro en Sucursal' : 'Confirmar Envío a Domicilio'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  optionCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#F4F8FF', // Light blue tint
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionDetails: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  confirmButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.light.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  itemRefText: {
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 8,
  },
  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  detailBoxTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  detailBoxText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  warningNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  warningNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  formContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },
  costBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  costLabel: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
});

