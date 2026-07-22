import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft, CreditCard, Landmark, Plus, Trash2 } from 'lucide-react-native';

export default function PaymentsScreen() {
  const router = useRouter();

  const [payments, setPayments] = useState([
    { id: 1, type: 'CARD', provider: 'Visa', number: '**** **** **** 4242', expiration: '12/28' },
    { id: 2, type: 'BANK', provider: 'Santander', number: 'CBU: ***1234', expiration: 'N/A' },
  ]);

  const handleDelete = (id: number) => {
    Alert.alert('Eliminar', '¿Estás seguro que deseas eliminar este medio de pago?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: () => {
          setPayments(prev => prev.filter(p => p.id !== id));
          Alert.alert('Éxito', 'Medio de pago eliminado');
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
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Administra tus tarjetas y cuentas bancarias. Es necesario tener al menos un medio de pago verificado para participar en las subastas.
        </Text>

        {payments.map(payment => (
          <View key={payment.id} style={styles.card}>
            <View style={styles.cardIcon}>
              {payment.type === 'CARD' ? (
                <CreditCard color={Colors.light.tint} size={32} />
              ) : (
                <Landmark color={Colors.light.tint} size={32} />
              )}
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardProvider}>{payment.provider}</Text>
              <Text style={styles.cardNumber}>{payment.number}</Text>
              {payment.type === 'CARD' && (
                <Text style={styles.cardExp}>Vence: {payment.expiration}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDelete(payment.id)} style={styles.deleteButton}>
              <Trash2 color={Colors.light.error} size={24} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert('Añadir', 'Formulario para agregar método de pago (Mock)')}>
          <Plus color={Colors.light.tint} size={24} />
          <Text style={styles.addButtonText}>Agregar nuevo método</Text>
        </TouchableOpacity>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardProvider: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  cardExp: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(133, 34, 33, 0.1)', // Fondo primario claro
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
});
