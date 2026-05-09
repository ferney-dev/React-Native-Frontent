import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function AdminScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const adminOptions = [
    { id: 1, title: 'Gestionar Productos', icon: 'fast-food', color: '#dc2626', route: '/admin/productos' },
    { id: 2, title: 'Gestionar Categorías', icon: 'list', color: '#2563eb', route: '/admin/categorias' },
    { id: 3, title: 'Ver Pedidos', icon: 'cart', color: '#16a34a', route: '/admin/pedidos' },
    { id: 4, title: 'Usuarios Registrados', icon: 'people', color: '#9333ea', route: '/admin/usuarios' },
    { id: 5, title: 'Banners y Ofertas', icon: 'megaphone', color: '#ea580c', route: '/admin/banners' },
    { id: 6, title: 'Estadísticas', icon: 'stats-chart', color: '#0891b2', route: '/admin/stats' },
  ];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e293b'] : ['#b91c1c', '#dc2626']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <Text style={styles.headerSubtitle}>Gestiona tu restaurante</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {adminOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={[styles.card, isDark && styles.cardDark]}
              onPress={() => router.push(option.route as any)}
            >
 
              <View style={[styles.iconContainer, { backgroundColor: isDark ? option.color + '30' : option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={32} color={option.color} />
              </View>
              <Text style={[styles.cardTitle, isDark && styles.textDark]}>{option.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#4b5563" : "#9ca3af"} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, isDark && styles.logoutBtnDark]}
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutTxt}>Cerrar Sesión Administrativa</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#fecaca', marginTop: 5 },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  grid: { gap: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1f2937' },
  logoutBtn: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fff',
    gap: 10
  },
  logoutTxt: { color: '#dc2626', fontSize: 16, fontWeight: '700' },

  // Dark styles
  containerDark: { backgroundColor: '#020617' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1 },
  textDark: { color: '#f8fafc' },
  logoutBtnDark: { backgroundColor: '#0f172a', borderColor: '#1e1b1b' },
});
