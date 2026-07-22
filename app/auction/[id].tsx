import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { api } from '@/services/mockApi';
import { Item } from '@/types';
import { ChevronLeft, Info } from 'lucide-react-native';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await api.items.getById(Number(id));
        if (data) {
          setItem(data);
        } else {
          // Mock fallback
          setItem({
            id: Number(id),
            numero_pieza: `B-${id}`,
            descripcion: 'Antigüedad / Artículo de Subasta',
            historia: 'Un artículo con gran valor histórico y conservación excelente. Perteneció a una colección privada importante antes de salir a subasta pública.',
            fecha_creacion: '1900',
            artista: 'Autor Desconocido',
            precio_base: 500000,
            dueño_actual: 'Anónimo',
            imagenes: [],
            ubicacion_deposito: 'Sede Central CABA',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!item) return null;

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
        <Text style={{ color: Colors.light.textSecondary }}>Imágenes del artículo (1/6)</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.descripcion}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Lote #{item.numero_pieza}</Text>
          </View>
        </View>
        
        <Text style={styles.price}>Precio Base: ${item.precio_base.toLocaleString()}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Descripción Técnica</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Artista/Autor:</Text>
            <Text style={styles.infoValue}>{item.artista || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Año de creación:</Text>
            <Text style={styles.infoValue}>{item.fecha_creacion || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ubicación:</Text>
            <Text style={styles.infoValue}>{item.ubicacion_deposito}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Historia y Contexto</Text>
          <Text style={styles.historyText}>{item.historia || 'Sin historia registrada.'}</Text>
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
    height: 250,
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
    marginBottom: 24,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.light.text,
    fontWeight: '500',
    fontSize: 14,
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
