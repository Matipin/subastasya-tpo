import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { MailCheck } from 'lucide-react-native';

export default function RegisterStage2Screen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.stepText}>Etapa 2 de 3 - Investigación</Text>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MailCheck color={Colors.light.tint} size={64} />
        </View>

        <Text style={styles.title}>Solicitud en Revisión</Text>
        <Text style={styles.message}>
          Tus datos (DNI, Domicilio) han sido recibidos y están siendo verificados por nuestra empresa mediante una investigación externa.
        </Text>
        <Text style={styles.message}>
          Si eres aprobado, te enviaremos un correo electrónico con un enlace para que ingreses, generes tu clave personal y registres un medio de pago.
        </Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Estado: En Investigación Externa</Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/register-3')}
        >
          <Text style={styles.buttonText}>[Mock] Simular recibir correo e ir al paso 3</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  stepText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statusBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  statusText: {
    color: Colors.light.card,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 16,
  },
  linkText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
