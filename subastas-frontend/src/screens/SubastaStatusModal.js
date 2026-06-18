import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function SubastaStatusModal({ navigation, route }) {
  const { status = 'success', message = 'Anotado con exito' } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.modalCard}>
        {status === 'success' ? (
          <Ionicons name="checkmark-circle" size={60} color="#10B981" style={{ marginBottom: 20 }} />
        ) : (
          <Ionicons name="close-circle" size={60} color="#EF4444" style={{ marginBottom: 20 }} />
        )}
        
        <Text style={styles.messageText}>
          {status === 'success' 
            ? 'Anotado con exito' 
            : 'Usted no puede anotarse en esta subasta debido a su categoria / superposicion con otra subasta'}
        </Text>
        
        <Text style={styles.subtext}>
          Si quiere cancelar su participacion vaya a la seccion de mis subastas en su perfil
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver al catalogo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
