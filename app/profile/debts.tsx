import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, AlertOctagon } from 'lucide-react-native';

export default function DebtsScreen() {
  const router = useRouter();

  const [debts, setDebts] = useState([
    {
      id: 101,
      tipo: "multa_impago",
      concepto: "10% de oferta por Item #55 no abonada",
      monto: 1200.00,
      fecha_emision: "2026-04-20",
      limite_pago_72hs: "2026-04-23"
    },
    {
      id: 102,
      tipo: "cargo_devolucion",
      concepto: "Envío por bien rechazado - Solicitud #501",
      monto: 150.00,
      fecha_emision: "2026-04-21"
    }
  ]);

  const handlePay = (id: number) => {
    Alert.alert('Pagar Deuda', '¿Confirmas el pago usando tu método de pago principal?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Pagar', 
        onPress: () => {
          setDebts(prev => prev.filter(d => d.id !== id));
          Alert.alert('Éxito', 'Pago procesado. Tu cuenta se ha rehabilitado parcialmente.');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Deudas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {debts.length > 0 && (
          <View style={styles.warningBanner}>
            <AlertOctagon color={Colors.light.error} size={24} />
            <Text style={styles.warningText}>
              Tienes deudas pendientes. Tu capacidad de pujar puede estar restringida.
            </Text>
          </View>
        )}

        {debts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes deudas registradas.</Text>
          </View>
        ) : (
          debts.map(debt => (
            <View key={debt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.debtType}>
                  {debt.tipo === 'multa_impago' ? 'Multa por Impago' : 'Cargo Administrativo'}
                </Text>
                <Text style={styles.debtAmount}>${debt.monto.toLocaleString()}</Text>
              </View>
              <Text style={styles.debtConcept}>{debt.concepto}</Text>
              <Text style={styles.debtDate}>Emitida: {debt.fecha_emision}</Text>
              {debt.limite_pago_72hs && (
                <Text style={styles.debtLimit}>Límite: {debt.limite_pago_72hs}</Text>
              )}
              
              <TouchableOpacity style={styles.payButton} onPress={() => handlePay(debt.id)}>
                <Text style={styles.payButtonText}>Pagar Ahora</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  content: { padding: 20 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211,47,47,0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.error,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    color: Colors.light.error,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  card: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debtType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.error,
  },
  debtConcept: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  debtDate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  debtLimit: {
    fontSize: 12,
    color: Colors.light.error,
    fontWeight: 'bold',
    marginTop: 4,
  },
  payButton: {
    backgroundColor: Colors.light.text, // Boton oscuro para contraste
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
