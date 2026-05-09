import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usuariosApi } from '../../services/api';
import { Usuario } from '../../types';
import { showAlert } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);


  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const res = await usuariosApi.getAll();
      if (res.success) {
        setUsuarios(res.data as Usuario[]);
      }
    } catch (error) {
      showAlert('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Usuario }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.card, isExpanded && styles.cardExpanded]}>
        <TouchableOpacity 
          style={styles.cardHeaderRow} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.foto ? (
              <Image source={{ uri: item.foto }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={28} color="#dc2626" />
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.nombre}</Text>
              {item.rol === 2 && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.correo}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9ca3af" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Teléfono</Text>
                <Text style={styles.detailValue}>{item.telefono}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dirección</Text>
                <Text style={styles.detailValue}>{item.direccion || 'No registrada'}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.footerText}>
                Registrado el: {item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : 'N/A'}
              </Text>
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
          <Text style={styles.title}>Usuarios</Text>
          <Text style={styles.subtitle}>{usuarios.length} clientes registrados</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#dc2626" size="large" />
      ) : (
        <FlatList
          data={usuarios}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || ''}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={loadUsuarios}>
                <Text style={styles.emptyBtnText}>Recargar</Text>
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
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 25, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6'
  },
  cardExpanded: {
    borderColor: '#dc2626', borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', padding: 15
  },
  avatarContainer: {
    width: 55, height: 55, borderRadius: 27,
    backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center',
    marginRight: 15, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  adminBadge: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  expandedContent: {
    padding: 20, paddingTop: 0, backgroundColor: '#fafafa'
  },
  divider: {
    height: 1, backgroundColor: '#f3f4f6', marginBottom: 15
  },
  detailsGrid: {
    gap: 12, marginBottom: 15
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  footerText: { fontSize: 12, color: '#9ca3af' },
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


