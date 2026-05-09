import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { carritoApi, pedidosApi, domiciliosApi, cuponesApi } from '../services/api';
import { Carrito, Domicilio, Cupon, CarritoTotales } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AnimatedButton } from '../components/AnimatedButton';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { useTheme } from '../context/ThemeContext';




export default function CarritoScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [carritoItems, setCarritoItems] = useState<Carrito[]>([]);

  const [totales, setTotales] = useState<CarritoTotales | null>(null);
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<Domicilio | null>(null);
  const [cupon, setCupon] = useState<string>('');
  const [cuponValidado, setCuponValidado] = useState<Cupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesandoPedido, setProcesandoPedido] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setLoading(false);
        return;
      }
      const idUsuario = JSON.parse(userData).id.toString();
      
      const [carritoRes, totalesRes, domiciliosRes] = await Promise.all([
        carritoApi.getByUsuario(idUsuario),
        carritoApi.getTotales(idUsuario),
        domiciliosApi.getAll()
      ]);

      if (carritoRes.success) {
        const items = carritoRes.data as Carrito[];
        const itemsDisponibles = items.filter((item: Carrito) => item.disponible === 1);
        setCarritoItems(itemsDisponibles);
      }
      if (totalesRes.success) setTotales(totalesRes.data as CarritoTotales);
      if (domiciliosRes.success) setDomicilios(domiciliosRes.data as Domicilio[]);
    } catch (error) {
      console.error('Error loading carrito:', error);
      Alert.alert('Error', 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };


  const updateCantidad = async (id: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    
    try {
      await carritoApi.updateCantidad(id.toString(), nuevaCantidad);
      loadData(); // Recargar datos
      Alert.alert('✅ Actualizado', 'La cantidad se ha actualizado correctamente');
    } catch (error) {
      console.error('Error updating cantidad:', error);
      Alert.alert('Error', 'No se pudo actualizar la cantidad');
    }
  };

  const removeFromCarrito = async (id: number) => {
    try {
      await carritoApi.delete(id.toString());
      loadData(); // Recargar datos
      Alert.alert('✅ Eliminado', 'El producto se ha eliminado del carrito');
    } catch (error) {
      console.error('Error removing from carrito:', error);
      Alert.alert('Error', 'No se pudo eliminar del carrito');
    }
  };

  const validarCupon = async () => {
    if (!cupon.trim() || !totales) return;
    
    try {
      const result = await cuponesApi.validar(cupon.toUpperCase(), totales.total_precio);
      if (result.success && (result.data as any).valido) {
        setCuponValidado((result.data as any).cupon);
        Alert.alert('✅ Cupón aplicado', 'El cupón se ha aplicado correctamente');
      } else {
        Alert.alert('⚠️ Cupón inválido', (result.data as any).mensaje || 'Este cupón no es válido');
      }
    } catch (error) {
      console.error('Error validando cupón:', error);
      Alert.alert('Error', 'No se pudo validar el cupón');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  const calcularTotalConDescuento = () => {
    if (!totales) return 0;
    let total = totales.total_precio;
    
    if (domicilioSeleccionado) {
      total += domicilioSeleccionado.precio;
    }
    
    if (cuponValidado) {
      const descuento = (total * cuponValidado.descuento) / 100;
      total -= descuento;
    }
    
    return total;
  };

  const procesarPedido = async () => {
    if (!domicilioSeleccionado) {
      Alert.alert('Información requerida', 'Por favor selecciona una zona de domicilio');
      return;
    }

    if (carritoItems.length === 0) {
      Alert.alert('Carrito vacío', 'Tu carrito está vacío. Agrega productos para continuar');
      return;
    }

    // Confirmación antes de procesar
    Alert.alert(
      '📝 Confirmar pedido',
      `Total: ${formatPrice(calcularTotalConDescuento())}\n` +
      `Productos: ${carritoItems.length}\n` +
      `Domicilio: ${domicilioSeleccionado.zona}\n` +
      `Pago: Efectivo`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              setProcesandoPedido(true);
              const userData = await AsyncStorage.getItem('userData');
              const idUsuario = JSON.parse(userData!).id.toString();

              
              const detalles = carritoItems.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio: item.precio || 0,
                subtotal: item.subtotal
              }));

              const nuevoPedido = {
                id_usuario: idUsuario,
                total: calcularTotalConDescuento(),
                metodo_pago: 'efectivo',
                direccion: `Domicilio ${domicilioSeleccionado.zona}`,
                detalles
              };

              await pedidosApi.create(nuevoPedido);
              
              // Vaciar carrito
              await carritoApi.vaciarCarrito(idUsuario);
              
              // Disparar confeti
              setShowConfetti(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              Alert.alert(
                '✅ Pedido confirmado',
                'Tu pedido ha sido procesado exitosamente. ¡Gracias por tu compra!',

                [
                  { 
                    text: 'Ver mis pedidos', 
                    onPress: () => {
                      loadData();
                      setCuponValidado(null);
                      setCupon('');
                      setDomicilioSeleccionado(null);
                    } 
                  },
                  { 
                    text: 'Seguir comprando', 
                    style: 'cancel',
                    onPress: () => {
                      loadData();
                      setCuponValidado(null);
                      setCupon('');
                      setDomicilioSeleccionado(null);
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error procesando pedido:', error);
              Alert.alert('Error', 'No se pudo procesar tu pedido. Intenta nuevamente');
            } finally {
              setProcesandoPedido(false);
            }
          }
        }
      ]
    );
  };

  const vaciarCarrito = async () => {
    if (carritoItems.length === 0) {
      Alert.alert('Carrito vacío', 'Tu carrito ya está vacío');
      return;
    }

    Alert.alert(
      '🗑️ Vaciar carrito',
      '¿Estás seguro de que quieres vaciar todo el carrito?\n\nEsta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Vaciar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const userData = await AsyncStorage.getItem('userData');
              const idUsuario = JSON.parse(userData!).id.toString();
              await carritoApi.vaciarCarrito(idUsuario);

              
              Alert.alert('✅ Carrito vaciado', 'Tu carrito ha sido vaciado exitosamente');
              
              // Recargar datos
              loadData();
              setCuponValidado(null);
              setCupon('');
              setDomicilioSeleccionado(null);
            } catch (error) {
              console.error('Error vaciando carrito:', error);
              Alert.alert('Error', 'No se pudo vaciar el carrito');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fff5f5] dark:bg-slate-950">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="mt-[10px] text-red-900 dark:text-red-400">Cargando carrito...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#fff5f5] dark:bg-slate-950">
      {/* HEADER */}
      <View
        className="bg-[#b91c1c] dark:bg-slate-900 pt-[60px] pb-5 px-5 rounded-b-[30px]"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            Mi Carrito 🛒
          </Text>
        </View>

        
        <Text
          style={{
            color: '#fecaca',
            marginTop: 5,
            fontSize: 14,
          }}
        >
          {carritoItems.length} {carritoItems.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
        {/* ITEMS DEL CARRITO */}
        {carritoItems.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="cart-outline" size={80} color="#d1d5db" />
            <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 20, textAlign: 'center' }}>
              Tu carrito está vacío
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
              Explora nuestros productos y añade al carrito
            </Text>
          </View>
        ) : (
          carritoItems.map((item) => (
            <View
              key={item.id?.toString() || `${item.id_producto}`}
              className="bg-white dark:bg-slate-900 rounded-[25px] p-[18px] mb-[18px] flex-row items-center shadow-sm border border-gray-50 dark:border-slate-800"
            >
              {/* EMOJI */}
              <View
                className="w-[70px] h-[70px] rounded-[22px] bg-red-100 dark:bg-red-900/20 justify-center items-center"
              >
                <Text style={{ fontSize: 35 }}>{item.emoji || '🍽️'}</Text>
              </View>

              {/* INFO */}
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  className="text-base font-bold text-gray-900 dark:text-gray-100"
                >
                  {item.producto_nombre}
                </Text>

                <Text
                  style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    fontSize: 16,
                    marginTop: 5,
                  }}
                >
                  {formatPrice(item.subtotal)}
                </Text>
              </View>

              {/* CONTROLES */}
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <TouchableOpacity
                    className="bg-red-100 dark:bg-red-900/30 w-[30px] h-[30px] rounded-full justify-center items-center"
                    onPress={() => item.id && updateCantidad(item.id, item.cantidad - 1)}
                  >
                    <Ionicons name="remove" size={18} color="#dc2626" />
                  </TouchableOpacity>
                  
                  <Text className="mx-3 text-base font-bold text-gray-900 dark:text-gray-100">
                    {item.cantidad}
                  </Text>
                  
                  <TouchableOpacity
                    className="bg-red-100 dark:bg-red-900/30 w-[30px] h-[30px] rounded-full justify-center items-center"
                    onPress={() => item.id && updateCantidad(item.id, item.cantidad + 1)}
                  >
                    <Ionicons name="add" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  className="bg-red-100 dark:bg-red-900/30 px-3 py-[6px] rounded-xl"
                  onPress={() => item.id && removeFromCarrito(item.id)}
                >
                  <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: 'bold' }}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* DOMICILIO */}
        {carritoItems.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">
              Zona de domicilio
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {domicilios.map((domicilio) => (
                <TouchableOpacity
                  key={domicilio.id?.toString()}
                  className={`rounded-[15px] p-[15px] mr-[10px] min-w-[120px] items-center border-2 ${
                    domicilioSeleccionado?.id === domicilio.id 
                      ? 'bg-red-600 border-red-600' 
                      : 'bg-white dark:bg-slate-900 border-red-600'
                  }`}
                  onPress={() => setDomicilioSeleccionado(domicilio)}
                >
                  <Text style={{ 
                    color: domicilioSeleccionado?.id === domicilio.id ? '#fff' : (isDark ? '#ef4444' : '#dc2626'),
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {domicilio.zona}
                  </Text>
                  <Text style={{ 
                    color: domicilioSeleccionado?.id === domicilio.id ? '#fecaca' : (isDark ? '#94a3b8' : '#6b7280'),
                    fontSize: 12,
                    marginTop: 5
                  }}>
                    {formatPrice(domicilio.precio)}
                  </Text>
                  <Text style={{ 
                    color: domicilioSeleccionado?.id === domicilio.id ? '#fecaca' : (isDark ? '#64748b' : '#9ca3af'),
                    fontSize: 11,
                    marginTop: 2
                  }}>
                    {domicilio.tiempo_estimado}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CUPÓN */}
        {carritoItems.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text className="text-lg font-bold text-red-900 dark:text-red-400 mb-2">
              Cupón de descuento
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                className="flex-1 bg-white dark:bg-slate-900 border-2 border-red-600 rounded-[15px] p-[15px] text-base text-gray-900 dark:text-gray-100"
                placeholder="Ingresa código del cupón"
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                value={cupon}
                onChangeText={setCupon}
                autoCapitalize="characters"
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 15,
                  paddingHorizontal: 20,
                  justifyContent: 'center',
                }}
                onPress={validarCupon}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Aplicar</Text>
              </TouchableOpacity>
            </View>
            
            {cuponValidado && (
              <View style={{
                backgroundColor: '#10b981',
                borderRadius: 10,
                padding: 10,
                marginTop: 10,
              }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Cupón aplicado: -{cuponValidado.descuento}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* RESUMEN */}
        {carritoItems.length > 0 && totales && (
          <View className="bg-white dark:bg-slate-900 rounded-[25px] p-5 mt-5 mb-[30px] shadow-sm border border-gray-50 dark:border-slate-800">
            <Text className="text-lg font-bold text-red-900 dark:text-red-400 mb-[15px]">
              Resumen del pedido
            </Text>
            
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text className="text-gray-500 dark:text-gray-400">Subtotal</Text>
                <Text className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(totales.total_precio)}</Text>
              </View>
              
              {domicilioSeleccionado && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text className="text-gray-500 dark:text-gray-400">Domicilio ({domicilioSeleccionado.zona})</Text>
                  <Text className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(domicilioSeleccionado.precio)}</Text>
                </View>
              )}
              
              {cuponValidado && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#10b981' }}>Descuento cupón</Text>
                  <Text style={{ color: '#10b981', fontWeight: 'bold' }}>
                    -{formatPrice((totales.total_precio + (domicilioSeleccionado?.precio || 0)) * cuponValidado.descuento / 100)}
                  </Text>
                </View>
              )}
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTopWidth: 2,
                borderTopColor: isDark ? '#1e293b' : '#fee2e2'
              }}>
                <Text className="text-lg font-bold text-red-900 dark:text-red-400">Total</Text>
                <Text className="text-lg font-bold text-red-600 dark:text-red-500">
                  {formatPrice(calcularTotalConDescuento())}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#dc2626',
                borderRadius: 15,
                padding: 18,
                marginTop: 20,
                alignItems: 'center',
                opacity: procesandoPedido ? 0.6 : 1,
              }}
              onPress={procesarPedido}
              disabled={procesandoPedido}
            >
              {procesandoPedido ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  🛒 Procesar pedido
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: '#ef4444',
                borderRadius: 15,
                padding: 15,
                marginTop: 10,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#dc2626',
              }}
              onPress={vaciarCarrito}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                🗑️ Vaciar carrito
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showConfetti && (
        <ConfettiEffect onComplete={() => setShowConfetti(false)} />
      )}
    </View>
  );
}

