import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const getIconForType = (tipo) => {
  switch (tipo) {
    case 'subasta_ganada': return { name: 'trophy', color: '#F59E0B' };
    case 'subasta_en_vivo': return { name: 'pulse', color: '#EF4444' };
    case 'producto_tasado': return { name: 'pricetag', color: '#3B82F6' };
    case 'producto_vendido': return { name: 'cash', color: '#10B981' };
    case 'deuda': return { name: 'warning', color: '#EF4444' };
    default: return { name: 'notifications', color: '#9CA3AF' };
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificacionesScreen({ route, navigation }) {
  const { usuario } = route.params || {};
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = async () => {
    try {
      const url = `${API_BASE_URL.replace('/auth', '/users')}/me/notifications?email=${encodeURIComponent(usuario?.email || '')}`;
      const response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        
        // Obtener notificaciones descartadas
        const dismissedStr = await AsyncStorage.getItem(`dismissed_notifications_${usuario?.email}`);
        const dismissedIds = dismissedStr ? JSON.parse(dismissedStr) : [];
        
        // Filtrar las descartadas
        data = data.filter(n => !dismissedIds.includes(n.id));

        // Ordenar por fecha desc
        data.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        setNotificaciones(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const handleDismiss = async (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    try {
      const key = `dismissed_notifications_${usuario?.email}`;
      const dismissedStr = await AsyncStorage.getItem(key);
      const dismissedIds = dismissedStr ? JSON.parse(dismissedStr) : [];
      if (!dismissedIds.includes(id)) {
        dismissedIds.push(id);
        await AsyncStorage.setItem(key, JSON.stringify(dismissedIds));
      }
    } catch (e) {
      console.error('Error saving dismissed notification:', e);
    }
  };

  const handlePress = (item) => {
    const tipo = item.tipo || 'general';
    switch (tipo) {
      case 'subasta_ganada':
        navigation.navigate('SubastasGanadas', { usuario });
        break;
      case 'subasta_en_vivo':
        navigation.navigate('Home', { usuario });
        break;
      case 'producto_tasado':
      case 'producto_vendido':
        navigation.navigate('MisProductos', { usuario });
        break;
      case 'deuda':
        navigation.navigate('Deudas', { usuario });
        break;
      default:
        // No navegar para notificaciones generales
        break;
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIconForType(item.tipo);
    const isActionable = item.tipo && item.tipo !== 'general';

    return (
      <TouchableOpacity 
        style={[styles.card, !item.leida && styles.cardUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={isActionable ? 0.7 : 1}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.messageText, !item.leida && styles.messageUnread]}>
            {item.mensaje}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>
              {formatTimeAgo(item.fechaCreacion)}
            </Text>
            {isActionable && (
              <View style={styles.actionHint}>
                <Text style={styles.actionHintText}>Ver →</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDismiss(item.id)} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_TITLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 50 }} />
      ) : notificaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#9CA3AF" />
          <Text style={styles.emptyText}>No tienes notificaciones nuevas.</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
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
    paddingTop: 10,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  iconContainer: {
    marginRight: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
  },
  messageUnread: {
    fontWeight: 'bold',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionHint: {
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionHintText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 5,
    marginLeft: 8,
    justifyContent: 'flex-start',
  }
});
