import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Package, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ConfirmShippingScreen() {
  const router = useRouter();
  const { proposalId, notificationId } = useLocalSearchParams<{ proposalId: string, notificationId: string }>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const user = useAuthStore(state => state.user);

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Marcar notificación actual como leída
      if (notificationId) {
        await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      }

      // Actualizar estado de la propuesta
      const fakePrice = 1500;
      if (proposalId) {
        await supabase.from('item_proposals').update({
          status: 'appraised',
          proposed_price: fakePrice,
          admin_feedback: 'Tasación automática (1500) según lo solicitado.'
        }).eq('id', proposalId);

        // Crear nueva notificación de tasación para el usuario
        if (user) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'Tasación Finalizada',
            message: `Hemos recibido y tasado tu artículo. Te ofrecemos $1500. ¿Aceptas?`,
            type: 'APPRAISAL_OFFER',
            metadata: { proposal_id: proposalId, price: fakePrice }
          });
        }
      }

      // Redirigir de vuelta a notificaciones
      router.replace('/(main)/notifications');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Ocurrió un error al confirmar el envío. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Envío</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Package color={Colors.light.tint} size={64} />
        </View>

        <Text style={styles.title}>¿Has enviado tu artículo?</Text>
        <Text style={styles.subtitle}>
          Confirma si ya has despachado el artículo hacia nuestra central de SubastasYa para su inspección física y tasación.
        </Text>

        <View style={styles.infoBox}>
          <CheckCircle2 color="#059669" size={24} style={{ marginRight: 10 }} />
          <Text style={styles.infoText}>
            Una vez que confirmes, nuestros expertos lo recibirán y te enviaremos una oferta formal de tasación.
          </Text>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sí, ya lo envié</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Aún no lo he enviado</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
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
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    flex: 1,
    color: '#065F46',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
