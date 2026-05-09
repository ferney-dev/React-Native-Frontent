import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  Modal,
  FlatList,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';


import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { categoriasApi, productosApi, bannersApi, favoritosApi, carritoApi } from '../../services/api';
import { Categoria, Producto, Banner, Usuario } from '../../types';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '../../components/Skeleton';

import { AnimatedButton } from '../../components/AnimatedButton';

const { width } = Dimensions.get('window');



export default function HomeScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productosPopulares, setProductosPopulares] = useState<Producto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [user, setUser] = useState<Usuario | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [searchCategoria, setSearchCategoria] = useState('');
  const [paginaProductos, setPaginaProductos] = useState(0);
  const PRODUCTOS_POR_PAGINA = 8;




  useEffect(() => {
    const initialize = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      loadData();
    };
    initialize();
  }, []);


  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriasRes, productosRes, bannersRes] = await Promise.all([
        categoriasApi.getAll(),
        productosApi.getPopulares(),
        bannersApi.getAll()
      ]);

      if (categoriasRes.success) setCategorias(categoriasRes.data as Categoria[]);
      if (productosRes.success) setProductosPopulares(productosRes.data as Producto[]);
      if (bannersRes.success) setBanners(bannersRes.data as Banner[]);
      
      // Cargar favoritos del usuario si existe
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        await loadFavoritos(parsedUser.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };


  const loadFavoritos = async (userId: number) => {
    try {
      const favoritosRes = await favoritosApi.getByUsuario(userId.toString());
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

  const handleCategoriaPress = (categoria: Categoria) => {
    router.push({
      pathname: '/productos/[id]',
      params: { id: categoria.id?.toString() || '0' }
    });
  };

  const toggleFavorito = async (producto: Producto) => {
    if (!producto.id) return;
    
    try {
      if (!user?.id) {
        Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar favoritos');
        return;
      }
      await favoritosApi.toggle({
        id_usuario: user.id,
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
      if (!user?.id) {
        Alert.alert('Inicia sesión', 'Debes iniciar sesión para agregar al carrito');
        return;
      }
      await carritoApi.create({
        id_usuario: user.id,
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

  // Remuevo el loading block anterior para integrarlo en el render principal con Skeletons

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#fff5f5',
      }}
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      {/* HEADER */}
      <View
        style={{
          backgroundColor: '#b91c1c',
          paddingTop: 60,
          paddingBottom: 30,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 30,
                fontWeight: 'bold',
              }}
            >
              FoodExpress 🍟
            </Text>

            <Text
              style={{
                color: '#fecaca',
                marginTop: 6,
                fontSize: 15,
              }}
            >
              Pide tu comida favorita
            </Text>
          </View>

          <AnimatedButton
            haptic={Haptics.ImpactFeedbackStyle.Light}
            style={{
              backgroundColor: '#dc2626',
              width: 55,
              height: 55,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => router.push('/carrito')}
          >
            <Ionicons name="cart" size={28} color="#fff" />
          </AnimatedButton>

        </View>

        {/* ADMIN PANEL BUTTON (Visible only if rol === 2) */}
        {user?.rol === 2 && (
          <AnimatedButton
            haptic={Haptics.ImpactFeedbackStyle.Medium}
            style={{
              marginTop: 25,
              backgroundColor: 'rgba(255,255,255,0.15)',
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
            onPress={() => router.push('/admin')}
          >
            <View style={{
              backgroundColor: '#fff',
              width: 40,
              height: 40,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15
            }}>
              <Ionicons name="shield-checkmark" size={24} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Panel de Administración</Text>
              <Text style={{ color: '#fecaca', fontSize: 12 }}>Gestionar productos, pedidos y más</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" opacity={0.7} />
          </AnimatedButton>

        )}
      </View>





      {/* CARROUSEL DE BANNERS DINÁMICO */}
      <View style={{ marginTop: 20 }}>
        {loading ? (
          <View style={{ marginHorizontal: 20 }}>
            <Skeleton width={width - 40} height={180} borderRadius={30} />
          </View>
        ) : banners.length > 0 ? (
          <View>
            <FlatList
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveBannerIndex(index);
              }}
              keyExtractor={(item) => item.id?.toString() || item.titulo}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: width - 40,
                    marginHorizontal: 20,
                    backgroundColor: item.color || '#ef4444',
                    borderRadius: 30,
                    padding: 25,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 180,
                    shadowColor: item.color || '#ef4444',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                    elevation: 10,
                  }}
                >
                  <View style={{ width: '65%' }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 26,
                        fontWeight: '800',
                        textShadowColor: 'rgba(0,0,0,0.1)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 5,
                      }}
                    >
                      {item.titulo}
                    </Text>

                    <Text
                      style={{
                        color: '#fff',
                        opacity: 0.9,
                        marginTop: 10,
                        fontSize: 15,
                        lineHeight: 20,
                      }}
                    >
                      {item.descripcion}
                    </Text>

                    <TouchableOpacity
                      style={{
                        backgroundColor: '#fff',
                        marginTop: 20,
                        paddingVertical: 12,
                        borderRadius: 16,
                        width: 130,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 5,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          color: item.color || '#dc2626',
                          fontWeight: 'bold',
                          fontSize: 15,
                        }}
                      >
                        Ver Oferta
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {item.imagen ? (
                    <Image 
                      source={{ uri: item.imagen }} 
                      style={{ width: 100, height: 100, borderRadius: 20 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 75, opacity: 0.9 }}>🔥</Text>
                  )}
                </View>
              )}
            />
            
            {/* INDICADORES (DOTS) */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center', 
              marginTop: 15,
              gap: 8 
            }}>
              {banners.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: activeBannerIndex === i ? 25 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: activeBannerIndex === i ? '#dc2626' : '#d1d5db',
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>


      {/* BUSCADOR DE CATEGORÍAS (DEBAJO DEL CARRUSEL) */}
      <View style={{ 
        marginHorizontal: 20, 
        marginTop: 25, 
        backgroundColor: '#fff',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f3f4f6'
      }}>
        <View style={{ 
          backgroundColor: '#fee2e2', 
          width: 38, height: 38, 
          borderRadius: 12, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: 12
        }}>
          <Ionicons name="search" size={20} color="#dc2626" />
        </View>
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: '#1f2937',
            fontWeight: '500'
          }}
          placeholder="Busca por categorías..."
          placeholderTextColor="#9ca3af"
          value={searchCategoria}
          onChangeText={setSearchCategoria}
        />
        {searchCategoria.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchCategoria('')}
            style={{ padding: 5 }}
          >
            <Ionicons name="close-circle" size={20} color="#d1d5db" />
          </TouchableOpacity>
        )}
      </View>


      {/* FILTROS RÁPIDOS (CHIPS) */}
      <View style={{ marginTop: 15 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          {[
            { id: 1, label: '🔥 Ofertas', color: '#dc2626' },
            { id: 2, label: '⭐ Populares', color: '#f59e0b' },
            { id: 3, label: '🚚 Envío Gratis', color: '#10b981' },
            { id: 4, label: '🍔 Combos', color: '#8b5cf6' },
            { id: 5, label: '🥗 Saludable', color: '#06b6d4' },
          ].map((chip) => (
            <AnimatedButton
              key={chip.id}
              haptic={Haptics.ImpactFeedbackStyle.Light}
              style={{
                backgroundColor: '#fff',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#f3f4f6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 2
              }}
            >
              <Text style={{ 
                color: '#4b5563', 
                fontWeight: '600', 
                fontSize: 14 
              }}>
                {chip.label}
              </Text>
            </AnimatedButton>
          ))}
        </ScrollView>
      </View>

      <View
        style={{
          marginTop: 25,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: '#7f1d1d',
            marginBottom: 15,
          }}
        >
          Categorías
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ marginRight: 18, alignItems: 'center' }}>
                <Skeleton width={80} height={80} borderRadius={40} />
                <Skeleton width={60} height={12} borderRadius={6} style={{ marginTop: 8 }} />
              </View>
            ))
          ) : (
            categorias
              .filter(c => c.nombre.toLowerCase().includes(searchCategoria.toLowerCase()))
              .map((categoria) => (
              <AnimatedButton
                key={categoria.id}
                haptic={Haptics.ImpactFeedbackStyle.Light}
                style={{
                  marginRight: 18,
                  alignItems: 'center',
                }}
                onPress={() => handleCategoriaPress(categoria)}
              >
                <View style={{
                  backgroundColor: '#fff',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: categoria.color || '#dc2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  borderWidth: 2,
                  borderColor: '#fff'
                }}>
                  <MaterialCommunityIcons
                    name={categoria.icono as any}
                    size={36}
                    color={categoria.color || '#dc2626'}
                  />
                </View>

                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: '700',
                    color: '#374151',
                    fontSize: 12
                  }}
                >
                  {categoria.nombre}
                </Text>
              </AnimatedButton>
            ))
          )}
          {!loading && categorias.filter(c => c.nombre.toLowerCase().includes(searchCategoria.toLowerCase())).length === 0 && (
             <Text style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 30 }}>No se encontraron categorías</Text>
          )}
        </ScrollView>

      </View>


      {/* PRODUCTOS POPULARES PAGINADOS */}
      <View
        style={{
          marginTop: 30,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: '#7f1d1d',
            }}
          >
            Productos populares
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
             <TouchableOpacity 
               onPress={() => setPaginaProductos(Math.max(0, paginaProductos - 1))}
               disabled={paginaProductos === 0}
               style={{
                 width: 35, height: 35, borderRadius: 10,
                 backgroundColor: paginaProductos === 0 ? '#e5e7eb' : '#dc262620',
                 justifyContent: 'center', alignItems: 'center'
               }}
             >
               <Ionicons name="chevron-back" size={20} color={paginaProductos === 0 ? '#9ca3af' : '#dc2626'} />
             </TouchableOpacity>
             
             <TouchableOpacity 
               onPress={() => {
                 if ((paginaProductos + 1) * PRODUCTOS_POR_PAGINA < productosPopulares.length) {
                   setPaginaProductos(paginaProductos + 1);
                 }
               }}
               disabled={(paginaProductos + 1) * PRODUCTOS_POR_PAGINA >= productosPopulares.length}
               style={{
                 width: 35, height: 35, borderRadius: 10,
                 backgroundColor: (paginaProductos + 1) * PRODUCTOS_POR_PAGINA >= productosPopulares.length ? '#e5e7eb' : '#dc262620',
                 justifyContent: 'center', alignItems: 'center'
               }}
             >
               <Ionicons name="chevron-forward" size={20} color={(paginaProductos + 1) * PRODUCTOS_POR_PAGINA >= productosPopulares.length ? '#9ca3af' : '#dc2626'} />
             </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={{ 
              backgroundColor: '#fff', 
              borderRadius: 25, 
              padding: 18, 
              marginBottom: 18, 
              flexDirection: 'row', 
              alignItems: 'center' 
            }}>
              <Skeleton width={85} height={85} borderRadius={22} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Skeleton width="60%" height={20} borderRadius={10} />
                <Skeleton width="80%" height={14} borderRadius={7} style={{ marginTop: 8 }} />
                <Skeleton width="30%" height={22} borderRadius={11} style={{ marginTop: 12 }} />
              </View>
            </View>
          ))
        ) : (
          productosPopulares
            .slice(paginaProductos * PRODUCTOS_POR_PAGINA, (paginaProductos + 1) * PRODUCTOS_POR_PAGINA)
            .map((producto: Producto) => (
            <AnimatedButton
              key={producto.id?.toString() || producto.nombre}
              haptic={Haptics.ImpactFeedbackStyle.Light}
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
              onPress={() => producto.id && router.push({ pathname: '/producto/[id]', params: { id: producto.id.toString() } })}
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
                <Text style={{ fontSize: 45 }}>{producto.emoji}</Text>
              </View>

              {/* INFO */}
              <View
                style={{
                  flex: 1,
                  marginLeft: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#111827',
                  }}
                >
                  {producto.nombre}
                </Text>

                <Text
                  style={{
                    color: '#6b7280',
                    marginTop: 5,
                    fontSize: 13,
                  }}
                >
                  {producto.descripcion}
                </Text>

                <Text
                  style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    marginTop: 10,
                    fontSize: 18,
                  }}
                >
                  {formatPrice(producto.precio)}
                </Text>
              </View>

              {/* BOTONES */}
              <View style={{ alignItems: 'center' }}>
                <AnimatedButton
                  haptic={Haptics.ImpactFeedbackStyle.Medium}
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
                </AnimatedButton>
                
                <AnimatedButton
                  haptic={Haptics.ImpactFeedbackStyle.Light}
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
                </AnimatedButton>
              </View>
            </AnimatedButton>
          ))
        )}

      </View>


     
    </ScrollView>
  );
}