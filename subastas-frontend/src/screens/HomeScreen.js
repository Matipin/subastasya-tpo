import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';


export default function HomeScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  const [subastas, setSubastas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubastas();
  }, []);

  const fetchSubastas = async () => {
    try {
      const response = await fetch(API_BASE_URL.replace('/auth', '/subastas'));
      const data = await response.json();
      setSubastas(data);
    } catch (error) {
      console.error('Error fetching subastas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePujar = () => {
    if (!usuario?.medioPagoRegistrado) {
      Alert.alert(
        'Medio de pago requerido',
        'Para pujar en subastas necesitás registrar un medio de pago primero.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Registrar ahora',
            onPress: () => navigation.navigate('MedioPago', { usuario }),
          },
        ]
      );
    } else {
      Alert.alert('¡Puja registrada!', 'Tu oferta fue enviada. (Funcionalidad en desarrollo)');
    }
  };

  const renderItem = ({ item }) => {
    // Tomamos la imagen del primer articulo si existe, sino un placeholder
    const firstArticulo = item.articulos && item.articulos.length > 0 ? item.articulos[0] : null;
    const imageUrl = firstArticulo ? firstArticulo.urlImagen : 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?q=80&w=200&auto=format&fit=crop';
    
    // Formatear fechas si vienen como string
    const fechaInicio = item.fechaInicio ? new Date(item.fechaInicio).toLocaleDateString() : '';

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardDesc}>Estado: {item.estado}</Text>
          <Text style={styles.cardDesc}>Fecha: {fechaInicio}</Text>
          <Text style={styles.cardPrice}>{item.articulos?.length || 0} Lotes disponibles</Text>
          <TouchableOpacity style={styles.pujaBtn} onPress={() => {
            if (usuario?.isGuest) {
              Alert.alert(
                'Modo Invitado',
                'Para ver los lotes o participar en la subasta tenés que iniciar sesión o registrarte.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Iniciar Sesión', onPress: () => navigation.replace('Login') }
                ]
              );
            } else {
              // Funcionalidad en desarrollo
            }
          }}>
            <Text style={styles.pujaBtnText}>Ver Lotes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Subastas</Text>
          {usuario && (
            <Text style={styles.headerSub}>Hola, {usuario.nombre} 👋</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {!usuario?.isGuest && !usuario?.medioPagoRegistrado && (
            <TouchableOpacity
              style={styles.warnBadge}
              onPress={() => navigation.navigate('MedioPago', { usuario })}
            >
              <Text style={styles.warnBadgeText}>⚠️ Pago</Text>
            </TouchableOpacity>
          )}
          {!usuario?.isGuest && (
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => navigation.navigate('ProfileDashboard', { usuario })}
            >
              <Text style={styles.profileBtnText}>👤</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.profileBtn, {marginLeft: 10, backgroundColor: '#FEE2E2'}]}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.profileBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de aviso si no tiene medio de pago */}
      {!usuario?.isGuest && !usuario?.medioPagoRegistrado && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate('MedioPago', { usuario })}
        >
          <Text style={styles.bannerText}>
            ⚠️  Podés ver las subastas, pero para pujar necesitás registrar un medio de pago. Tocá aquí para hacerlo.
          </Text>
        </TouchableOpacity>
      )}

      {/* Banner de aviso si es invitado */}
      {usuario?.isGuest && (
        <View style={[styles.banner, { backgroundColor: '#E0F2FE', borderBottomColor: '#0284C7' }]}>
          <Text style={[styles.bannerText, { color: '#075985' }]}>
            👋 Estás en modo invitado. Solo podés ver el catálogo. Para participar o ver detalles, iniciá sesión.
          </Text>
        </View>
      )}

      <FlatList
        data={subastas}
        keyExtractor={(item, index) => (item.identificador || item.id || index).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  loaderContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 55, paddingBottom: 12,
    backgroundColor: COLORS.CARD_BG,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  headerSub: { fontSize: 13, color: '#777', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  warnBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#F59E0B', marginRight: 10
  },
  warnBadgeText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  profileBtn: {
    backgroundColor: '#EEE', width: 40, height: 40,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center'
  },
  profileBtnText: { fontSize: 20 },
  banner: {
    backgroundColor: '#FFF8E1', borderRadius: 0,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F59E0B',
  },
  bannerText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  listContainer: { padding: 20 },
  card: {
    backgroundColor: COLORS.CARD_BG, borderRadius: 14,
    marginBottom: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  image: { width: '100%', height: 180, backgroundColor: '#EEE', resizeMode: 'cover' },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_TITLE, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardPrice: { fontSize: 17, color: COLORS.PRIMARY, fontWeight: '700', marginBottom: 14 },
  pujaBtn: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 10,
    borderRadius: 8, alignItems: 'center',
  },
  pujaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
