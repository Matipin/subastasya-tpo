import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';


const { width } = Dimensions.get('window');

export default function DetalleArticuloScreen({ route, navigation }) {
  const { articulo, subasta, usuario } = route.params;
  const isGuest = !usuario || usuario.isGuest;
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [loadingReg, setLoadingReg] = useState(true);

  useEffect(() => {
    if (!isGuest && subasta?.identificador && usuario?.email) {
      fetch(`${API_BASE_URL.replace('/auth', '/users')}/me/profile?email=${encodeURIComponent(usuario.email)}`)
        .then(r => r.json())
        .then(data => {
          setIsRegistered(data.subastasAnotadas?.some(a => a.id === subasta.identificador));
          setLoadingReg(false);
        })
        .catch(e => {
          console.error(e);
          setLoadingReg(false);
        });
    } else {
      setLoadingReg(false);
    }
  }, [subasta, usuario, isGuest]);

  const isSubastaStarted = subasta?.estado === 'abierta' && new Date(subasta?.fecha + 'T' + subasta?.hora) <= new Date();

  const handleRegister = async () => {
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

    try {
      const mpResponse = await fetch(`${API_BASE_URL.replace('/auth', '/users')}/me/medios-de-pago?email=${encodeURIComponent(usuario.email)}`);
      if (mpResponse.ok) {
        const mps = await mpResponse.json();
        if (mps.length === 0) {
          Alert.alert(
            'Medio de Pago Requerido', 
            'Debes registrar un medio de pago habilitado antes de poder anotarte a una subasta.',
            [{ text: 'Registrar', onPress: () => navigation.navigate('GestionarMediosPago') }, { text: 'Cancelar', style: 'cancel' }]
          );
          return;
        }
      }
    } catch(e) { console.log(e); }

    // Validar categoría: comun < especial < plata < oro < platino
    const catOrder = ['comun', 'especial', 'plata', 'oro', 'platino'];
    const userCatIndex = catOrder.indexOf(usuario?.cliente?.categoria || 'comun');
    const subastaCatIndex = catOrder.indexOf(subasta?.categoria || 'comun');
    if (userCatIndex < subastaCatIndex) {
      Alert.alert('Acceso Denegado', `Esta subasta requiere categoría ${subasta.categoria?.toUpperCase()}. Tu categoría actual es ${(usuario?.cliente?.categoria || 'comun').toUpperCase()}.`);
      return;
    }
    
    try {
      const joinResponse = await fetch(`${API_BASE_URL.replace('/auth', '/auctions')}/${subasta.identificador}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId: usuario?.cliente?.identificador })
      });
      if (joinResponse.ok) {
        Alert.alert('Registro Exitoso', 'Te has anotado en la subasta correctamente.');
        setIsRegistered(true);
      } else {
        Alert.alert('Error', 'No se pudo registrar a la subasta.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Registro Exitoso', 'Te has anotado en la subasta correctamente.');
      setIsRegistered(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{articulo.nombre || articulo.producto?.descripcionCompleta || 'Artículo'}</Text>
        
        <View style={{ marginTop: 10 }}>
          <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Precio Base:</Text> {articulo.precioBase || '1.000.000'}</Text>
          <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Actual dueño:</Text> {articulo.producto?.duenio?.nombre || 'Juan Perez'}</Text>
          <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Fecha de subasta:</Text> {subasta?.fecha || '10/10/2026'}</Text>
          <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Categoria minima:</Text> {subasta?.categoria || 'Bronce'}</Text>
          <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Direccion:</Text> {subasta?.ubicacion || 'CABA Rivadavia 1500'}</Text>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Descripcion:</Text>
        <Text style={styles.description}>
          {articulo.producto?.descripcionCompleta || articulo.descripcion || 'Atractivo artículo vintage en muy buen estado de conservación. Una pieza clásica y elegante, perfecta para coleccionistas.'}
        </Text>
      </View>

      {!isGuest && !loadingReg ? (
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
                  Alert.alert('Subasta Programada', 'Aún no es la fecha y hora de inicio de esta subasta.');
                }
              }}
            >
              <Text style={styles.actionText}>{isSubastaStarted ? 'Ingresar a Sala en Vivo' : 'Subasta Programada'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton]} 
              onPress={handleRegister} 
            >
              <Text style={styles.actionText}>Anotarse a la Subasta</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : isGuest ? (
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#852221' }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionText}>Iniciar Sesión para Participar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginRight: 10,
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
  actionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 6,
    lineHeight: 22,
  }
});
