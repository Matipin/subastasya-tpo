import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert, Image, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const PAISES_OPTIONS = ['Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Perú', 'Uruguay', 'Venezuela'];

const Campo = ({ label, field, keyboard, secure, placeholder, form, setField, errors, setErrors }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, errors[field] && styles.inputError]}
      placeholder={placeholder || label}
      placeholderTextColor="#AAAAAA"
      value={form[field]}
      onChangeText={v => {
        setField(field, v);
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
      }}
      keyboardType={keyboard || 'default'}
      autoCapitalize="none"
      secureTextEntry={!!secure}
    />
    {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
  </View>
);

export default function RegistroEtapa1Screen({ navigation }) {
  const [form, setForm] = useState({
    email: '', nombre: '', apellido: '', telefono: '',
    domicilio: '', pais: '',
    urlFotoDniFront: '', urlFotoDniBack: '',
  });
  const [errors, setErrors] = useState({});
  const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [fotoFrenteOk, setFotoFrenteOk] = useState(false);
  const [fotoDorsoOk, setFotoDorsoOk] = useState(false);
  const [modalPaisVisible, setModalPaisVisible] = useState(false);

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Ingresá un email válido.';
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio.';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio.';
    if (!fotoFrenteOk) e.urlFotoDniFront = 'Debés adjuntar la foto del frente del DNI.';
    if (!fotoDorsoOk) e.urlFotoDniBack = 'Debés adjuntar la foto del dorso del DNI.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Función genérica para abrir cámara o galería
  const seleccionarFoto = async (campoUrl, setterOk) => {
    Alert.alert(
      "Subir Documento",
      "¿De dónde querés obtener la foto?",
      [
        {
          text: "Cámara",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso denegado', 'Necesitamos permisos de cámara para continuar.');
              return;
            }
            let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.2,
              base64: true,
            });
            if (!result.canceled) {
              const base64Str = `data:image/jpeg;base64,${result.assets[0].base64}`;
              setField(campoUrl, base64Str);
              setterOk(true);
              setErrors(prev => ({ ...prev, [campoUrl]: undefined }));
            }
          }
        },
        {
          text: "Galería",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso denegado', 'Necesitamos permisos de galería para continuar.');
              return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.2,
              base64: true,
            });
            if (!result.canceled) {
              const base64Str = `data:image/jpeg;base64,${result.assets[0].base64}`;
              setField(campoUrl, base64Str);
              setterOk(true);
              setErrors(prev => ({ ...prev, [campoUrl]: undefined }));
            }
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const abrirSelectorFrente = () => seleccionarFoto('urlFotoDniFront', setFotoFrenteOk);
  const abrirSelectorDorso = () => seleccionarFoto('urlFotoDniBack', setFotoDorsoOk);

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setMensajeGeneral({ tipo: '', texto: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const text = await response.text();

      if (response.status === 201 || response.ok) {
        setMensajeGeneral({
          tipo: 'exito',
          texto: '¡Registro recibido! Tu cuenta está en estado PENDIENTE DE VALIDACIÓN. Te avisaremos por correo cuando seas validado.',
        });
        setTimeout(() => navigation.navigate('Login'), 5000);
      } else if (response.status === 409) {
        setMensajeGeneral({
          tipo: 'error',
          texto: 'Ya existe una cuenta con ese email. Probá iniciar sesión.',
        });
      } else {
        setMensajeGeneral({
          tipo: 'error',
          texto: text || 'No se pudo completar el registro. Intentá de nuevo.',
        });
      }
    } catch (error) {
      console.error(error);
      setMensajeGeneral({
        tipo: 'error',
        texto: 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // El componente Campo se movió afuera para evitar pérdida de foco

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header aligned left */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{marginBottom: 10}}>
          <Text style={{color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 16}}>← Volver al Login</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Etapa 1 de 3</Text>
      </View>

      <View style={styles.dividerLineFull} />

      {/* Datos personales */}
      <Text style={styles.sectionTitle}>Datos Personales</Text>
      <Text style={styles.infoText}>Comencemos con tus datos basicos para verificar tu identidad como postor</Text>
      <Campo label="Email *" field="email" keyboard="email-address" placeholder="Ej: juan@mail.com" form={form} setField={setField} errors={errors} setErrors={setErrors} />
      <Campo label="Nombre" field="nombre" placeholder="Ej: Juan" form={form} setField={setField} errors={errors} setErrors={setErrors} />
      <Campo label="Apellido" field="apellido" placeholder="Ej: Juan" form={form} setField={setField} errors={errors} setErrors={setErrors} />
      <Campo label="Domicilio legal" field="domicilio" placeholder="Ej: Av. Corrientes 1234" form={form} setField={setField} errors={errors} setErrors={setErrors} />
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>País de Residencia *</Text>
        <TouchableOpacity 
          style={[styles.input, { justifyContent: 'center' }, errors.pais && styles.inputError]}
          onPress={() => setModalPaisVisible(true)}
        >
          <Text style={{ color: form.pais ? COLORS.TEXT_MAIN : '#AAAAAA' }}>
            {form.pais || 'Seleccionar país...'}
          </Text>
        </TouchableOpacity>
        {errors.pais ? <Text style={styles.errorText}>{errors.pais}</Text> : null}
      </View>

      <Campo label="Teléfono *" field="telefono" keyboard="phone-pad" placeholder="Ej: 1122334455" form={form} setField={setField} errors={errors} setErrors={setErrors} />

      {/* Modal para selección de País */}
      <Modal
        visible={modalPaisVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalPaisVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalPaisVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccioná un País</Text>
            <ScrollView>
              {PAISES_OPTIONS.map((paisOption, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.modalItem}
                  onPress={() => {
                    setField('pais', paisOption);
                    setModalPaisVisible(false);
                    if (errors.pais) setErrors(prev => ({ ...prev, pais: undefined }));
                  }}
                >
                  <Text style={styles.modalItemText}>{paisOption}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fotos DNI */}
      <Text style={styles.dniTitle}>Documentacion de Identidad (DNI/Pasaporte)</Text>

      <View style={styles.photosRow}>
        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Frente</Text>
          <TouchableOpacity
            style={[styles.photoBox, fotoFrenteOk && styles.photoBoxOk]}
            onPress={abrirSelectorFrente}
          >
            {fotoFrenteOk && form.urlFotoDniFront ? (
              <Image source={{ uri: form.urlFotoDniFront }} style={styles.photoImage} />
            ) : (
              <>
                <Text style={styles.photoBoxIcon}>🖼️</Text>
                <Text style={styles.photoBoxText}>Subir Foto</Text>
              </>
            )}
          </TouchableOpacity>
          {errors.urlFotoDniFront ? <Text style={styles.errorText}>{errors.urlFotoDniFront}</Text> : null}
        </View>

        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Dorso</Text>
          <TouchableOpacity
            style={[styles.photoBox, fotoDorsoOk && styles.photoBoxOk]}
            onPress={abrirSelectorDorso}
          >
            {fotoDorsoOk && form.urlFotoDniBack ? (
              <Image source={{ uri: form.urlFotoDniBack }} style={styles.photoImage} />
            ) : (
              <>
                <Text style={styles.photoBoxIcon}>🖼️</Text>
                <Text style={styles.photoBoxText}>Subir Foto</Text>
              </>
            )}
          </TouchableOpacity>
          {errors.urlFotoDniBack ? <Text style={styles.errorText}>{errors.urlFotoDniBack}</Text> : null}
        </View>
      </View>

      <Text style={styles.dniDisclaimer}>
        Asegurate de que las fotos sean nitidas y que todos los datos sean legibles.{'\n'}
        Tus datos serán verificados por nuestro equipo antes de activar la cuenta.
      </Text>

      {/* Mensaje general (éxito o error) */}
      {mensajeGeneral.texto ? (
        <View style={mensajeGeneral.tipo === 'exito' ? styles.bannerExito : styles.bannerError}>
          <Text style={mensajeGeneral.tipo === 'exito' ? styles.bannerExitoText : styles.bannerErrorText}>
            {mensajeGeneral.tipo === 'exito' ? '✅  ' : '⚠️  '}{mensajeGeneral.texto}
          </Text>
          {mensajeGeneral.tipo === 'exito' && (
            <Text style={styles.bannerSubText}>Redirigiendo a Iniciar Sesión en 5 segundos...</Text>
          )}
        </View>
      ) : null}

      {/* Botón enviar */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.submitText}>Continuar a Etapa 2</Text>
        }
      </TouchableOpacity>

      {/* Links */}
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>¿Ya tenés cuenta? Iniciar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('RegistroEtapa2')}>
        <Text style={styles.linkText}>¿Ya fuiste aprobado? Activar cuenta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 30, paddingBottom: 50 },
  header: { marginBottom: 20, marginTop: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  dividerLineFull: { height: 1, backgroundColor: '#DDD', marginHorizontal: -30, marginBottom: 20 },
  sectionTitle: {
    fontSize: 22, fontWeight: 'bold', color: COLORS.TEXT_TITLE,
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: '#444', marginBottom: 24, lineHeight: 20 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.TEXT_TITLE, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1,
    borderColor: '#777', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.TEXT_MAIN,
  },
  inputError: { borderColor: COLORS.ERROR, borderWidth: 1.5 },
  errorText: { color: COLORS.ERROR, fontSize: 12, marginTop: 4 },
  dniTitle: { fontSize: 16, fontWeight: '500', color: COLORS.TEXT_TITLE, marginTop: 20, marginBottom: 15 },
  photosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  photoContainer: { flex: 1, marginHorizontal: 5, alignItems: 'center' },
  photoLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.TEXT_TITLE, marginBottom: 10 },
  photoBox: {
    borderWidth: 2, borderColor: COLORS.PRIMARY, borderStyle: 'dashed',
    borderRadius: 15, height: 140, width: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAFAFA', overflow: 'hidden'
  },
  photoBoxOk: { borderStyle: 'solid', backgroundColor: '#F1F8F1', borderColor: '#2E7D32' },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoBoxIcon: { fontSize: 30, marginBottom: 8 },
  photoBoxText: { fontSize: 15, color: COLORS.TEXT_TITLE, fontWeight: 'bold' },
  dniDisclaimer: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginHorizontal: 10 },
  submitButton: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 18,
    borderRadius: 30, alignItems: 'center', marginTop: 30,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  bannerExito: {
    backgroundColor: '#E8F5E9', borderRadius: 10,
    padding: 14, marginTop: 20, borderLeftWidth: 4, borderLeftColor: '#2E7D32',
  },
  bannerExitoText: { color: '#1B5E20', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  bannerSubText: { color: '#2E7D32', fontSize: 12, marginTop: 6 },
  bannerError: {
    backgroundColor: '#FEE2E2', borderRadius: 10,
    padding: 14, marginTop: 20, borderLeftWidth: 4, borderLeftColor: '#B91C1C',
  },
  bannerErrorText: { color: '#7F1D1D', fontSize: 14, lineHeight: 20 },
  linkBtn: { marginTop: 18, alignItems: 'center' },
  linkText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: COLORS.TEXT_TITLE, textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 16, color: COLORS.TEXT_MAIN, textAlign: 'center' },
});
