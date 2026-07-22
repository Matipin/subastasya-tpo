import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  
  const [firstName, setFirstName] = useState(user?.nombre?.split(', ')[1] || user?.nombre || '');
  const [lastName, setLastName] = useState(user?.nombre?.split(', ')[0] || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'El nombre y apellido son obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      // Intentar actualizar en Supabase (si el usuario tiene sesión activa allí)
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            first_name: firstName,
            last_name: lastName 
          })
          .eq('id', userData.user.id);
          
        if (error) {
            console.error(error);
        }
      }

      // Actualizar el estado local (mock store compatible)
      if (user) {
        const updatedUser = {
          ...user,
          nombre: `${lastName}, ${firstName}`
        };
        // Reuse login to just set the updated user object in Zustand
        login(updatedUser);
      }
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Tu nombre"
        />

        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Tu apellido"
        />

        <Text style={styles.infoText}>
          Nota: Para cambiar de categoría (Común, Oro, Platino) comuníquese con administración o utilice el script SQL de prueba.
        </Text>

        <TouchableOpacity 
          style={[styles.saveButton, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
