import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function TerminosCondicionesScreen({ navigation, route }) {
  // Se puede pasar un parametro 'tipo' para mostrar diferentes textos (venta, compra, general)
  const { tipo = 'general' } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>terminos y condiciones del negocio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tipo === 'venta' && (
          <>
            <Text style={styles.paragraph}>
              Si lo acepta, el bien se incluye en una futura subasta informándole al usuario la fecha, hora, lugar, el valor base de cada objeto aceptado y las comisiones.
            </Text>
            <Text style={styles.paragraph}>
              El usuario puede no aceptar el valor base o las comisiones a cobrar por el bien, en ese caso se procederá a la devolución y se le informará de los gastos.
            </Text>
            <Text style={styles.paragraph}>
              Si la empresa no acepta el bien enviado, este es devuelto a su dueño con cargo pudiendo visualizar a través de la app ver las causas del rechazo.
            </Text>
          </>
        )}
        
        {tipo === 'general' && (
          <>
            <Text style={styles.paragraph}>
              Al utilizar SubastasYa, usted acepta regirse por estos términos y condiciones.
            </Text>
            <Text style={styles.paragraph}>
              Todas las pujas realizadas son definitivas y constituyen un compromiso legal de compra en caso de resultar ganador de la subasta.
            </Text>
            <Text style={styles.paragraph}>
              En caso de no cumplir con el pago en las 72 horas posteriores a la recepción de la notificación de multa, se iniciarán los procesos legales correspondientes.
            </Text>
          </>
        )}
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_TITLE,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  }
});
