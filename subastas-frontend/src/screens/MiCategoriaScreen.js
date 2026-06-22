import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const CATEGORIAS = [
  { id: 'comun', nombre: 'Común', color: '#9CA3AF', icon: 'person', beneficios: ['Participar en subastas comunes', 'Pujar con límites estándar (1%-20%)'] },
  { id: 'especial', nombre: 'Especial', color: '#3B82F6', icon: 'star-half', beneficios: ['Todo lo de Común', 'Acceso a subastas especiales', 'Prioridad en inscripción'] },
  { id: 'plata', nombre: 'Plata', color: '#6B7280', icon: 'star', beneficios: ['Todo lo de Especial', 'Acceso a subastas plata', 'Descuento en comisiones'] },
  { id: 'oro', nombre: 'Oro', color: '#F59E0B', icon: 'medal', beneficios: ['Todo lo de Plata', 'Acceso a subastas exclusivas ORO', 'Pujas SIN límite máximo', 'Atención preferencial'] },
  { id: 'platino', nombre: 'Platino', color: '#8B5CF6', icon: 'diamond', beneficios: ['Todo lo de Oro', 'Invitaciones a subastas privadas', 'Pujas SIN límite máximo', 'Asesor personal dedicado'] },
];

export default function MiCategoriaScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  const categoriaActual = (usuario?.cliente?.categoria || 'comun').toLowerCase();
  const indexActual = CATEGORIAS.findIndex(c => c.id === categoriaActual);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Categoría</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Categoría actual destacada */}
        <View style={[styles.currentCard, { borderColor: CATEGORIAS[indexActual]?.color || '#9CA3AF' }]}>
          <View style={[styles.currentIconBg, { backgroundColor: (CATEGORIAS[indexActual]?.color || '#9CA3AF') + '20' }]}>
            <Ionicons name={CATEGORIAS[indexActual]?.icon || 'person'} size={40} color={CATEGORIAS[indexActual]?.color || '#9CA3AF'} />
          </View>
          <Text style={styles.currentLabel}>Tu nivel actual</Text>
          <Text style={[styles.currentCategory, { color: CATEGORIAS[indexActual]?.color || '#9CA3AF' }]}>
            {CATEGORIAS[indexActual]?.nombre?.toUpperCase() || 'COMUN'}
          </Text>
        </View>

        {/* Escala visual de progresión */}
        <Text style={styles.sectionTitle}>Escala de Categorías</Text>
        
        <View style={styles.scaleContainer}>
          {CATEGORIAS.map((cat, index) => {
            const isActive = index <= indexActual;
            const isCurrent = cat.id === categoriaActual;

            return (
              <View key={cat.id}>
                <View style={styles.scaleRow}>
                  {/* Indicador */}
                  <View style={styles.scaleIndicator}>
                    <View style={[
                      styles.dot,
                      isActive && { backgroundColor: cat.color },
                      isCurrent && styles.dotCurrent,
                    ]}>
                      {isCurrent && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    {index < CATEGORIAS.length - 1 && (
                      <View style={[styles.line, isActive && { backgroundColor: cat.color }]} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={[styles.scaleCard, isCurrent && { borderColor: cat.color, borderWidth: 2, backgroundColor: cat.color + '08' }]}>
                    <View style={styles.scaleCardHeader}>
                      <Ionicons name={cat.icon} size={20} color={isActive ? cat.color : '#D1D5DB'} />
                      <Text style={[styles.scaleName, isActive && { color: cat.color, fontWeight: 'bold' }]}>{cat.nombre}</Text>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: cat.color }]}>
                          <Text style={styles.currentBadgeText}>ACTUAL</Text>
                        </View>
                      )}
                    </View>
                    {isCurrent && (
                      <View style={styles.beneficiosContainer}>
                        {cat.beneficios.map((b, i) => (
                          <View key={i} style={styles.beneficioRow}>
                            <Ionicons name="checkmark-circle" size={14} color={cat.color} />
                            <Text style={styles.beneficioText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Cómo subir */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color="#3B82F6" />
          <Text style={styles.infoText}>
            Para subir de categoría, participá activamente en subastas, pagá tus deudas a tiempo y mantené un historial limpio. La promoción es evaluada periódicamente por el equipo de SubastasYa.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
  },
  content: { padding: 20, paddingBottom: 40 },

  // Current category card
  currentCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  currentIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  currentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentCategory: {
    fontSize: 32,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 16,
  },

  // Scale
  scaleContainer: {
    marginBottom: 24,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scaleIndicator: {
    alignItems: 'center',
    marginRight: 14,
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -2,
  },
  line: {
    width: 3,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  scaleCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scaleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleName: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  beneficiosContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  beneficioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  beneficioText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
});
