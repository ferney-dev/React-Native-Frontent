import { useEffect, useRef } from 'react';
import { PanResponder, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname } from 'expo-router';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos

export const useInactivity = () => {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = async () => {
    // Solo cerrar sesión si no estamos ya en login o registro
    if (pathname === '/login' || pathname === '/register' || pathname === '/auth') return;

    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return; // Ya está cerrada la sesión

      console.log('[Inactivity] Usuario inactivo por 15 min. Cerrando sesión...');
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      Alert.alert(
        'Sesión Caducada',
        'Tu sesión ha sido cerrada por inactividad.',
        [{ text: 'Aceptar', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      console.error('Error in auto-logout:', error);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
    })
  ).current;

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return { panResponder };
};
