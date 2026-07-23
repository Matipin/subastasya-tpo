import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Plus, Eye, EyeOff, CreditCard, Banknote, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import MercadoPagoBrick from '@/components/MercadoPagoBrick';

export default function RegisterStage3Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string, firstName: string, lastName: string, address: string, country: string }>();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [mpToken, setMpToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!selectedPayment) {
      Alert.alert('Error', 'Debes seleccionar un método de pago');
      return;
    }
    if (selectedPayment === 'CARD' && !mpToken) {
      Alert.alert('Error', 'Por favor completa y guarda los datos de la tarjeta con MercadoPago');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear el usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email || '',
        password: password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('rate limit')) {
          Alert.alert('Límite excedido', 'Has intentado registrar demasiadas cuentas con este correo hoy. Por favor, intenta con un correo nuevo para continuar las pruebas.');
        } else {
          Alert.alert('Error al registrar', authError.message);
        }
        setLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) throw new Error('Usuario no fue creado exitosamente');

      // 2. Insertar en profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        category: 'bronze',
        is_approved: true, // Auto-aprobar para la demo
        guarantee_balance: 100000
      });

      if (profileError) throw profileError;

      // 3. Insertar método de pago si es tarjeta
      if (selectedPayment === 'CARD') {
        const { error: pmError } = await supabase.from('payment_methods').insert({
          user_id: user.id,
          provider: 'MercadoPago - Tarjeta',
          type: 'CARD',
          card_number: `Tokenizado por MP`,
        });
        if (pmError) {
          console.warn('Error guardando tarjeta', pmError);
        }
      }

      Alert.alert(
        'Registro Completo',
        'Tu clave y medio de pago han sido registrados exitosamente. Ahora ya puedes ingresar a la aplicación.',
        [
          { text: 'Ingresar', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (err: any) {
      Alert.alert('Error inesperado', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepText}>Etapa 3 de 3</Text>
        <Text style={styles.title}>Clave y medios de pago</Text>
        
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Crea tu clave</Text>
          
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.passwordInput} placeholder="Ej: Juan_Perez1234" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff color={Colors.light.textSecondary} size={20} /> : <Eye color={Colors.light.textSecondary} size={20} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.passwordInput} placeholder="Ej: Juan_Perez1234" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff color={Colors.light.textSecondary} size={20} /> : <Eye color={Colors.light.textSecondary} size={20} />}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Medios de pago</Text>
          <Text style={styles.subtitle}>Selecciona y registra un metodo de pago (Obligatorio)</Text>

          {/* Opciones de Pago */}
          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'CARD' && styles.paymentOptionSelected]} 
            onPress={() => setSelectedPayment('CARD')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CreditCard color={selectedPayment === 'CARD' ? Colors.light.tint : Colors.light.textSecondary} size={24} style={{ marginRight: 12 }} />
              <Text style={styles.paymentText}>Tarjeta de crédito / débito</Text>
            </View>
            {selectedPayment === 'CARD' ? <CheckCircle2 color={Colors.light.tint} size={20} /> : <Plus color={Colors.light.textSecondary} size={20} />}
          </TouchableOpacity>

          {selectedPayment === 'CARD' && (
            <View style={{ marginTop: 10, width: '100%', alignItems: 'center' }}>
               <MercadoPagoBrick 
                 usuarioEmail={params.email} 
                 onSubmit={(data) => {
                   setMpToken(data.token); // MP devuelve el token en el form data
                   Alert.alert('Éxito', 'Tarjeta validada por MercadoPago correctamente');
                 }}
               />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'BANK' && styles.paymentOptionSelected]} 
            onPress={() => setSelectedPayment('BANK')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Banknote color={selectedPayment === 'BANK' ? Colors.light.tint : Colors.light.textSecondary} size={24} style={{ marginRight: 12 }} />
              <Text style={styles.paymentText}>Cuenta bancaria (Transferencia)</Text>
            </View>
            {selectedPayment === 'BANK' ? <CheckCircle2 color={Colors.light.tint} size={20} /> : <Plus color={Colors.light.textSecondary} size={20} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { marginTop: 40, opacity: loading ? 0.7 : 1 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Finalizar Registro (Ingresar)</Text>}
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.light.card,
    marginTop: 8,
  },
  paymentOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  paymentText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  mpContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#009EE3', // MercadoPago blue
    marginBottom: 12,
  },
  mpInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  mpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mpHelpText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
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
