import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { productosApi, favoritosApi, carritoApi } from '../../services/api';
import { Producto } from '../../types';

export default function OfertasScreen() {
  const router = useRouter();
  const [productosOferta, setProductosOferta] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<number[]>([]);

  useEffect(() => {
    loadOfertas();
    loadFavoritos();
  }, []);

  const loadOfertas = async () => {
    try {
      setLoading(true);
      // Cargar todos los productos disponibles y filtrar los que tienen descuento
      const productosRes = await productosApi.getDisponibles();
      
      if (productosRes.success) {
        const productos = productosRes.data as Producto[];
        const conDescuento = productos.filter(producto => producto.descuento > 0);
        setProductosOferta(conDescuento);
      }
    } catch (error) {
      console.error('Error loading ofertas:', error);
      Alert.alert('Error', 'No se pudieron cargar las ofertas');
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
        <Text style={{ marginTop: 10, color: '#7f1d1d' }}>Cargando ofertas...</Text>
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
        <Text
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          Ofertas Especiales 🔥
        </Text>
        
        <Text
          style={{
            color: '#fecaca',
            marginTop: 5,
            fontSize: 14,
          }}
        >
          {productosOferta.length} {productosOferta.length === 1 ? 'producto' : 'productos'} en descuento
        </Text>
      </View>

      {/* PRODUCTOS EN OFERTA */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {productosOferta.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="pricetag-outline" size={80} color="#d1d5db" />
            <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 20, textAlign: 'center' }}>
              No hay ofertas disponibles
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
              Vuelve pronto para ver nuestras promociones
            </Text>
          </View>
        ) : (
          productosOferta.map((producto) => (
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
              {/* EMOJI */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#111827',
                      flex: 1,
                    }}
                  >
                    {producto.nombre}
                  </Text>
                  
                  <View style={{
                    backgroundColor: '#10b981',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginLeft: 10
                  }}>
                    <Text style={{ 
                      color: '#fff', 
                      fontSize: 12, 
                      fontWeight: 'bold' 
                    }}>
                      -{producto.descuento}%
                    </Text>
                  </View>
                </View>

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
                  
                  <Text style={{ 
                    color: '#ef4444', 
                    fontSize: 12, 
                    textDecorationLine: 'line-through',
                    marginLeft: 8 
                  }}>
                    {formatPrice(producto.precio * (1 + producto.descuento / 100))}
                  </Text>
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