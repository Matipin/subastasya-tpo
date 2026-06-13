import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function PropuestaArticuloScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombre || !descripcion || !categoria) {
      Alert.alert('Error', 'Completá todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      // Usamos el nuevo endpoint permitido
      const url = API_BASE_URL.replace('/auth', '/items') + '/propose';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          categoria,
          fotoUrl
        })
      });

      if (response.ok) {
        Alert.alert('¡Propuesta Enviada!', 'El artículo pasará a revisión técnica.', [
          { text: 'Aceptar', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'No se pudo enviar la propuesta.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proponer Artículo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instructionText}>
          Enviá tu artículo para ser valuado y subastado en nuestra plataforma. 
          Asegurate de proveer fotos de alta calidad y detalles precisos.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre de la Obra / Artículo *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. Jarrón Dinastía Ming"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. Antigüedades, Arte, Joyas..."
            value={categoria}
            onChangeText={setCategoria}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción Detallada *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Materiales, historia, estado de conservación..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>URL de Fotografía</Text>
          <TextInput 
            style={styles.input} 
            placeholder="https://ejemplo.com/foto.jpg"
            value={fotoUrl}
            onChangeText={setFotoUrl}
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>ENVIAR A REVISIÓN</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
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
  scrollContent: {
    padding: 24,
  },
  instructionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: COLORS.TEXT_MAIN,
  },
  textArea: {
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
