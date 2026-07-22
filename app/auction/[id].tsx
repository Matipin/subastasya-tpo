import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Info } from 'lucide-react-native';

import { useAuthStore } from '@/store/useAuthStore';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuthStore(state => !!state.user);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (data) {
          setItem(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!item) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{color: Colors.light.text}}>Artículo no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}>
            <Text style={{color: Colors.light.tint}}>Volver</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Artículo</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.imageCarouselPlaceholder}>
        {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={{width: '100%', height: '100%', resizeMode: 'cover'}} />
        ) : (
            <Text style={{ color: Colors.light.textSecondary }}>Sin foto</Text>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Lote</Text>
          </View>
        </View>
        
        {isAuthenticated ? (
          <>
            <Text style={styles.price}>Precio Base: ${Number(item.starting_price).toLocaleString()} USD</Text>
            <TouchableOpacity 
                style={styles.liveButton} 
                onPress={() => router.push(`/auction/live/${item.auction_id}?item_id=${item.id}`)}>
                <Text style={styles.liveButtonText}>Unirse a la Subasta en Vivo</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ paddingVertical: 20, alignItems: 'center', backgroundColor: Colors.light.border, borderRadius: 12, marginBottom: 24 }}>
            <Text style={{ color: Colors.light.textSecondary, marginBottom: 10 }}>Iniciá sesión para ver el precio y participar</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: Colors.light.tint, fontWeight: 'bold' }}>Ir a Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.infoValue}>{item.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Historia y Contexto</Text>
          <Text style={styles.historyText}>{item.history || 'Sin historia registrada.'}</Text>
        </View>

        <View style={styles.verificationBanner}>
          <Info color="#004D40" size={20} />
          <Text style={styles.verificationText}>Artículo inspeccionado y verificado por SubastasYa.</Text>
        </View>
      </View>
    </ScrollView>
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
  imageCarouselPlaceholder: {
    height: 300,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginRight: 10,
  },
  badge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 16,
  },
  liveButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  liveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoValue: {
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 20,
  },
  historyText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  verificationText: {
    marginLeft: 10,
    color: '#004D40',
    fontWeight: '500',
    flex: 1,
  },
});
