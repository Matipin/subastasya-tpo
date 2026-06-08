import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../theme/colors';
import { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL.replace('/auth', '/users');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileDashboardScreen({ route, navigation }) {
  const usuario = route?.params?.usuario;
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    if (usuario?.email) {
      fetchMetrics();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/me/metrics?email=${usuario.email}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccordion = (subastaId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds(prev => ({
      ...prev,
      [subastaId]: !prev[subastaId]
    }));
  };

  const renderProgressBars = () => {
    if (!metrics?.participacionPorCategoria) return null;
    const cats = ['COMUN', 'ESPECIAL', 'PLATA', 'ORO', 'PLATINO'];
    let total = 0;
    cats.forEach(c => total += (metrics.participacionPorCategoria[c] || 0));

    return cats.map(c => {
      const val = metrics.participacionPorCategoria[c] || 0;
      const perc = total > 0 ? (val / total) * 100 : 0;
      return (
        <View key={c} style={styles.barContainer}>
          <Text style={styles.barLabel}>{c}</Text>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${perc}%` }]} />
          </View>
          <Text style={styles.barValue}>{val}</Text>
        </View>
      );
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró el usuario. Inicia sesión.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{position: 'absolute', left: 0, top: 0}}>
          <Text style={{color: COLORS.PRIMARY, fontWeight: 'bold', fontSize: 16}}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{usuario?.nombre?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>CATEGORÍA: {metrics?.categoria || 'COMÚN'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tus Estadísticas</Text>
      
      <View style={styles.statsGrid}>
        {/* Win Rate Destacado */}
        <View style={[styles.statCard, { width: '100%', backgroundColor: COLORS.PRIMARY, marginBottom: 10 }]}>
          <Text style={[styles.statValue, { color: '#FFF', fontSize: 32 }]}>
            {metrics?.winRate?.toFixed(1) || '0.0'}%
          </Text>
          <Text style={[styles.statLabel, { color: '#EEE', fontSize: 14 }]}>Tasa de Victoria (Win Rate)</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics?.totalPujas || 0}</Text>
          <Text style={styles.statLabel}>Pujas Hechas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics?.victorias || 0}</Text>
          <Text style={styles.statLabel}>Subastas Ganadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics?.asistencias || 0}</Text>
          <Text style={styles.statLabel}>Asistencias a Subastas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics?.promedioPujas?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Promedio Pujas / Subasta</Text>
        </View>
      </View>

      {/* Relacion Ofertado vs Adjudicado */}
      <Text style={styles.sectionTitle}>Relación Económica</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.comparisonDesc}>Compara cuánto estuviste dispuesto a gastar vs. cuánto efectivamente se te adjudicó por ganar.</Text>
        
        <View style={styles.comparisonBarWrapper}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
            <Text style={styles.barLabelDark}>Total Ofertado</Text>
            <Text style={styles.barValueDark}>${metrics?.montoOfertadoTotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.barBackgroundLarge}>
            <View style={[styles.barFillLarge, { width: '100%', backgroundColor: '#9CA3AF' }]} />
          </View>
        </View>

        <View style={styles.comparisonBarWrapper}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
            <Text style={styles.barLabelDark}>Total Adjudicado</Text>
            <Text style={styles.barValueDark}>${metrics?.importeTotal?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.barBackgroundLarge}>
            <View style={[styles.barFillLarge, { 
              width: metrics?.montoOfertadoTotal > 0 ? `${(metrics.importeTotal / metrics.montoOfertadoTotal) * 100}%` : '0%',
              backgroundColor: '#10B981' 
            }]} />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Participación por Categoría</Text>
      <View style={styles.progressContainer}>
        {renderProgressBars()}
      </View>

      <Text style={styles.sectionTitle}>Historial Reciente (Por Subasta)</Text>
      {metrics?.historial && metrics.historial.length > 0 ? (
        metrics.historial.map((subastaNode) => {
          const isExpanded = expandedIds[subastaNode.subastaId];
          return (
            <View key={subastaNode.subastaId} style={styles.accordionContainer}>
              <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleAccordion(subastaNode.subastaId)}>
                <View>
                  <Text style={styles.accordionTitle}>{subastaNode.subastaNombre}</Text>
                  <Text style={styles.accordionSubTitle}>Categoría: {subastaNode.categoria} • {subastaNode.pujas?.length || 0} pujas</Text>
                </View>
                <Text style={styles.accordionIcon}>{isExpanded ? '🔼' : '🔽'}</Text>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.accordionContent}>
                  {subastaNode.pujas.map(puja => (
                    <View key={puja.id} style={styles.historyItem}>
                      <View>
                        <Text style={styles.historyItemTitle}>Lote: {puja.articuloTitulo}</Text>
                        <Text style={styles.historyItemDate}>{new Date(puja.fecha).toLocaleString()}</Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={styles.historyItemAmount}>${puja.monto}</Text>
                        <Text style={[styles.historyItemStatus, puja.ganadora && styles.historyItemStatusWin]}>
                          {puja.ganadora ? 'GANADA' : 'OFERTA'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Todavía no participaste de ninguna subasta.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { padding: 20, paddingBottom: 50 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginTop: 50, color: COLORS.ERROR },
  
  header: { alignItems: 'center', marginVertical: 30 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  avatarText: { fontSize: 30, color: '#FFF', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  email: { fontSize: 14, color: '#666', marginTop: 5 },
  categoryBadge: {
    backgroundColor: '#FFF8E1', paddingHorizontal: 15, paddingVertical: 5,
    borderRadius: 20, marginTop: 15, borderWidth: 1, borderColor: '#F59E0B'
  },
  categoryText: { fontSize: 12, fontWeight: 'bold', color: '#B45309' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT_TITLE, marginBottom: 15, marginTop: 10 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, gap: 10 },
  statCard: {
    width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#EEE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.PRIMARY, marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#777', textAlign: 'center' },

  progressContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 30 },
  barContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  barLabel: { width: 70, fontSize: 12, fontWeight: '600', color: COLORS.TEXT_TITLE },
  barBackground: { flex: 1, height: 8, backgroundColor: '#EEE', borderRadius: 4, marginHorizontal: 10 },
  barFill: { height: '100%', backgroundColor: COLORS.PRIMARY, borderRadius: 4 },
  barValue: { width: 20, fontSize: 12, textAlign: 'right', color: '#666' },

  comparisonDesc: { fontSize: 12, color: '#666', marginBottom: 15, lineHeight: 18 },
  comparisonBarWrapper: { marginBottom: 15 },
  barLabelDark: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  barValueDark: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  barBackgroundLarge: { height: 16, backgroundColor: '#EEE', borderRadius: 8, overflow: 'hidden' },
  barFillLarge: { height: '100%', borderRadius: 8 },

  accordionContainer: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FAFAFA' },
  accordionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  accordionSubTitle: { fontSize: 12, color: '#666', marginTop: 4 },
  accordionIcon: { fontSize: 16 },
  accordionContent: { padding: 15, borderTopWidth: 1, borderTopColor: '#EEE' },

  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
  historyItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_TITLE },
  historyItemDate: { fontSize: 12, color: '#888', marginTop: 4 },
  historyItemAmount: { fontSize: 15, fontWeight: 'bold', color: COLORS.TEXT_TITLE },
  historyItemStatus: { fontSize: 11, fontWeight: 'bold', color: '#666', marginTop: 4 },
  historyItemStatusWin: { color: '#059669' },
  
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  emptyText: { color: '#888', fontSize: 14 }
});
