import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { MailCheck } from 'lucide-react-native';

export default function RegisterStage2Screen() {
  const router = useRouter();
  const { email, firstName, lastName, address, country } = useLocalSearchParams<{ email: string, firstName: string, lastName: string, address: string, country: string }>();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Simulamos la investigación externa y mandamos el mail con el Google Apps Script original
    const sendMail = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      
      const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedToken(newToken);
      
      try {
        const scriptUrl = "https://script.google.com/macros/s/AKfycbxiIP0HRx_zcmGvui9FQr4ueyyB1vnHxee-dHH_NJEvx_aDh_Smh_AUmSBxZZSBp3OuIQ/exec";
        const text = `¡Hola!\n\n` +
          `Buenas noticias, tus datos han sido revisados y validados por nuestro equipo.\n\n` +
          `Para activar tu cuenta y configurar tu contraseña, ingresá a la app y pegá el siguiente código de activación:\n\n` +
          `<h1>${newToken}</h1>\n\n` +
          `¡Te esperamos en las subastas!\n` +
          `El equipo de SubastasYa.`;

        const payload = {
          to: email,
          subject: "SubastasYa - Tu cuenta ha sido validada",
          html: text.replace(/\n/g, "<br>")
        };

        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        setEmailSent(true);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "No se pudo enviar el correo de validación.");
      } finally {
        setLoading(false);
      }
    };
    
    // Retraso de 3 segundos para simular el proceso de investigación
    setTimeout(sendMail, 3000);
  }, [email]);

  const handleVerify = () => {
    if (token.toUpperCase() === generatedToken) {
      router.push({ 
        pathname: '/(auth)/register-3', 
        params: { email, firstName, lastName, address, country } 
      });
    } else {
      Alert.alert('Error', 'Código incorrecto. Revisa tu correo electrónico.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.stepText}>Etapa 2 de 3 - Investigación</Text>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MailCheck color={Colors.light.tint} size={64} />
        </View>

        <Text style={styles.title}>Revisión de Seguridad</Text>
        
        {loading ? (
          <>
            <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginVertical: 20 }} />
            <Text style={styles.message}>
              Estamos verificando tu documentación y cruzando datos... Por favor espera un momento.
            </Text>
          </>
        ) : emailSent ? (
          <>
            <Text style={styles.message}>
              ¡Aprobado! Te enviamos un correo electrónico a <Text style={styles.bold}>{email}</Text> con tu código de activación.
            </Text>
            
            <View style={{width: '100%', marginTop: 20}}>
              <Text style={styles.label}>Código de Validación:</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej: A4B8X9" 
                value={token}
                onChangeText={setToken}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.button} onPress={handleVerify}>
                <Text style={styles.buttonText}>Verificar Código</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.message}>
            No se detectó un correo electrónico válido para enviar el token.
          </Text>
        )}

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
  label: {
    color: Colors.light.text,
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: Colors.light.card,
    marginBottom: 16,
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
    marginTop: 20,
  },
  linkText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
