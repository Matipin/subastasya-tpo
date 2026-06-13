import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function DetalleArticuloScreen({ route, navigation }) {
  const { articulo, subasta } = route.params;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>USD {articulo.precioBase || '100'}</Text>
          </View>
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
          <Ionicons name="gavel" size={24} color={COLORS.PRIMARY} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.auctionTitle}>{subasta?.nombre || 'Subasta Activa'}</Text>
            <Text style={styles.auctionStatus}>Estado: {subasta?.estado || 'Programada'}</Text>
          </View>
        </View>
      </View>

      {/* Fixed Bottom Action */}
      <View style={styles.bottomActionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SubastaEnVivo', { articulo, subasta })}
        >
          <Text style={styles.actionButtonText}>Ingresar a Sala en Vivo</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#1B263B',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1B263B',
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
