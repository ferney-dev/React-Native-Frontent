import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { categoriasApi } from '../../services/api';
import { Categoria } from '../../types';
import { showAlert, showConfirm } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function AdminCategorias() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  
  const [formData, setFormData] = useState({
    nombre: '',
    icono: 'food',
    color: '#dc2626'
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const res = await categoriasApi.getAll();
      if (res.success) {
        setCategorias(res.data as Categoria[]);
      }
    } catch (error) {
      showAlert('Error', 'No se pudieron cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      showAlert('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }

    try {
      setLoading(true);
      if (editingCategoria) {
        await categoriasApi.update(editingCategoria.id!.toString(), formData);
        showAlert('Éxito', 'Categoría actualizada correctamente', 'success');
      } else {
        await categoriasApi.create(formData);
        showAlert('Éxito', 'Categoría creada correctamente', 'success');
      }
      setModalVisible(false);
      resetForm();
      loadCategorias();
    } catch (error) {
      showAlert('Error', 'No se pudo guardar la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      '¿Eliminar categoría?',
      'Esta acción no se puede deshacer.',
      async () => {
        try {
          await categoriasApi.delete(id.toString());
          showAlert('Eliminado', 'Categoría eliminada con éxito', 'success');
          loadCategorias();
        } catch (error) {
          showAlert('Error', 'No se pudo eliminar la categoría', 'error');
        }
      }
    );
  };

  const openEdit = (cat: Categoria) => {
    setEditingCategoria(cat);
    setFormData({
      nombre: cat.nombre,
      icono: cat.icono || 'food',
      color: cat.color || '#dc2626'
    });
    setModalVisible(true);
  };


  const resetForm = () => {
    setEditingCategoria(null);
    setFormData({ nombre: '', icono: 'food', color: '#dc2626' });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Categoria }) => {
    const isExpanded = expandedId === item.id;
    
    return (
      <View style={[styles.card, isDark && styles.cardDark, isExpanded && (isDark ? styles.cardExpandedDark : styles.cardExpanded)]}>
        <TouchableOpacity 
          style={styles.cardHeaderRow} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: (item.color || '#dc2626') + (isDark ? '40' : '20') }]}>
            <MaterialCommunityIcons name={(item.icono || 'food') as any} size={28} color={item.color || '#dc2626'} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.catName, isDark && styles.textDark]}>{item.nombre}</Text>
            <Text style={styles.catStatus}>Estado: {item.estado || 'activo'}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? "#4b5563" : "#9ca3af"} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedContent, isDark && styles.expandedContentDark]}>
            <View style={[styles.divider, isDark && styles.dividerDark]} />
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Icono</Text>
                <Text style={[styles.detailValue, isDark && styles.subTextDark]}>{item.icono || 'Sin icono'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={[styles.detailValue, isDark && styles.subTextDark]}>{item.color || '#dc2626'}</Text>
              </View>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]} 
                onPress={() => openEdit(item)}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => item.id && handleDelete(item.id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };


  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#b91c1c', '#dc2626']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Categorías</Text>
          <Text style={styles.subtitle}>{categorias.length} categorías registradas</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, isDark && styles.addBtnDark]} 
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={28} color="#dc2626" />
        </TouchableOpacity>
      </LinearGradient>

      {loading && !modalVisible ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#dc2626" size="large" />
      ) : (
        <FlatList
          data={categorias}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || item.nombre}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay categorías registradas</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={loadCategorias}>
                <Text style={styles.emptyBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          }
        />

      )}

      {/* Modal CRUD */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.cardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#1f2937"} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[styles.label, isDark && styles.textDark]}>Nombre de la categoría</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark]}
                value={formData.nombre}
                onChangeText={(t) => setFormData({ ...formData, nombre: t })}
                placeholder="Ej. Hamburguesas"
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
              />

              <Text style={[styles.label, isDark && styles.textDark]}>Nombre del Icono (MaterialCommunityIcons)</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark]}
                value={formData.icono}
                onChangeText={(t) => setFormData({ ...formData, icono: t })}
                placeholder="Ej. food, pizza, coffee"
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
              />

              <Text style={[styles.label, isDark && styles.textDark]}>Color (Hexadecimal)</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark]}
                value={formData.color}
                onChangeText={(t) => setFormData({ ...formData, color: t })}
                placeholder="Ej. #dc2626"
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
              />

              <View style={styles.preview}>
                <Text style={[styles.label, isDark && styles.textDark]}>Vista Previa:</Text>
                <View style={[styles.previewCircle, { backgroundColor: formData.color + '20' }]}>
                   <MaterialCommunityIcons name={formData.icono as any} size={30} color={formData.color} />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>
                {editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    backgroundColor: '#fff', width: 45, height: 45,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5
  },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 25, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6'
  },
  cardExpanded: {
    borderColor: '#dc2626', borderWidth: 1,
    shadowOpacity: 0.1, shadowRadius: 15, elevation: 5
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', padding: 15
  },
  iconBox: {
    width: 55, height: 55, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  info: { flex: 1 },
  catName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  catStatus: { fontSize: 12, color: '#10b981', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  expandedContent: {
    padding: 20, paddingTop: 0, backgroundColor: '#fafafa'
  },
  divider: {
    height: 1, backgroundColor: '#f3f4f6', marginBottom: 15
  },
  detailsGrid: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8
  },
  editBtn: { backgroundColor: '#2563eb' },
  deleteBtn: { backgroundColor: '#dc2626' },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 25, height: '80%'
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 25
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#f3f4f6', padding: 15, borderRadius: 12,
    fontSize: 15, color: '#111827'
  },
  preview: { marginTop: 20, alignItems: 'center' },
  previewCircle: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center', marginTop: 10
  },
  saveBtn: {
    backgroundColor: '#dc2626', padding: 18, borderRadius: 15,
    alignItems: 'center', marginTop: 30,
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
  },

  // Dark modes
  containerDark: { backgroundColor: '#020617' },
  textDark: { color: '#f8fafc' },
  subTextDark: { color: '#94a3b8' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  cardExpandedDark: { borderColor: '#dc2626', borderWidth: 1.5 },
  fieldDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  addBtnDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  expandedContentDark: { backgroundColor: '#0f172a' },
  dividerDark: { backgroundColor: '#1e293b' },
});


