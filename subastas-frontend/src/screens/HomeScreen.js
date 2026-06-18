import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, TouchableOpacity, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      const response = await fetch(API_BASE_URL.replace('/auth', '/auctions'));
      let data = await response.json();
      
      if (data && data.length > 0) {
        data.forEach(subasta => {
          if (subasta.estado === 'abierta' || subasta.estado === 'programada') {
            if (subasta.articulos && subasta.articulos.length > 0) {
              subasta.articulos.forEach(articulo => {
                allItems.push({ ...subasta, articulos: [articulo] });
              });
            }
          }
        });
        setSubastas(allItems);
      } else {
        setSubastas([]);
      }
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
    const articulo = item.articulos && item.articulos.length > 0 ? item.articulos[0] : null;
    if (!articulo) return null;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('DetalleArticulo', { articulo, subasta: item, usuario })}
      >
        <Image source={{ uri: articulo.urlImagen }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{articulo.nombre}</Text>
          <Text style={styles.cardPrice}>Precio base: {articulo.precioBase}$</Text>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Menu / Home</Text>
        </View>
        <View style={styles.headerRight}>
          {!usuario?.isGuest && (
            <>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Notificaciones', { usuario })}
              >
                <Ionicons name="notifications-outline" size={28} color="#222" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => navigation.navigate('ProfileDashboard', { usuario })}
              >
                <Ionicons name="person-circle" size={32} color="#222" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="log-out-outline" size={28} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="menu-outline" size={20} color="#666" style={{ marginRight: 10 }} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar..."
          placeholderTextColor="#999"
        />
        <Ionicons name="search-outline" size={20} color="#666" style={{ marginLeft: 10 }} />
      </View>

      <Text style={styles.sectionTitle}>Item Destacadas</Text>

      <FlatList
        data={subastas}
        keyExtractor={(item, index) => (item.articulos?.[0]?.id || item.identificador || index).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
      />

      {/* Botón Flotante para Proponer Artículo */}
      {!usuario?.isGuest && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('PropuestaArticulo', { usuario })}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loaderContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 20, paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333'
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#F8F9FA', borderRadius: 20,
    margin: 5, flex: 1, overflow: 'hidden', maxWidth: '48%',
    paddingBottom: 15,
  },
  image: { width: '100%', height: 140, resizeMode: 'cover', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardContent: { padding: 12, paddingTop: 10 },
  cardTitle: { fontSize: 10, color: '#333', marginBottom: 2 },
  cardPrice: { fontSize: 9, color: '#666' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 34,
  }
});
