import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/constants/theme';
import { UserCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const [stats, setStats] = useState({ asistencias: 0, ganadas: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        // 1. Asistencias: Unique items bid on
        const { data: bids } = await supabase
          .from('bids')
          .select('item_id, amount')
          .eq('bidder_id', user.id);
          
        if (bids) {
          const uniqueItems = new Set(bids.map(b => b.item_id));
          
          // 2. Ganadas: Find out if user's max bid is the overall max bid for sold items
          let wonCount = 0;
          
          // Fetch status of all unique items to check if they are 'sold'
          const { data: items } = await supabase
            .from('items')
            .select('id, status')
            .in('id', Array.from(uniqueItems));
            
          const soldItemIds = items?.filter(i => i.status === 'sold').map(i => i.id) || [];
          
          if (soldItemIds.length > 0) {
            // For each sold item the user bid on, check if they are the winner
            for (const itemId of soldItemIds) {
              const { data: maxBid } = await supabase
                .from('bids')
                .select('bidder_id')
                .eq('item_id', itemId)
                .order('amount', { ascending: false })
                .limit(1)
                .single();
                
              if (maxBid?.bidder_id === user.id) {
                wonCount++;
              }
            }
          }
          
          setStats({
            asistencias: uniqueItems.size,
            ganadas: wonCount
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    
    fetchStats();
  }, [user]);

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <UserCircle size={80} color={Colors.light.text} />
        <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>Categoría: {(user.category || 'bronze').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/edit')}>
          <Text style={styles.actionText}>Editar Perfil</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/my-auctions')}>
          <Text style={styles.actionText}>Mis subastas</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/won-items')}>
          <Text style={styles.actionText}>Subastas ganadas</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/payments')}>
          <Text style={styles.actionText}>Gestionar métodos de pago</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/propose-item')}>
          <Text style={styles.actionText}>Postular venta de producto</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/my-items')}>
          <Text style={styles.actionText}>Mis Productos (Seguimiento)</Text>
          <ChevronRight color={Colors.light.icon} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Estadísticas</Text>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.asistencias}</Text>
          <Text style={styles.statLabel}>Asistencias</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.ganadas}</Text>
          <Text style={styles.statLabel}>Ganadas</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionButtonError} onPress={() => router.push('/profile/debts')}>
        <Text style={[styles.actionText, { color: Colors.light.error }]}>Ver Deudas y Multas</Text>
        <ChevronRight color={Colors.light.error} size={20} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color={Colors.light.error} size={20} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 10,
  },
  categoryBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  actions: {
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionButtonError: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(211,47,47,0.05)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  actionText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    padding: 16,
  },
  logoutText: {
    color: Colors.light.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
