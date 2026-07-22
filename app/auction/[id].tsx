import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Info, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);
  const [auction, setAuction] = useState<any | null>(null);
  const [auctionTotal, setAuctionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchItemAndAuction = async () => {
      try {
        // Fetch Item
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
          
        if (itemError) throw itemError;
        setItem(itemData);

        if (itemData?.auction_id) {
          // Fetch Auction
          const { data: auctionData, error: auctionError } = await supabase
            .from('auctions')
            .select('*')
            .eq('id', itemData.auction_id)
            .single();
          if (auctionError) throw auctionError;
          setAuction(auctionData);

          // Fetch all items to sum price
          const { data: allItems } = await supabase
            .from('items')
            .select('starting_price')
            .eq('auction_id', itemData.auction_id);
            
          const total = allItems?.reduce((sum, i) => sum + Number(i.starting_price), 0) || 0;
          setAuctionTotal(total);

          // Check if registered
          if (user) {
            const { data: regData } = await supabase
              .from('auction_participants')
              .select('*')
              .eq('user_id', user.id)
              .eq('auction_id', itemData.auction_id)
              .single();
              
            if (regData) setIsRegistered(true);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItemAndAuction();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user || !auction) return;
    setRegistering(true);
    
    try {
      // 1. Validar Tiempo: 1 hora antes de que inicie
      const now = new Date();
      const startDate = new Date(auction.start_date);
      const diffMs = startDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 1 && diffHours > 0) {
        Alert.alert('Registro Cerrado', 'La inscripción cierra 1 hora antes de comenzar la subasta.');
        setRegistering(false);
        return;
      }
      
      // 2. Validar Multas Pendientes
      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');
        
      if (debts && debts.length > 0) {
        Alert.alert('Multas Pendientes', 'No puedes inscribirte porque tienes multas pendientes por artículos no retirados.');
        setRegistering(false);
        return;
      }
      
      // 3. Validar Categoría Mínima
      const categories = ['bronze', 'silver', 'gold', 'platinum'];
      const userLevel = categories.indexOf(user.category || 'bronze');
      const auctionLevel = categories.indexOf(auction.minimum_category || 'bronze');
      
      if (userLevel < auctionLevel) {
        Alert.alert('Nivel Insuficiente', `Esta subasta requiere ser nivel ${auction.minimum_category}. Eres nivel ${user.category}.`);
        setRegistering(false);
        return;
      }
      
      // 4. Validar Fondos (20% del total de artículos de la subasta)
      const requiredBalance = auctionTotal * 0.20;
      if (Number(user.guarantee_balance || 0) < requiredBalance) {
        Alert.alert('Fondos Insuficientes', `Necesitas una garantía de al menos $${requiredBalance.toLocaleString()} (20% del total de la subasta).`);
        setRegistering(false);
        return;
      }
      
      // 5. Validar Solapamiento de Horario (1h de diferencia mínima)
      const { data: myInscriptions } = await supabase
        .from('auction_participants')
        .select('auction_id')
        .eq('user_id', user.id);
        
      if (myInscriptions && myInscriptions.length > 0) {
        const myAuctionIds = myInscriptions.map(i => i.auction_id);
        const { data: overlappingAuctions } = await supabase
          .from('auctions')
          .select('id, title, start_date')
          .in('id', myAuctionIds);
          
        if (overlappingAuctions) {
          for (const oa of overlappingAuctions) {
            const oaStart = new Date(oa.start_date).getTime();
            const thisStart = startDate.getTime();
            const diffInHours = Math.abs(oaStart - thisStart) / (1000 * 60 * 60);
            if (diffInHours < 1) {
              Alert.alert('Solapamiento de Horario', `Ya estás inscripto en la subasta '${oa.title}' que inicia al mismo tiempo (debe haber 1 hora de diferencia).`);
              setRegistering(false);
              return;
            }
          }
        }
      }
      
      // Inscribir
      const { error: insertError } = await supabase
        .from('auction_participants')
        .insert({ user_id: user.id, auction_id: auction.id });
        
      if (insertError) throw insertError;
      
      setIsRegistered(true);
      Alert.alert('¡Inscripción Exitosa!', 'Te has inscripto correctamente a esta subasta.');
      
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'No se pudo completar la inscripción.');
    } finally {
      setRegistering(false);
    }
  };

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

  const now = new Date();
  const isAuctionActive = auction && new Date(auction.start_date) <= now && new Date(auction.end_date) >= now;

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
        
        {user ? (
          <>
            <Text style={styles.price}>Precio Base: ${Number(item.starting_price).toLocaleString()} USD</Text>
            
            {auction && (
              <View style={styles.auctionContextCard}>
                <Text style={styles.auctionTitle}>Subasta: {auction.title}</Text>
                <Text style={styles.auctionDate}>Inicio: {new Date(auction.start_date).toLocaleString()}</Text>
                <Text style={styles.auctionCat}>Categoría Mínima: {auction.minimum_category}</Text>
              </View>
            )}

            {!isRegistered ? (
              <TouchableOpacity 
                  style={[styles.liveButton, { backgroundColor: Colors.light.icon }]} 
                  onPress={handleRegister}
                  disabled={registering}>
                  <Text style={styles.liveButtonText}>
                    {registering ? 'Validando...' : 'Inscribirse a la Subasta'}
                  </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.registeredBanner}>
                  <CheckCircle2 color="#059669" size={20} />
                  <Text style={styles.registeredText}>Estás inscripto en esta subasta</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.liveButton, !isAuctionActive && { opacity: 0.5 }]} 
                    onPress={() => {
                      if (!isAuctionActive) {
                        Alert.alert('Subasta no iniciada', 'La subasta aún no ha comenzado o ya finalizó.');
                        return;
                      }
                      router.push(`/auction/live/${item.auction_id}?item_id=${item.id}`);
                    }}>
                    <Text style={styles.liveButtonText}>Entrar a Sala en Vivo</Text>
                </TouchableOpacity>
              </View>
            )}
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
  auctionContextCard: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  auctionTitle: {
    fontWeight: 'bold',
    color: '#334155',
  },
  auctionDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  auctionCat: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  registeredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  registeredText: {
    marginLeft: 8,
    color: '#065F46',
    fontWeight: '600',
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
