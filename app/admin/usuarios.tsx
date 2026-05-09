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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usuariosApi } from '../../services/api';
import { Usuario } from '../../types';
import { showAlert } from '../../services/alerts';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedButton } from '../../components/AnimatedButton';
import { useTheme } from '../../context/ThemeContext';

export default function AdminUsuarios() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Usuario> | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    rol: 1,
    password: ''
  });

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

  const handleOpenModal = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        telefono: user.telefono,
        correo: user.correo || '',
        direccion: user.direccion || '',
        rol: user.rol || 1,
        password: '' // No mostrar la contraseña actual
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        telefono: '',
        correo: '',
        direccion: '',
        rol: 1,
        password: ''
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.telefono) {
      showAlert('Error', 'Nombre y teléfono son obligatorios', 'error');
      return;
    }

    try {
      setLoading(true);
      let res;
      if (editingUser) {
        res = await usuariosApi.update(editingUser.id!.toString(), formData);
      } else {
        res = await usuariosApi.create(formData);
      }

      if (res.success) {
        showAlert('Éxito', editingUser ? 'Usuario actualizado' : 'Usuario creado', 'success');
        setModalVisible(false);
        loadUsuarios();
      } else {
        showAlert('Error', res.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Ocurrió un problema', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Eliminar Usuario',
      '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await usuariosApi.delete(id.toString());
              if (res.success) {
                showAlert('Eliminado', 'Usuario eliminado correctamente', 'success');
                loadUsuarios();
              }
            } catch (error) {
              showAlert('Error', 'No se pudo eliminar el usuario', 'error');
            }
          }
        }
      ]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Usuario }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={[styles.card, isExpanded && styles.cardExpanded]} className="bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800">
        <TouchableOpacity 
          style={styles.cardHeaderRow} 
          onPress={() => item.id && toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer} className="bg-red-50 dark:bg-red-900/20">
            {item.foto ? (
              <Image source={{ uri: item.foto }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={28} color="#dc2626" />
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} className="text-gray-900 dark:text-gray-100">{item.nombre}</Text>
              {item.rol === 2 && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} className="text-gray-500 dark:text-gray-400">{item.correo || 'Sin correo'}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9ca3af" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent} className="bg-gray-50 dark:bg-slate-800/50">
            <View style={styles.divider} className="bg-gray-200 dark:bg-slate-700" />
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel} className="text-gray-400 dark:text-gray-500">Teléfono</Text>
                <Text style={styles.detailValue} className="text-gray-700 dark:text-gray-300">{item.telefono}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel} className="text-gray-400 dark:text-gray-500">Dirección</Text>
                <Text style={styles.detailValue} className="text-gray-700 dark:text-gray-300">{item.direccion || 'No registrada'}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]} 
                onPress={() => handleOpenModal(item)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => item.id && handleDelete(item.id)}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.footerText} className="text-gray-400">
                Registrado el: {item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };


  return (
    <View style={styles.container} className="bg-gray-50 dark:bg-slate-950">
      <LinearGradient 
        colors={colorScheme === 'dark' ? ['#0f172a', '#1e293b'] : ['#b91c1c', '#dc2626']} 
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Usuarios</Text>
          <Text style={styles.subtitle}>{usuarios.length} usuarios registrados</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading && usuarios.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#dc2626" size="large" />
      ) : (
        <FlatList
          data={usuarios}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={80} color="#d1d5db" />
              <Text style={styles.emptyText} className="text-gray-400">No hay usuarios registrados</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={loadUsuarios}>
                <Text style={styles.emptyBtnText}>Recargar</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* CREATE/EDIT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} className="bg-white dark:bg-slate-900">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} className="text-gray-900 dark:text-gray-100">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">Nombre Completo</Text>
                  <TextInput
                    style={styles.input}
                    className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-700"
                    value={formData.nombre}
                    onChangeText={(val) => setFormData({...formData, nombre: val})}
                    placeholder="Ej. Juan Pérez"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-700"
                    value={formData.telefono}
                    onChangeText={(val) => setFormData({...formData, telefono: val})}
                    keyboardType="phone-pad"
                    placeholder="3001234567"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">Correo Electrónico</Text>
                  <TextInput
                    style={styles.input}
                    className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-700"
                    value={formData.correo}
                    onChangeText={(val) => setFormData({...formData, correo: val})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="juan@ejemplo.com"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">Dirección</Text>
                  <TextInput
                    style={styles.input}
                    className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-700"
                    value={formData.direccion}
                    onChangeText={(val) => setFormData({...formData, direccion: val})}
                    placeholder="Calle 123 #45-67"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">Rol</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity 
                      style={[styles.roleOption, formData.rol === 1 && styles.roleActive]}
                      onPress={() => setFormData({...formData, rol: 1})}
                    >
                      <Text style={[styles.roleText, formData.rol === 1 && styles.roleTextActive]}>Cliente</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.roleOption, formData.rol === 2 && styles.roleActive]}
                      onPress={() => setFormData({...formData, rol: 2})}
                    >
                      <Text style={[styles.roleText, formData.rol === 2 && styles.roleTextActive]}>Admin</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label} className="text-gray-600 dark:text-gray-400">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    className="bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-slate-700"
                    value={formData.password}
                    onChangeText={(val) => setFormData({...formData, password: val})}
                    secureTextEntry
                    placeholder="******"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar Usuario</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 15 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fecaca' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    borderRadius: 25, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    overflow: 'hidden', borderWidth: 1
  },
  cardExpanded: {
    borderColor: '#dc2626', borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', padding: 15
  },
  avatarContainer: {
    width: 55, height: 55, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 16, fontWeight: 'bold' },
  adminBadge: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adminText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  userEmail: { fontSize: 13, marginTop: 2 },
  expandedContent: {
    padding: 20, paddingTop: 0
  },
  divider: {
    height: 1, marginBottom: 15
  },
  detailsGrid: {
    gap: 12, marginBottom: 20
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  editBtn: { backgroundColor: '#3b82f6' },
  deleteBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  footerText: { fontSize: 12 },
  emptyContainer: {
    alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 20
  },
  emptyText: {
    fontSize: 16, marginTop: 15, textAlign: 'center'
  },
  emptyBtn: {
    marginTop: 20, backgroundColor: '#dc262620', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12
  },
  emptyBtnText: {
    color: '#dc2626', fontWeight: 'bold'
  },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { gap: 15 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { height: 50, borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, fontSize: 15 },
  roleContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
  roleOption: { flex: 1, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  roleActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  roleText: { color: '#6b7280', fontWeight: 'bold' },
  roleTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#dc2626', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
