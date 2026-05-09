import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInactivity } from '@/hooks/useInactivity';
import { View } from 'react-native';


// La app siempre inicia en 'auth', que verifica si hay sesión guardada
export const unstable_settings = {
  initialRouteName: 'auth',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { panResponder } = useInactivity();


  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Stack initialRouteName="auth">
          {/* Pantalla de verificación de sesión - siempre es la primera */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          {/* Autenticación */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          {/* App principal - solo accesible tras login */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="producto/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="carrito" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ headerShown: false }} />
          <Stack.Screen name="admin/productos" options={{ headerShown: false }} />
          <Stack.Screen name="admin/categorias" options={{ headerShown: false }} />
          <Stack.Screen name="admin/pedidos" options={{ headerShown: false }} />
          <Stack.Screen name="admin/usuarios" options={{ headerShown: false }} />
          <Stack.Screen name="admin/banners" options={{ headerShown: false }} />
          <Stack.Screen name="admin/stats" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />


        </Stack>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

