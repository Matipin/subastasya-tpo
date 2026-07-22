import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Plus } from 'lucide-react-native';

export default function RegisterStage3Screen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepText}>Etapa 3 de 3</Text>
        <Text style={styles.title}>Clave y medios de pago</Text>
        
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Crea tu clave</Text>
          
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} placeholder="Ej: Juan_Perez1234" secureTextEntry />

          <Text style={styles.label}>Confirmar Contraseña</Text>
          <TextInput style={styles.input} placeholder="Ej: Juan_Perez1234" secureTextEntry />

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Medios de pago</Text>
          <Text style={styles.subtitle}>Selecciona y registra un metodo de pago (Obligatorio)</Text>

          <TouchableOpacity style={styles.paymentOption}>
            <Text style={styles.paymentText}>Cuenta bancaria</Text>
            <Plus color={Colors.light.tint} size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption}>
            <Text style={styles.paymentText}>Tarjeta de credito</Text>
            <Plus color={Colors.light.tint} size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption}>
            <Text style={styles.paymentText}>Cheque certificado</Text>
            <Plus color={Colors.light.tint} size={24} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { marginTop: 40 }]} 
            onPress={() => {
              Alert.alert(
                'Registro Completo',
                'Tu clave y medio de pago han sido registrados exitosamente. Ahora ya puedes ingresar a la aplicación y participar en las subastas con tu categoría asignada.',
                [
                  { text: 'Ingresar', onPress: () => router.replace('/(auth)/login') }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>Finalizar Registro (Ingresar)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  stepText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  label: {
    color: Colors.light.text,
    fontWeight: '500',
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.light.card,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.light.card,
    marginTop: 8,
  },
  paymentText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
