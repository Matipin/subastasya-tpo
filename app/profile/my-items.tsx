import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Box, CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function MyItemsScreen() {
  const router = useRouter();

  const mockProposed = [
    {
      solicitud_id: 501,
      titulo: "Jarrón Dinastía Ming",
      estado: "rechazado",
      motivo_rechazo: "El artículo no coincide con las fotos enviadas o su autenticidad no pudo ser verificada.",
      costo_devolucion: 150.00
    },
    {
      solicitud_id: 502,
      titulo: "Cuadro Pintor Argentino",
      estado: "aceptado",
      proxima_subasta: {
        fecha_hora: "2026-06-10T14:00:00Z",
        lugar: "Sede Central, CABA",
        valor_base_asignado: 1200000.00,
        comision_venta: "15%"
      }
    },
    {
      solicitud_id: 503,
      titulo: "Mesa de Roble Antigua",
      estado: "pendiente"
    }
  ];

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'aceptado': return <CheckCircle color="#2E7D32" size={24} />;
      case 'rechazado': return <XCircle color={Colors.light.error} size={24} />;
      default: return <Clock color="#ED6C02" size={24} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Productos</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Seguimiento de los artículos que has propuesto para subastar.
        </Text>

        {mockProposed.map(item => (
          <View key={item.solicitud_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Box color={Colors.light.textSecondary} size={24} />
              <View style={styles.titleContainer}>
                <Text style={styles.itemTitle}>{item.titulo}</Text>
                <Text style={styles.solicitudId}>Solicitud #{item.solicitud_id}</Text>
              </View>
              {getStatusIcon(item.estado)}
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Estado Actual:</Text>
              <Text style={[styles.statusValue, 
                item.estado === 'aceptado' && {color: '#2E7D32'},
                item.estado === 'rechazado' && {color: Colors.light.error},
                item.estado === 'pendiente' && {color: '#ED6C02'},
              ]}>
                {item.estado.toUpperCase()}
              </Text>
            </View>

            {item.estado === 'rechazado' && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackTitle}>Motivo del rechazo:</Text>
                <Text style={styles.feedbackText}>{item.motivo_rechazo}</Text>
                <Text style={styles.feedbackTextError}>Costo de devolución: ${item.costo_devolucion}</Text>
              </View>
            )}

            {item.estado === 'aceptado' && item.proxima_subasta && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>¡Aprobado para subasta!</Text>
                <Text style={styles.successText}>Valor base: ${item.proxima_subasta.valor_base_asignado.toLocaleString()}</Text>
                <Text style={styles.successText}>Comisión de venta: {item.proxima_subasta.comision_venta}</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Aceptar Condiciones</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.estado === 'pendiente' && (
              <Text style={styles.pendingText}>El artículo está siendo evaluado por nuestros expertos. Te notificaremos pronto.</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.light.card, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  content: { padding: 20 },
  infoText: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 20 },
  card: {
    backgroundColor: Colors.light.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.border, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  titleContainer: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  solicitudId: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  statusBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 14, color: Colors.light.textSecondary, marginRight: 8 },
  statusValue: { fontSize: 14, fontWeight: 'bold' },
  feedbackBox: { backgroundColor: 'rgba(211,47,47,0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(211,47,47,0.2)' },
  feedbackTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.light.error, marginBottom: 4 },
  feedbackText: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 4 },
  feedbackTextError: { fontSize: 12, fontWeight: 'bold', color: Colors.light.error },
  successBox: { backgroundColor: '#F1F8E9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#C5E1A5' },
  successTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  successText: { fontSize: 13, color: '#333', marginBottom: 4 },
  actionButton: { backgroundColor: Colors.light.tint, padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  pendingText: { fontSize: 13, color: Colors.light.textSecondary, fontStyle: 'italic' },
});
