import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swal from 'sweetalert2';
import { favoritosApi } from '../../services/api';
import { Favorito, Usuario } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Favoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadFavoritos(parsedUser.id);
      } else {
        setLoading(false);
      }
    };
    initialize();
  }, []);


  const loadFavoritos = async (userId?: number) => {
    const idToUse = userId || user?.id;
    if (!idToUse) return;
    
    try {
      setLoading(true);
      const favoritosRes = await favoritosApi.getByUsuario(idToUse.toString());
      
      if (favoritosRes.success) {
        setFavoritos(favoritosRes.data as Favorito[]);
      }
    } catch (error) {
      console.error('Error loading favoritos:', error);
      Alert.alert('Error', 'No se pudieron cargar los favoritos');
    } finally {
      setLoading(false);
    }
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  };

  const removeFromFavoritos = async (id: number) => {
    if (!user?.id) return;
    try {
      await favoritosApi.removeFavorito(user.id.toString(), id.toString());
      loadFavoritos(user.id); // Recargar la lista

      
      Swal.fire({
        icon: 'success',
        title: 'Eliminado de favoritos',
        text: 'El producto se ha eliminado de tus favoritos',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error removing from favoritos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar de favoritos',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff5f5' }}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ marginTop: 10, color: '#7f1d1d' }}>Cargando favoritos...</Text>
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
          Mis Favoritos ❤️
        </Text>
        
        <Text
          style={{
            color: '#fecaca',
            marginTop: 5,
            fontSize: 14,
          }}
        >
          {favoritos.length} {favoritos.length === 1 ? 'producto' : 'productos'} guardados
        </Text>
      </View>

      {/* FAVORITOS */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {favoritos.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="heart-outline" size={80} color="#d1d5db" />
            <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 20, textAlign: 'center' }}>
              No tienes productos favoritos aún
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
              Explora nuestros productos y añade tus favoritos
            </Text>
          </View>
        ) : (
          favoritos.map((favorito) => (
            <View
              key={favorito.id?.toString() || `${favorito.id_producto}`}
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
                <Text style={{ fontSize: 45 }}>{favorito.emoji || '🍽️'}</Text>
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
                  {favorito.producto_nombre}
                </Text>

                <Text
                  style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    fontSize: 18,
                    marginTop: 10,
                  }}
                >
                  {formatPrice(favorito.precio || 0)}
                </Text>
              </View>

              {/* BOTONES */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fee2e2',
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name="cart" size={24} color="#dc2626" />
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
                  onPress={() => favorito.id_producto && removeFromFavoritos(favorito.id_producto)}
                >
                  <Ionicons name="heart" size={24} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}