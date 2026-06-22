import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

export default function PropuestaArticuloScreen({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [historia, setHistoria] = useState('');
  const [artista, setArtista] = useState('');
  const [declaraPropiedad, setDeclaraPropiedad] = useState(false);
  const [aceptaDevolucion, setAceptaDevolucion] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombre || !descripcion || !categoria) {
      Alert.alert('Error', 'Completá todos los campos obligatorios.');
      return;
    }

    if (fotos.length < 6) {
      Alert.alert('Error', 'Debe subir un mínimo de 6 fotos del artículo para la revisión.');
      return;
    }

    if (!declaraPropiedad) {
      Alert.alert('Error', 'Debe declarar que el bien le pertenece y no posee impedimento legal.');
      return;
    }

    if (!aceptaDevolucion) {
      Alert.alert('Error', 'Debe aceptar las condiciones de devolución con cargo.');
      return;
    }

    setLoading(true);
    try {
      const url = API_BASE_URL.replace('/auth', '/items') + '/propose';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: usuario?.email,
          nombre,
          descripcion,
          categoria,
          historia,
          artista,
          declaraPropiedad,
          aceptaDevolucion,
          fotosUrls: fotos
        })
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Producto Aceptado preliminarmente', 
          'Por favor, envíe su artículo a Rivadavia 3421, CABA para ser tasado físicamente.', 
          [
            { 
              text: 'Entendido', 
              onPress: async () => {
                try {
                  const simUrl = API_BASE_URL.replace('/auth', '/items') + `/${data.productoId}/simulate-receive?email=${encodeURIComponent(usuario?.email)}`;
                  await fetch(simUrl, { method: 'POST' });
                } catch(e) { console.log(e); }
                navigation.goBack();
              } 
            }
          ]
        );
      } else {
        const errorText = await response.text();
        Alert.alert('Error', errorText || 'No se pudo enviar la propuesta.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (fotos.length >= 10) {
      Alert.alert('Límite', 'Podés subir hasta 10 fotos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setFotos([...fotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removeFoto = (index) => {
    const newFotos = [...fotos];
    newFotos.splice(index, 1);
    setFotos(newFotos);
  };

  const CheckBox = ({ checked, onPress, label }) => (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

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
          <Text style={styles.label}>Artista / Diseñador</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Nombre del artista o diseñador (si aplica)"
            value={artista}
            onChangeText={setArtista}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción Detallada *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Materiales, estado de conservación, dimensiones..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Historia / Contexto del Objeto</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Origen, dueños anteriores, fecha estimada de creación, contexto histórico..."
            value={historia}
            onChangeText={setHistoria}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fotografías (Mínimo 6, máximo 10) *</Text>
          <Text style={styles.helperText}>Se requieren al menos 6 fotos de alta calidad para la tasación: frente, dorso, laterales, detalles y firma/sello si aplica. {"\n"}*(Nota: la 1ra foto que subas se usará de portada principal para el catálogo de la subasta).*</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons name="camera-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.uploadBtnText}>Seleccionar Foto ({fotos.length}/10)</Text>
          </TouchableOpacity>
          <View style={styles.fotosContainer}>
            {fotos.map((uri, index) => (
              <View key={index} style={styles.fotoWrapper}>
                <Image source={{ uri }} style={styles.fotoThumbnail} />
                <TouchableOpacity style={styles.removeFotoBtn} onPress={() => removeFoto(index)}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Declaraciones legales */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Declaraciones Obligatorias *</Text>
          
          <CheckBox
            checked={declaraPropiedad}
            onPress={() => setDeclaraPropiedad(!declaraPropiedad)}
            label="Declaro que el bien me pertenece, es de origen lícito y no posee impedimento legal alguno para su venta."
          />

          <CheckBox
            checked={aceptaDevolucion}
            onPress={() => setAceptaDevolucion(!aceptaDevolucion)}
            label="Acepto que, en caso de rechazo de la tasación, la empresa devolverá el bien con un cargo por gastos operativos de envío."
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (!declaraPropiedad || !aceptaDevolucion) && styles.submitButtonDisabled]} 
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
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 10,
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
    minHeight: 100,
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
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.PRIMARY,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
  },
  uploadBtnText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  fotosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fotoWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  fotoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeFotoBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
