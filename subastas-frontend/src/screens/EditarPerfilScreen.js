import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function EditarPerfilScreen({ route, navigation }) {
  const { usuario } = route.params;

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [domicilio, setDomicilio] = useState(usuario?.cliente?.direccion || '');
  const [telefono, setTelefono] = useState(''); // No hay en BD pero lo permitimos en form
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    if (!nombre.trim() || !domicilio.trim()) {
      Alert.alert('Error', 'Nombre y domicilio son obligatorios.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email: usuario.email,
        nombre: nombre,
        domicilio: domicilio,
        isUpdate: true, // Esto le dice al backend que actualice en vez de crear
      };

      const response = await fetch(API_BASE_URL + '/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente.');
        // Para reflejar los cambios habría que recargar el usuario,
        // por ahora volvemos atrás.
        navigation.goBack();
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'No se pudo actualizar el perfil.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un problema de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Correo Electrónico (No modificable)</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={usuario?.email}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresa tu nombre completo"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Domicilio</Text>
          <TextInput
            style={styles.input}
            value={domicilio}
            onChangeText={setDomicilio}
            placeholder="Ingresa tu domicilio"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ingresa tu teléfono"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
