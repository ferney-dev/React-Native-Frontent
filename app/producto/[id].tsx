import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productosApi, favoritosApi, carritoApi } from '../../services/api';
import { showAlert } from '../../services/alerts';
import { Producto, Usuario } from '../../types';

const { width, height } = Dimensions.get('window');

export default function ProductoDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [productosRelacionados, setProductosRelacionados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelacionados, setLoadingRelacionados] = useState(true);
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          loadFavoritos(parsedUser.id);
        }
        loadProductoDetalle();
      } catch (err) {
        console.error('Error initializing:', err);
      }
    };
    initialize();
  }, [params.id]);

  const loadProductoDetalle = async () => {
    try {
      setLoading(true);
      const productoId = params.id as string;
      const productoRes = await productosApi.getById(productoId);
      
      if (productoRes.success) {
        setProducto(productoRes.data as Producto);
        if (productoRes.data && (productoRes.data as Producto).id_categoria) {
          loadProductosRelacionados((productoRes.data as Producto).id_categoria);
        }
      } else {
        showAlert('Error', 'No se pudo cargar el producto', 'error');
        router.back();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      showAlert('Error', 'No se pudo cargar el producto', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadProductosRelacionados = async (categoriaId: number) => {
    try {
      setLoadingRelacionados(true);
      const relacionadosRes = await productosApi.getByCategoria(categoriaId.toString());
      if (relacionadosRes.success) {
        const productos = relacionadosRes.data as Producto[];
        const currentId = parseInt(params.id as string);
        const relacionados = productos
          .filter(p => p.id !== currentId)
          .slice(0, 6);
        setProductosRelacionados(relacionados);
      }
    } catch (error) {
      console.error('Error related:', error);
    } finally {
      setLoadingRelacionados(false);
    }
  };

  const loadFavoritos = async (userId: number) => {
    try {
      const favoritosRes = await favoritosApi.getByUsuario(userId.toString());
      if (favoritosRes.success) {
        const favs = (favoritosRes.data as any[]).map(f => f.id_producto);
        setFavoritos(favs);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorito = async (productoId: number) => {
    if (!user?.id) {
      showAlert('Inicia sesión', 'Debes iniciar sesión para guardar favoritos', 'warning');
      return;
    }
    try {
      await favoritosApi.toggle({ id_usuario: user.id, id_producto: productoId });
      if (favoritos.includes(productoId)) {
        setFavoritos(favoritos.filter(id => id !== productoId));
      } else {
        setFavoritos([...favoritos, productoId]);
      }
    } catch (error) {
      showAlert('Error', 'No se pudo actualizar favoritos', 'error');
    }
  };

  const agregarAlCarrito = async () => {
    if (!producto || !producto.id) return;
    if (!user?.id) {
      showAlert('Inicia sesión', 'Debes iniciar sesión para comprar', 'warning');
      return;
    }
    try {
      setLoading(true);
      await carritoApi.create({
        id_usuario: user.id,
        id_producto: producto.id,
        cantidad: cantidad,
        precio: producto.precio
      });
      showAlert('¡Agregado! 🛒', `${cantidad} ${producto.nombre} agregado(s) al carrito`, 'success');
    } catch (error) {
      showAlert('Error', 'No se pudo agregar al carrito', 'error');
    } finally {
      setLoading(false);
    }
  };

  const goToProducto = (productoId: number) => {
    router.push({ pathname: '/producto/[id]', params: { id: productoId.toString() } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!producto) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Section */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: producto.imagen || 'https://via.placeholder.com/600x400' }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roundBtn, favoritos.includes(producto.id || 0) && styles.activeFav]} 
              onPress={() => producto.id && toggleFavorito(producto.id)}
            >
              <Ionicons 
                name={producto.id && favoritos.includes(producto.id) ? "heart" : "heart-outline"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeEmoji}>{producto.emoji || '🍕'}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryName}>{producto.categoria_nombre || 'Especialidad'}</Text>
              <Text style={styles.productName}>{producto.nombre}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceSymbol}>$</Text>
              <Text style={styles.priceValue}>{Number(producto.precio).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.productDescription}>{producto.descripcion}</Text>

          <View style={styles.optionsRow}>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={styles.qtyBtn}
                onPress={() => setCantidad(Math.max(1, cantidad - 1))}
              >
                <Ionicons name="remove" size={20} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{cantidad}</Text>
              <TouchableOpacity 
                style={styles.qtyBtn}
                onPress={() => setCantidad(cantidad + 1)}
              >
                <Ionicons name="add" size={20} color="#1f2937" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.deliveryInfo}>
              <Ionicons name="time-outline" size={18} color="#dc2626" />
              <Text style={styles.deliveryText}> 20-35 min</Text>
            </View>
          </View>

          {/* Related Section */}
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>Te puede gustar</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Ver más</Text>
              </TouchableOpacity>
            </View>
            
            {loadingRelacionados ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                {productosRelacionados.map((relacionado) => (
                  <TouchableOpacity
                    key={relacionado.id}
                    style={styles.relatedCard}
                    onPress={() => relacionado.id && goToProducto(relacionado.id)}
                  >
                    <Image 
                      source={{ uri: relacionado.imagen || 'https://via.placeholder.com/150' }} 
                      style={styles.relatedImage}
                    />
                    <View style={styles.relatedBadge}>
                      <Text style={styles.relatedBadgeText}>{relacionado.emoji || '🍔'}</Text>
                    </View>
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedName} numberOfLines={1}>{relacionado.nombre}</Text>
                      <Text style={styles.relatedPrice}>${Number(relacionado.precio).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${(Number(producto.precio) * cantidad).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.mainActionBtn} onPress={agregarAlCarrito}>
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.mainActionTxt}>Añadir al Carrito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageContainer: { height: height * 0.4, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerActions: {
    position: 'absolute', top: 50, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between'
  },
  roundBtn: {
    width: 45, height: 45, borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  activeFav: { backgroundColor: '#dc2626' },
  badgeContainer: {
    position: 'absolute', bottom: -25, right: 25,
    width: 65, height: 65, borderRadius: 33, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6
  },
  badgeEmoji: { fontSize: 32 },
  content: { padding: 25, paddingTop: 35 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryName: { color: '#dc2626', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  productName: { fontSize: 28, fontWeight: '900', color: '#111827', marginTop: 4 },
  priceTag: { backgroundColor: '#fef2f2', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, alignItems: 'center' },
  priceSymbol: { fontSize: 13, color: '#dc2626', fontWeight: 'bold' },
  priceValue: { fontSize: 22, fontWeight: '900', color: '#dc2626' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 25 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  productDescription: { fontSize: 16, color: '#6b7280', lineHeight: 26, marginBottom: 25 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  quantityControl: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 18, padding: 6, borderWidth: 1, borderColor: '#f1f5f9'
  },
  qtyBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 20, fontWeight: '700', marginHorizontal: 18, color: '#1f2937' },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center' },
  deliveryText: { fontSize: 15, fontWeight: '600', color: '#4b5563' },
  relatedSection: { marginTop: 15 },
  relatedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  relatedTitle: { fontSize: 19, fontWeight: '800', color: '#1f2937' },
  seeAll: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  relatedScroll: { overflow: 'visible' },
  relatedCard: {
    width: 150, marginRight: 18, backgroundColor: '#fff', borderRadius: 22,
    padding: 10, borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3
  },
  relatedImage: { width: '100%', height: 110, borderRadius: 16, marginBottom: 12 },
  relatedBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', borderRadius: 12, padding: 5, elevation: 2 },
  relatedBadgeText: { fontSize: 14 },
  relatedInfo: { paddingHorizontal: 4 },
  relatedName: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
  relatedPrice: { fontSize: 15, fontWeight: '800', color: '#dc2626' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 25, paddingBottom: 40,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#f1f5f9', borderTopLeftRadius: 35, borderTopRightRadius: 35,
    shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 15
  },
  totalContainer: { flex: 1 },
  totalLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  totalValue: { fontSize: 26, fontWeight: '900', color: '#111827' },
  mainActionBtn: {
    backgroundColor: '#dc2626', paddingHorizontal: 28, paddingVertical: 18,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
  },
  mainActionTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 17, color: '#6b7280', fontWeight: '500' }
});
