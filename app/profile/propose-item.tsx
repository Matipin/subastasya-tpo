import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { ChevronLeft, Camera, UploadCloud } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProposeItemScreen() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    history: '',
  });
  const [photos, setPhotos] = useState<string[]>(Array(10).fill(''));
  const [ownership, setOwnership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pickImage = async (index: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const handleSubmit = async () => {
    const validPhotosCount = photos.filter(p => p !== '').length;
    if (!form.title || !form.description || !ownership || validPhotosCount < 6 || validPhotosCount > 10) {
      setErrorMsg('Debe completar los datos básicos, subir entre 6 y 10 fotos y declarar la propiedad.');
      return;
    }
    setErrorMsg(null);

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      // In a real app we'd upload photos to Supabase Storage here.
      // For this mock, we just use placeholder URLs if it's local, or keep them.
      const mockImages = [
        'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=500'
      ];

      const { data: proposal, error } = await supabase.from('item_proposals').insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        history: form.history,
        images: mockImages,
        status: 'pending_shipping' // Updated status
      }).select().single();

      if (error) throw error;

      // AUTOMATIZACIÓN MOCK: Notificación "Mándalo a tal lado"
      if (proposal) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Propuesta Aceptada (Pendiente de envío)',
          message: `Envía tu artículo "${proposal.title}" a Av. Falsa 123, Buenos Aires para su tasación física.`,
          type: 'SHIPPING_REQUEST',
          metadata: { proposal_id: proposal.id }
        });
      }

      if (Platform.OS === 'web') {
        alert('Éxito: La solicitud ha sido enviada para inspección.');
        router.replace('/profile/my-items');
      } else {
        Alert.alert('Éxito', 'La solicitud ha sido enviada para inspección. Revise la pestaña "Mis Productos" en unos minutos para ver la tasación.', [
          { text: 'Ir a Mis Productos', onPress: () => router.replace('/profile/my-items') }
        ]);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error inesperado al enviar la propuesta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.light.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proponer Artículo</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Envíe los datos de su bien para que sea evaluado por nuestros expertos. De ser aceptado, se incluirá en una subasta.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título del artículo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Jarrón Dinastía Ming"
            value={form.title}
            onChangeText={text => setForm({...form, title: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción técnica</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Medidas, materiales, estado de conservación..."
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={text => setForm({...form, description: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Historia (Opcional pero recomendado)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contexto histórico, procedencia..."
            multiline
            numberOfLines={4}
            value={form.history}
            onChangeText={text => setForm({...form, history: text})}
          />
        </View>

        <View style={styles.photoSection}>
          <Text style={styles.label}>Fotografías (Sube entre 6 y 10 fotos obligatoriamente)</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <TouchableOpacity key={i} style={styles.photoPlaceholder} onPress={() => pickImage(i)}>
                {uri ? (
                  <Image source={{ uri }} style={styles.imagePreview} />
                ) : (
                  <Camera color={Colors.light.icon} size={24} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.switchLabel}>
            Declaro bajo juramento que soy el legítimo propietario de este bien y su origen es lícito.
          </Text>
          <Switch
            value={ownership}
            onValueChange={setOwnership}
            trackColor={{ false: '#767577', true: Colors.light.tint }}
            thumbColor={'#FFF'}
          />
        </View>

        {errorMsg && (
          <Text style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
            {errorMsg}
          </Text>
        )}

        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <UploadCloud color="#FFF" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: Colors.light.card, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  content: { padding: 20 },
  infoText: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 20, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 8, paddingHorizontal: 16, height: 48, fontSize: 16,
  },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  photoSection: { marginBottom: 20 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  photoPlaceholder: {
    width: '30%', aspectRatio: 1, backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.light.border, borderStyle: 'dashed', overflow: 'hidden'
  },
  imagePreview: {
    width: '100%', height: '100%', resizeMode: 'cover'
  },
  switchGroup: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.light.card, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 24,
  },
  switchLabel: { flex: 1, marginRight: 16, fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  submitButton: {
    flexDirection: 'row', backgroundColor: Colors.light.tint, height: 56, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 40,
  },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
