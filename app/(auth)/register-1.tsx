import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { ImagePlus } from 'lucide-react-native';

export default function RegisterStage1Screen() {
  const router = useRouter();
  
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const pickImage = async (side: 'front' | 'back') => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (side === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepText}>Etapa 1 de 3</Text>
        <Text style={styles.title}>Datos Personales</Text>
        <Text style={styles.subtitle}>Comencemos con tus datos básicos para verificar tu identidad como postor.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} placeholder="Ej: Juan" />

          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} placeholder="Ej: Perez" />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput style={styles.input} placeholder="Ej: juanperez@gmail.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Domicilio legal</Text>
          <TextInput style={styles.input} placeholder="Ej: Av. Corrientes 1234" />

          <Text style={styles.label}>País de Residencia</Text>
          <TextInput style={styles.input} placeholder="Seleccionar..." />

          <Text style={styles.label}>Documentación de Identidad (DNI/Pasaporte)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoUpload} onPress={() => pickImage('front')}>
              {frontImage ? (
                <Image source={{ uri: frontImage }} style={styles.imagePreview} />
              ) : (
                <>
                  <ImagePlus color={Colors.light.text} size={24} />
                  <Text style={styles.photoUploadText}>Subir Foto</Text>
                </>
              )}
              <Text style={styles.photoUploadLabel}>Frente</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoUpload} onPress={() => pickImage('back')}>
              {backImage ? (
                <Image source={{ uri: backImage }} style={styles.imagePreview} />
              ) : (
                <>
                  <ImagePlus color={Colors.light.text} size={24} />
                  <Text style={styles.photoUploadText}>Subir Foto</Text>
                </>
              )}
              <Text style={styles.photoUploadLabel}>Dorso</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Asegúrate de que las fotos sean nítidas y que todos los datos sean legibles. Tus datos serán verificados por nuestro equipo antes de activar la cuenta.</Text>

          <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/register-2')}>
            <Text style={styles.buttonText}>Continuar a Etapa 2</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
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
  photoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  photoUpload: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.light.tint,
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoUploadText: {
    marginTop: 8,
    color: Colors.light.text,
    fontWeight: '500',
  },
  photoUploadLabel: {
    position: 'absolute',
    top: -25,
    color: Colors.light.text,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
