import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';

export default function MiCategoriaScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mi Categoría</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Nivel Actual:</Text>
          <Text style={styles.category}>{usuario?.cliente?.categoria || 'COMUN'}</Text>
          <Text style={styles.description}>
            Continúa participando en subastas para subir de nivel y obtener beneficios exclusivos como pujas sin límite.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { padding: 20, paddingTop: 50, backgroundColor: COLORS.CARD_BG, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginBottom: 10 },
  backText: { color: COLORS.PRIMARY, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  content: { padding: 20 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, alignItems: 'center' },
  label: { color: '#666', fontSize: 16, marginBottom: 10 },
  category: { fontSize: 32, fontWeight: 'bold', color: '#D4AF37', marginBottom: 15 },
  description: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 }
});
