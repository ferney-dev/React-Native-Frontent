import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productosApi, categoriasApi, favoritosApi, carritoApi } from '../../services/api';
import { Producto, Categoria } from '../../types';

export default function ProductosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<number[]>([]);

  useEffect(() => {
    loadProductos();
    loadFavoritos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const categoriaId = params.id as string;
      
      let productosRes;
      if (categoriaId && categoriaId !== '0') {
        // Cargar productos por categoría
        productosRes = await productosApi.getByCategoria(categoriaId);
        
        // También cargar información de la categoría
        const categoriaRes = await categoriasApi.getById(categoriaId);
        if (categoriaRes.success) {
          setCategoria(categoriaRes.data as Categoria);
        }
      } else {
        // Cargar todos los productos disponibles
        productosRes = await productosApi.getDisponibles();
      }
      
      if (productosRes.success) {
        setProductos(productosRes.data as Producto[]);
      }
    } catch (error) {
      console.error('Error loading productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritos = async () => {
    try {
      const idUsuario = '1';
      const favoritosRes = await favoritosApi.getByUsuario(idUsuario);
      if (favoritosRes.success) {
        const favIds = (favoritosRes.data as any[]).map((fav: any) => fav.id_producto);
        setFavoritos(favIds);
      }
    } catch (error) {
      console.error('Error loading favoritos:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  const toggleFavorito = async (producto: Producto) => {
    if (!producto.id) return;
    
    try {
      const idUsuario = '1';
      await favoritosApi.toggle({
        id_usuario: parseInt(idUsuario),
        id_producto: producto.id
      });
      
      // Actualizar lista de favoritos
      if (favoritos.includes(producto.id)) {
        setFavoritos(favoritos.filter(id => id !== producto.id));
        Alert.alert('✅ Eliminado', `${producto.nombre} se ha eliminado de tus favoritos`);
      } else {
        setFavoritos([...favoritos, producto.id]);
        Alert.alert('❤️ Agregado', `${producto.nombre} se ha agregado a tus favoritos`);
      }
    } catch (error) {
      console.error('Error toggling favorito:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    }
  };

  const agregarAlCarrito = async (producto: Producto) => {
    if (!producto.id) return;
    
    try {
      const idUsuario = '1';
      await carritoApi.create({
        id_usuario: parseInt(idUsuario),
        id_producto: producto.id,
        cantidad: 1,
        precio: producto.precio
      });
      
      Alert.alert(
        '🛒 Producto agregado',
        `${producto.nombre} se ha agregado al carrito`,
        [
          { text: 'Seguir comprando', style: 'cancel' },
          { text: 'Ver carrito', onPress: () => router.push('/carrito') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'No se pudo agregar el producto al carrito');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff5f5' }}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ marginTop: 10, color: '#7f1d1d' }}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff5f5' }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: '#b91c1c',
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 'bold',
              marginLeft: 15,
              flex: 1,
            }}
          >
            {categoria?.nombre || 'Todos los productos'} ({productos.length})
          </Text>
        </View>
      </View>

      {/* PRODUCTOS */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {productos.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 18, color: '#6b7280' }}>
              No hay productos disponibles
            </Text>
          </View>
        ) : (
          productos.map((producto) => (
            <View
              key={producto.id?.toString() || producto.nombre}
              style={{
                backgroundColor: '#fff',
                borderRadius: 25,
                padding: 18,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {/* IMAGEN/EMOJI */}
              <View
                style={{
                  width: 85,
                  height: 85,
                  borderRadius: 22,
                  backgroundColor: '#fee2e2',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 45 }}>{producto.emoji || '🍽️'}</Text>
              </View>

              {/* INFO */}
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#111827',
                  }}
                >
                  {producto.nombre}
                </Text>

                {producto.descripcion && (
                  <Text
                    style={{
                      color: '#6b7280',
                      marginTop: 5,
                      fontSize: 13,
                    }}
                  >
                    {producto.descripcion}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text
                    style={{
                      color: '#dc2626',
                      fontWeight: 'bold',
                      fontSize: 18,
                    }}
                  >
                    {formatPrice(producto.precio)}
                  </Text>
                  
                  {producto.descuento > 0 && (
                    <View style={{ marginLeft: 8 }}>
                      <Text style={{ 
                        color: '#ef4444', 
                        fontSize: 12, 
                        textDecorationLine: 'line-through' 
                      }}>
                        {formatPrice(producto.precio * (1 + producto.descuento / 100))}
                      </Text>
                      <Text style={{ 
                        color: '#10b981', 
                        fontSize: 11, 
                        fontWeight: 'bold' 
                      }}>
                        -{producto.descuento}%
                      </Text>
                    </View>
                  )}
                </View>

                {producto.categoria_nombre && (
                  <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 5 }}>
                    {producto.categoria_nombre}
                  </Text>
                )}
              </View>

              {/* BOTONES */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#dc2626',
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                  onPress={() => agregarAlCarrito(producto)}
                >
                  <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fee2e2',
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => toggleFavorito(producto)}
                >
                  <Ionicons 
                    name={favoritos.includes(producto.id || 0) ? "heart" : "heart-outline"} 
                    size={24} 
                    color={favoritos.includes(producto.id || 0) ? "#dc2626" : "#dc2626"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
