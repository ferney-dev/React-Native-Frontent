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
import { productosApi, categoriasApi } from '../../services/api';
import { Producto, Categoria } from '../../types';
import { showAlert, showConfirm } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminProductos() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    id_categoria: '',
    imagen: '',
    emoji: '🍔',
    popular: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productosApi.getAll(),
        categoriasApi.getAll()
      ]);
      if (prodRes.success) setProductos(prodRes.data as Producto[]);
      if (catRes.success) setCategorias(catRes.data as Categoria[]);
    } catch (error) {
      showAlert('Error', 'No se pudo cargar la información', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const { nombre, precio, id_categoria } = formData;
    if (!nombre.trim() || !precio || !id_categoria) {
      showAlert('Campos requeridos', 'Nombre, precio y categoría son obligatorios', 'warning');
      return;
    }

    try {
      setLoading(true);
      const dataToSend = {
        ...formData,
        precio: parseFloat(formData.precio),
        id_categoria: parseInt(formData.id_categoria),
        popular: formData.popular ? 1 : 0
      };

      if (editingProducto) {
        await productosApi.update(editingProducto.id!.toString(), dataToSend);
        showAlert('Éxito', 'Producto actualizado correctamente', 'success');
      } else {
        await productosApi.create(dataToSend);
        showAlert('Éxito', 'Producto creado correctamente', 'success');
      }
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (error) {
      showAlert('Error', 'No se pudo guardar el producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      '¿Eliminar producto?',
      'Se borrará permanentemente.',
      async () => {
        try {
          await productosApi.delete(id.toString());
          showAlert('Eliminado', 'Producto eliminado', 'success');
          loadData();
        } catch (error) {
          showAlert('Error', 'No se pudo eliminar el producto', 'error');
        }
      }
    );
  };

  const openEdit = (prod: Producto) => {
    setEditingProducto(prod);
    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: prod.precio.toString(),
      id_categoria: prod.id_categoria?.toString() || '',
      imagen: prod.imagen || '',
      emoji: prod.emoji || '🍔',
      popular: prod.popular || 0
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingProducto(null);
    setFormData({
      nombre: '', descripcion: '', precio: '', id_categoria: '',
      imagen: '', emoji: '🍔', popular: 0
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Producto }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.card, isExpanded && styles.cardExpanded]}>
        <TouchableOpacity 
          style={styles.cardHeaderRow} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardImageContainer}>
            {item.imagen ? (
              <Image source={{ uri: item.imagen }} style={styles.cardImage} />
            ) : (
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.prodName}>{item.nombre}</Text>
            <Text style={styles.prodCat}>{item.categoria_nombre || 'Sin categoría'}</Text>
            <Text style={styles.prodPrice}>${Number(item.precio).toLocaleString()}</Text>
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
            <Text style={styles.descriptionLabel}>Descripción:</Text>
            <Text style={styles.descriptionText}>{item.descripcion || 'Sin descripción'}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Estado</Text>
                <Text style={[styles.detailValue, { color: item.disponible ? '#10b981' : '#dc2626' }]}>
                  {item.disponible ? 'Disponible' : 'Agotado'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Popular</Text>
                <Text style={styles.detailValue}>{item.popular ? 'Sí ⭐' : 'No'}</Text>
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
    <View style={styles.container}>
      <LinearGradient colors={['#b91c1c', '#dc2626']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>{productos.length} items en el menú</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={28} color="#dc2626" />
        </TouchableOpacity>
      </LinearGradient>

      {loading && !modalVisible ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#dc2626" size="large" />
      ) : (
        <FlatList
          data={productos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || item.nombre}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay productos registrados</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={loadData}>
                <Text style={styles.emptyBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          }
        />

      )}

      {/* Modal CRUD */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(t) => setFormData({ ...formData, nombre: t })}
                placeholder="Nombre del producto"
              />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categorias.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        formData.id_categoria === cat.id?.toString() && styles.catChipActive
                      ]}
                      onPress={() => setFormData({ ...formData, id_categoria: cat.id?.toString() || '' })}
                    >
                      <Text style={[
                        styles.catChipText,
                        formData.id_categoria === cat.id?.toString() && styles.catChipTextActive
                      ]}>
                        {cat.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                value={formData.precio}
                onChangeText={(t) => setFormData({ ...formData, precio: t })}
                placeholder="0.00"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formData.descripcion}
                onChangeText={(t) => setFormData({ ...formData, descripcion: t })}
                placeholder="Breve descripción..."
                multiline
              />

              <Text style={styles.label}>URL Imagen (Opcional)</Text>
              <TextInput
                style={styles.input}
                value={formData.imagen}
                onChangeText={(t) => setFormData({ ...formData, imagen: t })}
                placeholder="https://..."
              />

              <Text style={styles.label}>Emoji representativo</Text>
              <TextInput
                style={styles.input}
                value={formData.emoji}
                onChangeText={(t) => setFormData({ ...formData, emoji: t })}
                placeholder="🍔"
              />

              <TouchableOpacity 
                style={styles.popularRow}
                onPress={() => setFormData({ ...formData, popular: formData.popular ? 0 : 1 })}
              >
                <Ionicons 
                  name={formData.popular ? "star" : "star-outline"} 
                  size={24} 
                  color={formData.popular ? "#eab308" : "#9ca3af"} 
                />
                <Text style={styles.popularLabel}>Destacar en populares</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingProducto ? 'Actualizar Producto' : 'Crear Producto'}
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
  cardImageContainer: {
    width: 65, height: 65, borderRadius: 16,
    backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', marginRight: 15
  },
  cardImage: { width: '100%', height: '100%' },
  cardEmoji: { fontSize: 32 },
  info: { flex: 1 },
  prodName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  prodCat: { fontSize: 12, color: '#dc2626', fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  prodPrice: { fontSize: 15, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  expandedContent: {
    padding: 20, paddingTop: 0, backgroundColor: '#fafafa'
  },
  divider: {
    height: 1, backgroundColor: '#f3f4f6', marginBottom: 15
  },
  descriptionLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 5 },
  descriptionText: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 15 },
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
    padding: 25, height: '90%'
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#f3f4f6', padding: 15, borderRadius: 12,
    fontSize: 15, color: '#111827'
  },
  pickerContainer: { marginVertical: 5 },
  catChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#f3f4f6', marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb'
  },
  catChipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  catChipText: { color: '#6b7280', fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  popularRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, gap: 10
  },
  popularLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
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
  }
});

