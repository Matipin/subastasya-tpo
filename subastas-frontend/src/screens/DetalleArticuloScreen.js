import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const { width } = Dimensions.get('window');

export default function DetalleArticuloScreen({ route, navigation }) {
  const { articulo, subasta, usuario } = route.params;
  const isGuest = !usuario || usuario.isGuest;
  const [isRegistered, setIsRegistered] = useState(subasta?.identificador === 1); // Mock initial state based on DataInitializer

  const handleRegister = async () => {
    // 1. Verificar Deudas Impagas
    try {
      const debtsUrl = `${API_BASE_URL.replace('/auth', '/users')}/me/debts?email=${encodeURIComponent(usuario?.email || '')}`;
      const debtsResponse = await fetch(debtsUrl);
      if (debtsResponse.ok) {
        const debtsData = await debtsResponse.json();
        const hasUnpaidDebts = debtsData.some(d => !d.pagada);
        if (hasUnpaidDebts) {
          Alert.alert(
            'Inscripción Bloqueada', 
            'Tienes deudas pendientes por subastas anteriores. Por favor, regulariza tu situación.',
            [{ text: 'Ir a Deudas', onPress: () => navigation.navigate('Deudas', { usuario }) }, { text: 'Cancelar', style: 'cancel' }]
          );
          return;
        }
      }
    } catch (e) {
      console.log('Error checking debts', e);
    }

    // 2. Verificar Medio de Pago
    if (!usuario?.mediosDePago && !usuario?.hasPaymentMethod && usuario?.estadoRegistro !== 'ACTIVO') {
      Alert.alert(
        'Medio de Pago Requerido', 
        'Debes registrar un medio de pago habilitado antes de poder anotarte a una subasta.',
        [{ text: 'Registrar', onPress: () => navigation.navigate('GestionarMediosPago') }, { text: 'Cancelar', style: 'cancel' }]
      );
      return;
    }

    // 2. Verificar Categoría
    if (subasta?.categoria === 'oro' && usuario?.cliente?.categoria !== 'oro') {
      Alert.alert('Acceso Denegado', 'Esta subasta es exclusiva para la categoría ORO.');
      return;
    }
    
    // Simulate successful registration
    Alert.alert('Registro Exitoso', 'Te has anotado en la subasta correctamente.');
    setIsRegistered(true);
  };
  
  const isSubastaStarted = React.useMemo(() => {
    if (!subasta) return false;
    if (subasta.estado !== 'abierta') return false;
    try {
      const subastaDate = new Date(`${subasta.fecha}T${subasta.hora}`);
      return subastaDate <= new Date();
    } catch(e) {
      return true; // Fallback
    }
  }, [subasta]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        {articulo.urlImagen ? (
          <Image 
            source={{ uri: articulo.urlImagen }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={60} color="#CCC" />
          </View>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{articulo.nombre}</Text>
          {!isGuest && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>USD {articulo.precioBase || '100.00'}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-circle-outline" size={20} color="#666" />
          <Text style={styles.artistName}>Autor / Propietario Desconocido</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.artistName}>Año: 2026</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {articulo.descripcion || 'Sin descripción detallada para esta obra de arte en el catálogo. Este artículo formará parte de la subasta programada. Recomendamos revisar las condiciones antes de pujar.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Información de Subasta</Text>
        <View style={styles.auctionInfoBox}>
          <Ionicons name="hammer" size={24} color={COLORS.PRIMARY} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.auctionTitle}>{subasta?.nombre || 'Subasta Activa'} (Cat: {subasta?.categoria})</Text>
            <Text style={styles.auctionStatus}>Estado: {subasta?.estado === 'abierta' && !isSubastaStarted ? 'Programada' : subasta?.estado}</Text>
          </View>
        </View>
      </View>

      {/* Fixed Bottom Action */}
      {!isGuest ? (
        <View style={styles.bottomActionContainer}>
          {isRegistered ? (
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                !isSubastaStarted && { backgroundColor: '#CCC' }
              ]}
              onPress={() => {
                if (isSubastaStarted) {
                  navigation.navigate('SubastaEnVivo', { articulo, subasta, usuario });
                } else {
                  Alert.alert('Subasta Programada', 'Esta subasta aún no ha comenzado.');
                }
              }}
              disabled={!isSubastaStarted}
            >
              <Text style={styles.actionButtonText}>
                {isSubastaStarted ? 'Ingresar a Sala en Vivo' : 'Subasta Programada'}
              </Text>
              {isSubastaStarted && <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRegister}
            >
              <Text style={styles.actionButtonText}>Anotarse a la Subasta</Text>
              <Ionicons name="create-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#852221' }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionButtonText}>Iniciar Sesión para Participar</Text>
            <Ionicons name="person-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: 500,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    flex: 1,
    marginRight: 10,
  },
  priceBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 15,
    color: '#666',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  auctionInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  auctionStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bottomActionContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#852221',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#852221',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
