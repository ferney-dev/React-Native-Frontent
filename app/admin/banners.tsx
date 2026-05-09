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
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { bannersApi } from '../../services/api';
import { Banner } from '../../types';
import { showAlert, showConfirm } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function AdminBanners() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen: '',
    color: '#dc2626',
    activo: 1
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await bannersApi.getAll();
      if (res.success) {
        setBanners(res.data as Banner[]);
      }
    } catch (error) {
      showAlert('Error', 'No se pudieron cargar los banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      showAlert('Campo requerido', 'El título es obligatorio', 'warning');
      return;
    }

    try {
      setLoading(true);
      if (editingBanner) {
        await bannersApi.update(editingBanner.id!.toString(), formData);
        showAlert('Éxito', 'Banner actualizado correctamente', 'success');
      } else {
        await bannersApi.create(formData);
        showAlert('Éxito', 'Banner creado correctamente', 'success');
      }
      setModalVisible(false);
      resetForm();
      loadBanners();
    } catch (error) {
      showAlert('Error', 'No se pudo guardar el banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      '¿Eliminar banner?',
      'Se borrará permanentemente.',
      async () => {
        try {
          await bannersApi.delete(id.toString());
          showAlert('Eliminado', 'Banner eliminado', 'success');
          loadBanners();
        } catch (error) {
          showAlert('Error', 'No se pudo eliminar el banner', 'error');
        }
      }
    );
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      titulo: banner.titulo,
      descripcion: banner.descripcion || '',
      imagen: banner.imagen || '',
      color: banner.color || '#dc2626',
      activo: banner.activo
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      titulo: '',
      descripcion: '',
      imagen: '',
      color: '#dc2626',
      activo: 1
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Banner }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.card, isDark && styles.cardDark, isExpanded && (isDark ? styles.cardExpandedDark : styles.cardExpanded)]}>
        <TouchableOpacity 
          style={styles.cardHeaderRow} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.colorIndicator, { backgroundColor: item.color || '#dc2626' }]}>
             <Ionicons name="image" size={20} color="#fff" />
          </View>
          <View style={styles.info}>
            <Text style={[styles.bannerTitle, isDark && styles.textDark]}>{item.titulo}</Text>
            <Text style={[styles.statusBadge, { color: item.activo ? '#10b981' : '#ef4444' }]}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </Text>
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
            
            {item.imagen && (
              <Image 
                source={{ uri: item.imagen }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.detailLabel}>Descripción:</Text>
            <Text style={[styles.detailText, isDark && styles.subTextDark]}>{item.descripcion || 'Sin descripción'}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Color de Fondo</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.colorCircle, { backgroundColor: item.color }]} />
                  <Text style={[styles.detailValue, isDark && styles.subTextDark]}>{item.color}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]} 
                onPress={() => openEdit(item)}
              >
                <Ionicons name="create" size={18} color="#fff" />
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => item.id && handleDelete(item.id)}
              >
                <Ionicons name="trash" size={18} color="#fff" />
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
      <LinearGradient colors={isDark ? ['#0f172a', '#1e293b'] : ['#ea580c', '#f97316']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Banners y Ofertas</Text>
          <Text style={styles.subtitle}>{banners.length} promociones actuales</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, isDark && styles.addBtnDark]} 
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={28} color="#ea580c" />
        </TouchableOpacity>
      </LinearGradient>

      {loading && !modalVisible ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#ea580c" size="large" />
      ) : (
        <FlatList
          data={banners}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || item.titulo}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay banners configurados</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.cardDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#1f2937"} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, isDark && styles.textDark]}>Título</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark]}
                value={formData.titulo}
                onChangeText={(t) => setFormData({ ...formData, titulo: t })}
                placeholder="Ej: 50% OFF en Pizzas"
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
              />

              <Text style={[styles.label, isDark && styles.textDark]}>Descripción</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark, { height: 80, textAlignVertical: 'top' }]}
                value={formData.descripcion}
                onChangeText={(t) => setFormData({ ...formData, descripcion: t })}
                placeholder="Breve detalle de la oferta..."
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                multiline
              />

              <Text style={[styles.label, isDark && styles.textDark]}>URL Imagen</Text>
              <TextInput
                style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark]}
                value={formData.imagen}
                onChangeText={(t) => setFormData({ ...formData, imagen: t })}
                placeholder="https://..."
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
              />

              <Text style={[styles.label, isDark && styles.textDark]}>Color de Fondo (Hex)</Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, isDark && styles.fieldDark, isDark && styles.textDark, { flex: 1 }]}
                  value={formData.color}
                  onChangeText={(t) => setFormData({ ...formData, color: t })}
                  placeholder="#dc2626"
                  placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                />
                <View style={[styles.colorPreview, { backgroundColor: formData.color || '#eee' }]} />
              </View>

              <TouchableOpacity 
                style={[styles.activeRow, isDark && styles.fieldDark]}
                onPress={() => setFormData({ ...formData, activo: formData.activo ? 0 : 1 })}
              >
                <Ionicons 
                  name={formData.activo ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={formData.activo ? "#10b981" : "#9ca3af"} 
                />
                <Text style={[styles.activeLabel, isDark && styles.textDark]}>Banner Activo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingBanner ? 'Actualizar Banner' : 'Crear Banner'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
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
  subtitle: { fontSize: 14, color: '#ffedd5' },
  addBtn: {
    backgroundColor: '#fff', width: 45, height: 45,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    elevation: 5
  },
  list: { padding: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 15,
    elevation: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6'
  },
  cardExpanded: { borderColor: '#ea580c' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  colorIndicator: {
    width: 45, height: 45, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  info: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  statusBadge: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  expandedContent: { padding: 20, paddingTop: 0, backgroundColor: '#fafafa' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 15 },
  previewImage: { width: '100%', height: 150, borderRadius: 15, marginBottom: 15 },
  detailLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 15 },
  detailsGrid: { marginBottom: 20 },
  detailItem: { flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  colorCircle: { width: 16, height: 16, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  editBtn: { backgroundColor: '#2563eb' },
  deleteBtn: { backgroundColor: '#dc2626' },
  actionText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 12, fontSize: 15 },
  colorPreview: { width: 50, height: 50, borderRadius: 12, borderWidth: 2, borderColor: '#fff', elevation: 2 },
  activeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, gap: 10 },
  activeLabel: { fontSize: 15, fontWeight: '600' },
  saveBtn: { backgroundColor: '#ea580c', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9ca3af', marginTop: 15 },

  // Dark modes
  containerDark: { backgroundColor: '#020617' },
  textDark: { color: '#f8fafc' },
  subTextDark: { color: '#94a3b8' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  cardExpandedDark: { borderColor: '#ea580c', borderWidth: 1.5 },
  fieldDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  addBtnDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  expandedContentDark: { backgroundColor: '#0f172a' },
  dividerDark: { backgroundColor: '#1e293b' },
});
