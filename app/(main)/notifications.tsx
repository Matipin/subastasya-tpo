import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, BellOff, BellRing, Package, DollarSign, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      if (!authUser) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const handleShippingAction = (notification: any) => {
    const proposalId = notification.metadata?.proposal_id;
    router.push(`/profile/confirm-shipping?proposalId=${proposalId || ''}&notificationId=${notification.id}`);
  };

  const handleAppraisalAction = (notification: any) => {
    const price = notification.metadata?.price || 1500;
    const proposalId = notification.metadata?.proposal_id;
    router.push(`/profile/appraisal-details?proposalId=${proposalId || ''}&notificationId=${notification.id}&price=${price}`);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'SHIPPING_REQUEST': return <Package color={Colors.light.tint} size={28} />;
      case 'APPRAISAL_OFFER': return <DollarSign color={'#2E7D32'} size={28} />;
      default: return <BellRing color={Colors.light.tint} size={28} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContent}>
          <BellOff color={Colors.light.textSecondary} size={64} style={styles.icon} />
          <Text style={styles.title}>Sin notificaciones</Text>
          <Text style={styles.subtitle}>Actualmente no tienes mensajes nuevos ni avisos de subastas.</Text>
          
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {notifications.map(notif => (
            <View key={notif.id} style={[styles.notificationCard, notif.read && styles.notificationCardRead]}>
              <View style={styles.notifIconContainer}>
                {renderIcon(notif.type)}
              </View>
              <View style={styles.notifDetails}>
                <Text style={[styles.notifTitle, !notif.read && { fontWeight: 'bold' }]}>{notif.title}</Text>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                
                {!notif.read && notif.type === 'SHIPPING_REQUEST' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleShippingAction(notif)}>
                    <Text style={styles.actionBtnText}>Marcar como Enviado</Text>
                  </TouchableOpacity>
                )}

                {!notif.read && notif.type === 'APPRAISAL_OFFER' && (
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2E7D32', borderColor: '#2E7D32'}]} onPress={() => handleAppraisalAction(notif)}>
                    <Text style={[styles.actionBtnText, {color: '#FFF'}]}>Ver Tasación</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  listContent: {
    padding: 20,
  },
  icon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint, // Highlight unread
    marginBottom: 16,
    shadowColor: Colors.light.tint,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  notificationCardRead: {
    borderColor: Colors.light.border,
    backgroundColor: '#F8F9FA',
    shadowOpacity: 0,
    elevation: 0,
  },
  notifIconContainer: {
    marginRight: 16,
    paddingTop: 4,
  },
  notifDetails: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
