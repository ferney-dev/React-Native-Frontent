import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authApi } from '../services/api';
import { showAlert } from '../services/alerts';
import { useTheme } from '../context/ThemeContext';


const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [correo, setCorreo] = useState('');

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animaciones de entrada
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  // Anillo decorativo del logo
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade + slide al montar
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();

    // Rotación infinita del anillo decorativo
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const pressIn  = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();

  const handleLogin = async () => {
    if (!correo.trim() || !password.trim()) {
      showAlert('Campos incompletos', 'Por favor ingresa correo y contraseña', 'warning');
      return;
    }


    try {
      setLoading(true);
      const response = await authApi.login({ correo: correo.trim(), password: password.trim() });


      if (response.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        router.replace('/(tabs)');
      } else {
        showAlert('Acceso denegado', response.message || 'Correo o contraseña incorrectos', 'error');

      }
    } catch (error: any) {
      console.error('Login error:', error);
      showAlert(
        'Error de conexión',
        'No se pudo conectar al servidor.\n\n1. Verifica que el backend esté corriendo.\n2. Asegúrate que tu celular y PC estén en la misma red WiFi.\n3. Verifica que la IP en el archivo .env sea la correcta.',
        'error'
      );
    } finally {


      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#020617" : "#fff"} />

      {/* ── Decoraciones de fondo (sutiles, sobre blanco) ───────────── */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Puntos decorativos */}
      {[...Array(12)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.bgDot,
            {
              top:  (i % 4) * 90 + 20,
              left: Math.floor(i / 4) * (width / 3) + 18,
              opacity: 0.06 + (i % 3) * 0.015,
            },
          ]}
          pointerEvents="none"
        />
      ))}

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER / LOGO ──────────────────────────────────────────── */}
        <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Anillo exterior rotante */}
          <Animated.View style={[styles.ringOuter, { transform: [{ rotate: spin }] }]}>
            <View style={styles.ringDot1} />
            <View style={styles.ringDot2} />
            <View style={styles.ringDot3} />
          </Animated.View>

          {/* Logo central */}
          <View style={styles.logoInner}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>

          <Text style={[styles.appName, isDark && styles.textDark]}>
            Food<Text style={styles.appRed}>Express</Text>
          </Text>
          <Text style={[styles.appSub, isDark && styles.subTextDark]}>Tu comida favorita al instante</Text>

          {/* Chips */}
          <View style={styles.chips}>
            {[['🔥', 'Rápido'], ['⭐', '4.9'], ['📍', 'Cerca']].map(([icon, label]) => (
              <View key={label} style={[styles.chip, isDark && styles.chipDark]}>
                <Text style={[styles.chipTxt, isDark && styles.chipTxtDark]}>{icon} {label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── CARD ───────────────────────────────────────────────────── */}
        <Animated.View style={[styles.card, isDark && styles.cardDark, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Text style={[styles.cardTitle, isDark && styles.textDark]}>Iniciar Sesión</Text>
          <Text style={[styles.cardSub, isDark && styles.subTextDark]}>Bienvenido de vuelta 👋</Text>

          {/* Correo */}
          <View style={[
            styles.field, 
            isDark && styles.fieldDark,
            focusedInput === 'email' && (isDark ? styles.fieldFocusedDark : styles.fieldFocused)
          ]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={focusedInput === 'email' ? '#dc2626' : '#9ca3af'}
              style={styles.fieldIcon}
            />
            <TextInput
              style={[styles.input, isDark && styles.textDark]}
              placeholder="Correo electrónico"
              placeholderTextColor={isDark ? "#4b5563" : "#c4c9d4"}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>


          {/* Contraseña */}
          <View style={[
            styles.field, 
            isDark && styles.fieldDark,
            focusedInput === 'pass' && (isDark ? styles.fieldFocusedDark : styles.fieldFocused)
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focusedInput === 'pass' ? '#dc2626' : '#9ca3af'}
              style={styles.fieldIcon}
            />
            <TextInput
              style={[styles.input, isDark && styles.textDark]}
              placeholder="Contraseña"
              placeholderTextColor={isDark ? "#4b5563" : "#c4c9d4"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('pass')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Olvidé contraseña */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Login */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnOff]}
              onPress={handleLogin}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-forward-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loginBtnTxt}>Iniciar Sesión</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>¿No tienes cuenta?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Ir a registro */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.replace('/register')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.registerBtnTxt}>Crear cuenta nueva</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>FoodExpress © 2025 · Todos los derechos reservados</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RED = '#dc2626';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  // ── Decoración de fondo ──────────────────────────────────────────────────
  blob1: {
    position: 'absolute', borderRadius: 999,
    width: 320, height: 320,
    backgroundColor: 'rgba(220,38,38,0.06)',
    top: -100, right: -100,
  },
  blob2: {
    position: 'absolute', borderRadius: 999,
    width: 240, height: 240,
    backgroundColor: 'rgba(220,38,38,0.04)',
    bottom: 80, left: -90,
  },
  blob3: {
    position: 'absolute', borderRadius: 999,
    width: 160, height: 160,
    backgroundColor: 'rgba(251,191,36,0.05)',
    top: height * 0.45, left: -40,
  },
  bgDot: {
    position: 'absolute', width: 5, height: 5,
    borderRadius: 99, backgroundColor: RED,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 22, paddingVertical: 44,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: { alignItems: 'center', marginBottom: 28 },

  ringOuter: {
    position: 'absolute',
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(220,38,38,0.2)',
    borderStyle: 'dashed',
    top: 0, alignSelf: 'center',
    zIndex: 0,
  },
  ringDot1: { position:'absolute', width:7, height:7, borderRadius:99, backgroundColor:RED, opacity:0.45, top:-3,  left:'50%', marginLeft:-3 },
  ringDot2: { position:'absolute', width:7, height:7, borderRadius:99, backgroundColor:RED, opacity:0.45, bottom:-3, left:'50%', marginLeft:-3 },
  ringDot3: { position:'absolute', width:7, height:7, borderRadius:99, backgroundColor:RED, opacity:0.45, top:'50%', marginTop:-3, right:-3 },

  logoInner: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: RED,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, marginTop: 10,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30, shadowRadius: 16,
    elevation: 10, zIndex: 1,
  },
  logoEmoji: { fontSize: 38 },

  appName: {
    fontSize: 30, fontWeight: '900',
    color: '#111827', letterSpacing: -0.5,
    marginBottom: 4,
  },
  appRed: { color: RED },
  appSub: { fontSize: 13, color: '#9ca3af', marginBottom: 14 },

  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.12)',
    borderRadius: 99, paddingVertical: 4, paddingHorizontal: 12,
  },
  chipTxt: { fontSize: 11, fontWeight: '700', color: RED },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07, shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  cardSub:  { fontSize: 13, color: '#9ca3af', marginBottom: 20 },

  // ── Campos ───────────────────────────────────────────────────────────────
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14, marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#f3f4f6',
  },
  fieldFocused: { borderColor: RED, backgroundColor: '#fff5f5' },
  fieldIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14,
    fontSize: 14, fontWeight: '500', color: '#1f2937',
  },
  eyeBtn: { padding: 6 },

  // ── Olvidé contraseña ─────────────────────────────────────────────────────
  forgotRow: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotTxt: { fontSize: 12, color: RED, fontWeight: '600' },

  // ── Botón login ───────────────────────────────────────────────────────────
  loginBtn: {
    backgroundColor: RED,
    paddingVertical: 15, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14,
    elevation: 8,
  },
  loginBtnOff: { backgroundColor: '#f87171', shadowOpacity: 0 },
  loginBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f3f4f6' },
  dividerTxt: { fontSize: 12, color: '#d1d5db', fontWeight: '500' },

  // ── Botón registro ────────────────────────────────────────────────────────
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(220,38,38,0.4)',
    paddingVertical: 13, borderRadius: 14,
  },
  registerBtnTxt: { color: RED, fontSize: 14, fontWeight: '600' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { textAlign: 'center', color: '#d1d5db', fontSize: 10, marginTop: 24 },

  // Dark styles
  containerDark: { backgroundColor: '#020617' },
  textDark: { color: '#f8fafc' },
  subTextDark: { color: '#94a3b8' },
  cardDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
  fieldDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  fieldFocusedDark: { borderColor: RED, backgroundColor: '#1e1b1b' },
  chipDark: { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.3)' },
  chipTxtDark: { color: '#ef4444' },
});
