import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Store, Truck, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function ReturnItemScreen() {
  const router = useRouter();
  const { proposalId, notificationId } = useLocalSearchParams<{ proposalId: string, notificationId: string }>();
  
  const [selectedOption, setSelectedOption] = useState<'pickup' | 'shipping' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedOption) return;

    setLoading(true);
    try {
      // Rechazamos la tasación (actualiza la propuesta)
      if (proposalId) {
        await supabase
          .from('item_proposals')
          .update({ status: 'rejected' })
          .eq('id', proposalId);
      }
      
      // Marcamos la notificación como leída
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }

      const message = selectedOption === 'pickup' 
        ? 'Puedes pasar a retirar tu artículo por nuestra sucursal principal de Lunes a Viernes de 9 a 18hs.'
        : 'El costo de envío ha sido descontado de tu cuenta. Te enviaremos tu artículo en las próximas 48 horas hábiles.';

      Alert.alert(
        'Devolución Confirmada',
        message,
        [
          { text: 'Entendido', onPress: () => router.replace('/(main)/notifications') }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema procesando tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Devolución</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tasación Rechazada</Text>
        <Text style={styles.subtitle}>
          Lamentamos que nuestra oferta no haya sido de tu agrado. Para devolverte el artículo de forma segura, selecciona cómo prefieres recibirlo:
        </Text>

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
            <Text style={styles.optionTitle}>Retirar en Sucursal</Text>
            <Text style={styles.optionDescription}>Acércate a nuestra sede central sin costo adicional. Disponible inmediatamente.</Text>
          </View>
          {selectedOption === 'pickup' && <CheckCircle2 color={Colors.light.tint} size={24} />}
        </TouchableOpacity>

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
            <Text style={styles.optionTitle}>Envío a Domicilio</Text>
            <Text style={styles.optionDescription}>Enviaremos el artículo protegido. Costo: $15.000 (se descuenta de tu garantía).</Text>
          </View>
          {selectedOption === 'shipping' && <CheckCircle2 color={Colors.light.tint} size={24} />}
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            (!selectedOption || loading) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!selectedOption || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Devolución</Text>
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
    paddingTop: 60,
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
  }
});
