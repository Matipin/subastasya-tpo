import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';

export default function MisProductosScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Productos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tienes productos listados.</Text>
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
  emptyCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 }
});
