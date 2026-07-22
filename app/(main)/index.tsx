import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Search, Bell, UserCircle } from 'lucide-react-native';
import { api } from '@/services/mockApi';
import { Item } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        // Fetching items from the first auction as a mock catalog
        const catalog = await api.auctions.getCatalog(1);
        
        // Simulating multiple items for the grid
        const mockGrid = [
          ...catalog,
          { id: 101, numero_pieza: 'B-1', descripcion: 'Telefono vintage', precio_base: 1000000, dueño_actual: '', imagenes: [] },
          { id: 102, numero_pieza: 'B-2', descripcion: 'Muñeca vintage', precio_base: 1000000, dueño_actual: '', imagenes: [] },
          { id: 103, numero_pieza: 'B-3', descripcion: 'Juego de tazas vintage', precio_base: 1000000, dueño_actual: '', imagenes: [] },
        ];
        
        setItems(mockGrid);
      } catch (error) {
        console.error("Error fetching catalog", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu / Home</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell color={Colors.light.text} size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/profile')}>
            <UserCircle color={Colors.light.text} size={32} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search color={Colors.light.icon} size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar subastas, categorías..."
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Item Destacadas</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                onPress={() => router.push(`/auction/${item.id}`)}
              >
                <View style={styles.imagePlaceholder}>
                   {/* Imagen Placeholder */}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.itemTitle}>{item.descripcion}</Text>
                  <Text style={styles.itemPrice}>Precio base: {item.precio_base.toLocaleString()}$</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.border,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Espacio final
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  cardContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
