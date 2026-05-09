import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usuariosApi, pedidosApi } from '../../services/api';
import { Usuario, Pedido } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { showAlert, showConfirm } from '../../services/alerts';
import * as Haptics from 'expo-haptics';
import { AnimatedButton } from '../../components/AnimatedButton';
import { OrderStepper } from '../../components/OrderStepper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { Switch } from 'react-native';





export default function PerfilScreen() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    foto: ''
  });


  useEffect(() => {
    const initialize = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUsuario(parsedUser);
        setFormData({
          nombre: parsedUser.nombre || '',
          telefono: parsedUser.telefono || '',
          correo: parsedUser.correo || '',
          direccion: parsedUser.direccion || '',
          foto: parsedUser.foto || ''
        });

        loadPedidos(parsedUser.id);
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);


  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;
      const parsedUser = JSON.parse(userData);
      
      const usuarioRes = await usuariosApi.getById(parsedUser.id.toString());
      
      if (usuarioRes.success) {
        const data = usuarioRes.data as Usuario;
        setUsuario(data);
        setFormData({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          correo: data.correo || '',
          direccion: data.direccion || '',
          foto: data.foto || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFormData({ ...formData, foto: result.assets[0].uri });
      // Si no estamos en modo edición, preguntamos si quiere guardar el cambio de foto inmediatamente
      if (!editando) {
        Alert.alert(
          '¿Cambiar foto?',
          '¿Deseas actualizar tu foto de perfil ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sí, actualizar', onPress: () => handleActualizarFoto(result.assets[0].uri) }
          ]
        );
      }
    }
  };

  const handleActualizarFoto = async (uri: string) => {
    if (!usuario?.id) return;
    try {
      setLoading(true);
      await usuariosApi.update(usuario.id.toString(), { ...usuario, foto: uri });
      const updatedUser = { ...usuario, foto: uri };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUsuario(updatedUser);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la foto');
    } finally {
      setLoading(false);
    }
  };


  const loadPedidos = async (userId: number) => {
    try {
      const pedidosRes = await pedidosApi.getByUsuario(userId.toString());
      if (pedidosRes.success) {
        setPedidos(pedidosRes.data as Pedido[]);
      }
    } catch (error) {
      console.error('Error loading pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      '¿Cerrar Sesión?',
      '¿Estás seguro que deseas salir de tu cuenta?',
      async () => {
        try {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          router.replace('/login');
        } catch (error) {
          console.error('Logout error:', error);
          showAlert('Error', 'No se pudo cerrar la sesión', 'error');
        }
      }
    );
  };



  const handleSave = async () => {
    if (!usuario?.id) return;
    
    // Validaciones básicas
    if (!formData.nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio');
      return;
    }
    
    if (!formData.telefono.trim()) {
      Alert.alert('Campo requerido', 'El teléfono es obligatorio');
      return;
    }
    
    if (formData.correo && !formData.correo.includes('@')) {
      Alert.alert('Correo inválido', 'El correo electrónico no es válido');
      return;
    }
    
    if (!usuario?.id) return;

    try {
      await usuariosApi.update(usuario.id.toString(), formData);
      const updatedUser = { ...usuario, ...formData } as Usuario;
      setUsuario(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      setEditando(false);
      Alert.alert('✅ Éxito', 'Tu perfil ha sido actualizado correctamente');

    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  const handleCancel = () => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        telefono: usuario.telefono || '',
        correo: usuario.correo || '',
        direccion: usuario.direccion || '',
        foto: usuario.foto || ''
      });

    }
    setEditando(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado': return '#10b981';
      case 'en_camino': return '#3b82f6';
      case 'preparando': return '#f59e0b';
      case 'pendiente': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'entregado': return 'checkmark-circle';
      case 'en_camino': return 'bicycle';
      case 'preparando': return 'restaurant';
      case 'pendiente': return 'time';
      default: return 'time';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#020617' : '#fff5f5' }}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ marginTop: 10, color: isDark ? '#f8fafc' : '#7f1d1d' }}>Cargando perfil...</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }} className="bg-[#fff5f5] dark:bg-slate-950">
      {/* HEADER */}
      <View
        className="bg-[#b91c1c] dark:bg-slate-900 pt-[60px] pb-5 px-5 rounded-b-[30px]"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            Mi Perfil 👤
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
               <Ionicons name={colorScheme === 'dark' ? "moon" : "sunny"} size={18} color="#fff" />
               <Switch 
                 value={colorScheme === 'dark'} 
                 onValueChange={toggleColorScheme}
                 trackColor={{ false: "#767577", true: "#fecaca" }}
                 thumbColor={colorScheme === 'dark' ? "#fff" : "#f4f3f4"}
               />
            </View>

            <AnimatedButton
              haptic={Haptics.ImpactFeedbackStyle.Light}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 15,
              }}
              onPress={() => setEditando(!editando)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {editando ? 'Cancelar' : 'Editar'}
              </Text>
            </AnimatedButton>

            <AnimatedButton
              haptic={Haptics.ImpactFeedbackStyle.Medium}
              style={{
                backgroundColor: '#fff',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            </AnimatedButton>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
        {/* PUNTOS Y FIDELIZACIÓN */}
        {!editando && (
          <View
            className="bg-white dark:bg-slate-900 rounded-[25px] p-5 mb-5 flex-row items-center border border-[#fef3c7] dark:border-amber-900/30 shadow-sm"
          >
            <View style={{
              backgroundColor: isDark ? '#dc262620' : '#fffbeb',
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15
            }}>
              <Ionicons name="star" size={28} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#92400e', fontWeight: 'bold', fontSize: 16 }}>Puntos FoodExpress</Text>
              <View style={{ 
                height: 10, 
                backgroundColor: '#fef3c7', 
                borderRadius: 5, 
                marginTop: 8,
                overflow: 'hidden'
              }}>
                <View style={{ 
                  width: '65%', 
                  height: '100%', 
                  backgroundColor: '#f59e0b',
                  borderRadius: 5
                }} />
              </View>
              <Text style={{ color: '#b45309', fontSize: 12, marginTop: 5 }}>650 / 1000 pts para tu próximo bono</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#b45309' }}>650</Text>
              <Text style={{ fontSize: 10, color: '#b45309', fontWeight: 'bold' }}>COINS</Text>
            </View>
          </View>
        )}

        {/* INFO DE USUARIO */}

        {usuario && (
          <View 
            className="bg-white dark:bg-slate-900 rounded-[25px] p-5 mb-5 shadow-sm border border-gray-50 dark:border-slate-800"
          >
            <Text className="text-lg font-bold text-red-900 dark:text-red-400 mb-4">
              Información Personal
            </Text>
            
            {/* AVATAR */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: isDark ? '#dc262620' : '#fee2e2',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    borderWidth: 3,
                    borderColor: isDark ? '#1e293b' : '#fff',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10
                  }}
                >
                  {formData.foto ? (
                    <Image 
                      source={{ uri: formData.foto }} 
                      style={{ width: '100%', height: '100%' }} 
                    />
                  ) : usuario?.foto ? (
                    <Image 
                      source={{ uri: usuario.foto }} 
                      style={{ width: '100%', height: '100%' }} 
                    />
                  ) : (
                    <Ionicons name="person" size={60} color="#dc2626" />
                  )}

                  
                  {/* Overlay Cámara */}
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    height: 25,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 'bold', marginTop: 8 }}>
                Toca para cambiar foto
              </Text>
            </View>



            {/* FORMULARIO */}
            <View style={{ gap: 15 }}>
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Nombre</Text>
                {editando ? (
                  <TextInput
                    className="bg-gray-50 dark:bg-slate-800 border border-red-600 dark:border-red-500 rounded-xl p-[15px] text-base text-gray-900 dark:text-gray-100"
                    value={formData.nombre}
                    onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                    placeholder="Tu nombre"
                    placeholderTextColor="#9ca3af"
                  />
                ) : (
                  <Text className="text-base text-gray-700 dark:text-gray-200">{usuario.nombre}</Text>
                )}
              </View>

              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Teléfono</Text>
                {editando ? (
                  <TextInput
                    className="bg-gray-50 dark:bg-slate-800 border border-red-600 dark:border-red-500 rounded-xl p-[15px] text-base text-gray-900 dark:text-gray-100"
                    value={formData.telefono}
                    onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                    placeholder="Tu teléfono"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text className="text-base text-gray-700 dark:text-gray-200">{usuario.telefono}</Text>
                )}
              </View>

              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Correo</Text>
                {editando ? (
                  <TextInput
                    className="bg-gray-50 dark:bg-slate-800 border border-red-600 dark:border-red-500 rounded-xl p-[15px] text-base text-gray-900 dark:text-gray-100"
                    value={formData.correo}
                    onChangeText={(text) => setFormData({ ...formData, correo: text })}
                    placeholder="Tu correo"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                  />
                ) : (
                  <Text className="text-base text-gray-700 dark:text-gray-200">{usuario.correo || 'No especificado'}</Text>
                )}
              </View>

              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Dirección</Text>
                {editando ? (
                  <TextInput
                    className="bg-gray-50 dark:bg-slate-800 border border-red-600 dark:border-red-500 rounded-xl p-[15px] text-base text-gray-900 dark:text-gray-100 h-20"
                    value={formData.direccion}
                    onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                    placeholder="Tu dirección"
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                  />
                ) : (
                  <Text className="text-base text-gray-700 dark:text-gray-200">{usuario.direccion || 'No especificada'}</Text>
                )}
              </View>

            </View>


            {/* BOTONES DE ACCIÓN */}
            {editando && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <AnimatedButton
                  haptic={Haptics.ImpactFeedbackStyle.Medium}
                  style={{
                    flex: 1,
                    backgroundColor: '#dc2626',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={handleSave}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Guardar Cambios
                  </Text>
                </AnimatedButton>
                
                <AnimatedButton
                  haptic={Haptics.ImpactFeedbackStyle.Light}
                  style={{
                    flex: 1,
                    backgroundColor: '#6b7280',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={handleCancel}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Cancelar
                  </Text>
                </AnimatedButton>
              </View>
            )}

          </View>
        )}

        {/* HISTORIAL DE PEDIDOS */}
        <View 
          className="bg-white dark:bg-slate-900 rounded-[25px] p-5 mb-10 shadow-sm border border-gray-50 dark:border-slate-800"
        >
          <Text className="text-lg font-bold text-red-900 dark:text-red-400 mb-4">
            Mis Pedidos 📦
          </Text>
          
          {pedidos.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
              <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 15, textAlign: 'center' }}>
                No tienes pedidos aún
              </Text>
              <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
                Realiza tu primer pedido para verlo aquí
              </Text>
            </View>
          ) : (
            pedidos.map((pedido) => (
              <View
                key={pedido.id?.toString()}
                className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-3 border-l-4"
                style={{
                  borderLeftColor: getEstadoColor(pedido.estado),
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>
                      Pedido #{pedido.id}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                      {pedido.fecha && new Date(pedido.fecha).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                      {pedido.detalles?.length || 0} productos
                    </Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons 
                      name={getEstadoIcon(pedido.estado) as any} 
                      size={24} 
                      color={getEstadoColor(pedido.estado)} 
                    />
                    <Text style={{ 
                      fontSize: 12, 
                      color: getEstadoColor(pedido.estado),
                      marginTop: 4,
                      fontWeight: 'bold'
                    }}>
                      {pedido.estado.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={{ marginVertical: 10 }}>
                  <OrderStepper status={pedido.estado as any} />
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: 10,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#1e293b' : '#e5e7eb'
                }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc2626' }}>
                    {formatPrice(pedido.total)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                    {pedido.metodo_pago}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}