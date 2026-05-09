import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pedidosApi } from '../../services/api';
import { Pedido } from '../../types';
import { showAlert } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminPedidos() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);


  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const res = await pedidosApi.getAll();
      if (res.success) {
        setPedidos(res.data as Pedido[]);
      }
    } catch (error) {
      showAlert('Error', 'No se pudieron cargar los pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await pedidosApi.updateEstado(id.toString(), newStatus);
      showAlert('Actualizado', `Pedido #${id} marcado como ${newStatus}`, 'success');
      loadPedidos();
    } catch (error) {
      showAlert('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return '#6b7280';
      case 'preparando': return '#f59e0b';
      case 'en_camino': return '#3b82f6';
      case 'entregado': return '#10b981';
      default: return '#6b7280';
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Pedido }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <View style={[styles.card, isExpanded && styles.cardExpanded]}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Pedido #{item.id}</Text>
            <Text style={styles.orderDate}>{new Date(item.fecha!).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
              {item.estado.toUpperCase()}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9ca3af" 
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={14} color="#6b7280" />
                <Text style={styles.detailText}>{item.usuario_nombre || 'Desconocido'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={14} color="#6b7280" />
                <Text style={styles.detailText}>{item.direccion || 'Sin dirección'}</Text>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a pagar:</Text>
              <Text style={styles.totalValue}>${Number(item.total).toLocaleString()}</Text>
            </View>

            <Text style={styles.actionLabel}>Cambiar estado del pedido:</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.miniBtn, { borderColor: '#f59e0b', backgroundColor: item.estado === 'preparando' ? '#f59e0b10' : 'transparent' }]} 
                onPress={() => item.id && updateStatus(item.id, 'preparando')}
              >
                <Text style={[styles.miniBtnText, { color: '#f59e0b' }]}>Preparando</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.miniBtn, { borderColor: '#3b82f6', backgroundColor: item.estado === 'en_camino' ? '#3b82f610' : 'transparent' }]} 
                onPress={() => item.id && updateStatus(item.id, 'en_camino')}
              >
                <Text style={[styles.miniBtnText, { color: '#3b82f6' }]}>En camino</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.miniBtn, { borderColor: '#10b981', backgroundColor: item.estado === 'entregado' ? '#10b98110' : 'transparent' }]} 
                onPress={() => item.id && updateStatus(item.id, 'entregado')}
              >
                <Text style={[styles.miniBtnText, { color: '#10b981' }]}>Entregado</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={['#b91c1c', '#dc2626']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pedidos</Text>
          <Text style={styles.subtitle}>{pedidos.length} pedidos totales</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadPedidos}>
          <Ionicons name="refresh" size={24} color="#dc2626" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#dc2626" size="large" />
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || ''}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={loadPedidos}>
                <Text style={styles.emptyBtnText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          }
        />

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 15 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fecaca' },
  refreshBtn: {
    backgroundColor: '#fff', width: 45, height: 45,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center'
  },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 25, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6'
  },
  cardExpanded: {
    borderColor: '#dc2626', borderWidth: 1,
  },
  cardHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18
  },
  orderId: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  orderDate: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  expandedContent: {
    padding: 18, paddingTop: 0, backgroundColor: '#fafafa'
  },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 15 },
  detailsGrid: {
    gap: 8, marginBottom: 15
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#4b5563' },
  totalRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    backgroundColor: '#fff', padding: 15, borderRadius: 15,
    marginBottom: 15, borderWidth: 1, borderColor: '#fee2e2'
  },
  totalLabel: { fontSize: 15, color: '#111827', fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#dc2626' },
  actionLabel: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 8 },
  miniBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, alignItems: 'center'
  },
  miniBtnText: { fontSize: 11, fontWeight: 'bold' },
  emptyContainer: {
    alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 20
  },
  emptyText: {
    fontSize: 16, color: '#9ca3af', marginTop: 15, textAlign: 'center'
  },
  emptyBtn: {
    marginTop: 20, backgroundColor: '#dc262620', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12
  },
  emptyBtnText: {
    color: '#dc2626', fontWeight: 'bold'
  }
});


