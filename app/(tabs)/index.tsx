import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Image, Modal,FlatList,Dimensions,TextInput,Alert,ActivityIndicator,useColorScheme,} from 'react-native';
import {Ionicons,MaterialCommunityIcons,FontAwesome5,} from '@expo/vector-icons';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  
useEffect(() => {
  if (banners.length === 0) return;

  const interval = setInterval(() => {
    const nextIndex =
      activeBannerIndex === banners.length - 1
        ? 0
        : activeBannerIndex + 1;

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setActiveBannerIndex(nextIndex);
  }, 5000);

  return () => clearInterval(interval);
}, [activeBannerIndex, banners]);



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
      className="flex-1 bg-[#fff5f5] dark:bg-slate-950"
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      {/* HEADER */}
      <View
        className="bg-[#b91c1c] dark:bg-slate-900 pt-[60px] pb-[30px] px-5 rounded-b-[30px]"
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
            className="bg-[#dc2626] dark:bg-slate-800 w-[55px] h-[55px] rounded-full justify-center items-center"
            onPress={() => router.push('/carrito')}
          >
            <Ionicons name="cart" size={28} color="#fff" />
          </AnimatedButton>

        </View>

        {/* ADMIN PANEL BUTTON (Visible only if rol === 2) */}
        {user?.rol === 2 && (
          <AnimatedButton
            haptic={Haptics.ImpactFeedbackStyle.Medium}
            className="mt-6 bg-white/15 dark:bg-white/5 py-[15px] px-5 rounded-[20px] flex-row items-center border border-white/30 dark:border-white/10"
            onPress={() => router.push('/admin')}
          >
            <View className="bg-white dark:bg-slate-800 w-10 h-10 rounded-xl justify-center items-center mr-[15px]">
              <Ionicons name="shield-checkmark" size={24} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-white text-base font-bold">Panel de Administración</Text>
              <Text className="text-red-100 dark:text-gray-400 text-[12px]">Gestionar productos, pedidos y más</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" opacity={0.7} />
          </AnimatedButton>

        )}
      </View>





   
{/* CARROUSEL DE BANNERS */}
<View style={{ marginTop: 20 }}>
  {loading ? (
    <View style={{ paddingHorizontal: 16 }}>
      <Skeleton
        width={width - 32}
        height={190}
        borderRadius={28}
      />
    </View>
  ) : banners.length > 0 ? (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id?.toString() || item.titulo}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );

          setActiveBannerIndex(index);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: width,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                width: '100%',
                minHeight: 190,

                backgroundColor: item.color || '#ef4444',

                borderRadius: 28,

                paddingHorizontal: 20,
                paddingVertical: 20,

                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',

                overflow: 'hidden',

                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {/* TEXTO */}
              <View
                style={{
                  flex: 1,
                  paddingRight: 10,
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: '800',
                  }}
                >
                  {item.titulo}
                </Text>

                <Text
                  numberOfLines={3}
                  style={{
                    color: '#fff',
                    opacity: 0.9,
                    marginTop: 10,
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                >
                  {item.descripcion}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isDark
                      ? '#0f172a'
                      : '#ffffff',

                    marginTop: 18,

                    alignSelf: 'flex-start',

                    paddingHorizontal: 18,
                    paddingVertical: 11,

                    borderRadius: 15,
                  }}
                >
                  <Text
                    style={{
                      color: isDark
                        ? '#ffffff'
                        : item.color || '#dc2626',

                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    Ver oferta
                  </Text>
                </TouchableOpacity>
              </View>

              {/* IMAGEN */}
              <View
                style={{
                  width: 110,
                  height: 110,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {item.imagen ? (
                  <Image
                    source={{ uri: item.imagen }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 20,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 65,
                    }}
                  >
                    🔥
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* INDICADORES */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',

          marginTop: 14,
        }}
      >
        {banners.map((_, i) => (
          <View
            key={i}
            style={{
              width: activeBannerIndex === i ? 24 : 8,
              height: 8,

              borderRadius: 20,

              marginHorizontal: 4,

              backgroundColor:
                activeBannerIndex === i
                  ? '#dc2626'
                  : isDark
                  ? '#334155'
                  : '#d1d5db',
            }}
          />
        ))}
      </View>
    </View>
  ) : null}
</View>


      {/* BUSCADOR DE CATEGORÍAS (DEBAJO DEL CARRUSEL) */}
      <View 
        className="mx-5 mt-6 bg-white dark:bg-slate-900 rounded-3xl flex-row items-center px-[18px] h-[60px] shadow-sm border border-gray-100 dark:border-slate-800"
      >
        <View className="bg-red-100 dark:bg-red-900/30 w-[38px] h-[38px] rounded-xl justify-center items-center mr-3">
          <Ionicons name="search" size={20} color="#dc2626" />
        </View>
        <TextInput
          className="flex-1 text-[15px] text-gray-800 dark:text-gray-100 font-medium"
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
              className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl flex-row items-center border border-gray-100 dark:border-slate-800 shadow-sm"
            >
              <Text className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
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
          className="text-[22px] font-bold text-red-900 dark:text-red-400 mb-[15px]"
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
                <View 
                  className="bg-white dark:bg-slate-900 w-20 h-20 rounded-full justify-center items-center shadow-md border-2 border-white dark:border-slate-800"
                >
                  <MaterialCommunityIcons
                    name={categoria.icono as any}
                    size={36}
                    color={categoria.color || '#dc2626'}
                  />
                </View>

                <Text
                  className="mt-2 font-bold text-gray-700 dark:text-gray-300 text-[12px]"
                >
                  {categoria.nombre}
                </Text>
              </AnimatedButton>
            ))
          )}
          {!loading && categorias.filter(c => c.nombre.toLowerCase().includes(searchCategoria.toLowerCase())).length === 0 && (
             <Text style={{ color: isDark ? '#4b5563' : '#9ca3af', fontStyle: 'italic', marginTop: 30 }}>No se encontraron categorías</Text>
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
            className="text-[22px] font-bold text-red-900 dark:text-red-400"
          >
            Productos populares
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 10 }}>
             <TouchableOpacity 
               onPress={() => setPaginaProductos(Math.max(0, paginaProductos - 1))}
               disabled={paginaProductos === 0}
               style={{
                 width: 35, height: 35, borderRadius: 10,
                 backgroundColor: paginaProductos === 0 
                   ? (isDark ? '#1e293b' : '#e5e7eb') 
                   : (isDark ? '#dc262630' : '#dc262620'),
                 justifyContent: 'center', alignItems: 'center'
               }}
             >
               <Ionicons name="chevron-back" size={20} color={paginaProductos === 0 ? (isDark ? '#4b5563' : '#9ca3af') : '#dc2626'} />
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
                 backgroundColor: (paginaProductos + 1) * PRODUCTOS_POR_PAGINA >= productosPopulares.length 
                   ? (isDark ? '#1e293b' : '#e5e7eb') 
                   : (isDark ? '#dc262630' : '#dc262620'),
                 justifyContent: 'center', alignItems: 'center'
               }}
             >
               <Ionicons name="chevron-forward" size={20} color={(paginaProductos + 1) * PRODUCTOS_POR_PAGINA >= productosPopulares.length ? (isDark ? '#4b5563' : '#9ca3af') : '#dc2626'} />
             </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={{ 
              backgroundColor: isDark ? '#0f172a' : '#fff', 
              borderRadius: 25, 
              padding: 18, 
              marginBottom: 18, 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? '#1e293b' : 'transparent',
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
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-4 flex-row items-center shadow-sm border border-gray-50 dark:border-slate-800"
              onPress={() => producto.id && router.push({ pathname: '/producto/[id]', params: { id: producto.id.toString() } })}
            >
              {/* EMOJI */}
              <View
                className="w-[85px] h-[85px] rounded-2xl bg-red-50 dark:bg-red-900/20 justify-center items-center"
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
                  className="text-lg font-bold text-gray-900 dark:text-gray-100"
                >
                  {producto.nombre}
                </Text>

                <Text
                  className="text-gray-500 dark:text-gray-400 mt-1 text-[13px]"
                >
                  {producto.descripcion}
                </Text>

                <Text
                  className="text-red-600 dark:text-red-500 font-bold mt-2 text-lg"
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
                  className="bg-red-50 dark:bg-red-900/20 w-[50px] h-[50px] rounded-2xl justify-center items-center"
                  onPress={() => toggleFavorito(producto)}
                >
                  <Ionicons 
                    name={favoritos.includes(producto.id || 0) ? "heart" : "heart-outline"} 
                    size={24} 
                    color="#dc2626" 
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