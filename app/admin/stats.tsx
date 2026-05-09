import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pedidosApi } from '../../services/api';
import { PedidoStats } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdminStats() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState<PedidoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await pedidosApi.getStats();
      if (res.success) {
        setStats(res.data as PedidoStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={[styles.loadingText, isDark && styles.subTextDark]}>Calculando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#0891b2', '#0e7490']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Resumen de rendimiento real</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadStats}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.content}>
        {/* CARDS PRINCIPALES */}
        <View style={styles.mainCardsRow}>
          <View style={[styles.mainCard, isDark ? styles.cardDark : { backgroundColor: '#fff' }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0284c730' : '#e0f2fe' }]}>
              <Ionicons name="cash" size={24} color="#0284c7" />
            </View>
            <Text style={[styles.cardLabel, isDark && styles.subTextDark]}>Ventas Totales</Text>
            <Text style={[styles.cardValue, isDark && styles.textDark]}>{formatPrice(stats?.total_ventas || 0)}</Text>
          </View>

          <View style={[styles.mainCard, isDark ? styles.cardDark : { backgroundColor: '#fff' }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#16a34a30' : '#f0fdf4' }]}>
              <Ionicons name="cart" size={24} color="#16a34a" />
            </View>
            <Text style={[styles.cardLabel, isDark && styles.subTextDark]}>Pedidos</Text>
            <Text style={[styles.cardValue, isDark && styles.textDark]}>{stats?.total_pedidos || 0}</Text>
          </View>
        </View>

        <View style={[styles.singleCard, isDark && styles.cardDark]}>
           <View style={[styles.iconBox, { backgroundColor: isDark ? '#9333ea30' : '#faf5ff' }]}>
              <Ionicons name="analytics" size={24} color="#9333ea" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.cardLabel, isDark && styles.subTextDark]}>Ticket Promedio</Text>
              <Text style={[styles.cardValue, isDark && styles.textDark]}>{formatPrice(stats?.promedio_venta || 0)}</Text>
            </View>
        </View>

        {/* ESTADO DE PEDIDOS */}
        <View style={[styles.section, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Estado de los Pedidos</Text>
          
          <View style={styles.statusList}>
            <StatusRow 
              label="Pendientes" 
              count={stats?.pendientes || 0} 
              total={stats?.total_pedidos || 1} 
              color="#f59e0b" 
              isDark={isDark}
            />
            <StatusRow 
              label="En Preparación" 
              count={stats?.preparando || 0} 
              total={stats?.total_pedidos || 1} 
              color="#3b82f6" 
              isDark={isDark}
            />
            <StatusRow 
              label="En Camino" 
              count={stats?.en_camino || 0} 
              total={stats?.total_pedidos || 1} 
              color="#8b5cf6" 
              isDark={isDark}
            />
            <StatusRow 
              label="Entregados" 
              count={stats?.entregados || 0} 
              total={stats?.total_pedidos || 1} 
              color="#10b981" 
              isDark={isDark}
            />
          </View>
        </View>

        <View style={[styles.infoBox, isDark && styles.infoBoxDark]}>
          <Ionicons name="information-circle" size={20} color={isDark ? "#22d3ee" : "#0891b2"} />
          <Text style={[styles.infoText, isDark && { color: '#cffafe' }]}>
            Los datos se actualizan en tiempo real basándose en todos los pedidos registrados en la base de datos.
          </Text>
        </View>
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

function StatusRow({ label, count, total, color, isDark }: { label: string, count: number, total: number, color: string, isDark: boolean }) {
  const percentage = (count / total) * 100;
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusHeader}>
        <Text style={[styles.statusLabel, isDark && { color: '#94a3b8' }]}>{label}</Text>
        <Text style={[styles.statusCount, { color }]}>{count}</Text>
      </View>
      <View style={[styles.progressBarBg, isDark && { backgroundColor: '#1e293b' }]}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  header: {
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 15 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#cffafe' },
  refreshBtn: { padding: 10 },
  content: { padding: 20 },
  mainCardsRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  mainCard: {
    flex: 1, padding: 20, borderRadius: 25,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10
  },
  singleCard: {
    backgroundColor: '#fff', padding: 20, borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', marginBottom: 25,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10
  },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 5 },
  cardValue: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  statusList: { gap: 20 },
  statusRow: { width: '100%' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  statusCount: { fontSize: 14, fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  infoBox: { flexDirection: 'row', backgroundColor: '#e0f2fe', padding: 15, borderRadius: 15, gap: 10, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#0369a1', lineHeight: 18 },

  // Dark modes
  containerDark: { backgroundColor: '#020617' },
  textDark: { color: '#f8fafc' },
  subTextDark: { color: '#94a3b8' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 },
  infoBoxDark: { backgroundColor: '#083344', borderColor: '#155e75' },
});
