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
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authApi } from '../services/api';
import { showAlert } from '../services/alerts';
import * as ImagePicker from 'expo-image-picker';



const { width, height } = Dimensions.get('window');
const RED = '#dc2626';


const InputField = ({
  id,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  secureTextEntry = false,
  onToggleSecure,
  focusedInput,
  setFocusedInput,
}: any) => (
  <View style={[styles.field, focusedInput === id && styles.fieldFocused]}>
    <Ionicons
      name={icon}
      size={18}
      color={focusedInput === id ? '#dc2626' : '#9ca3af'}
      style={styles.fieldIcon}
    />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#c4c9d4"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      onFocus={() => setFocusedInput(id)}
      onBlur={() => setFocusedInput(null)}
    />
    {onToggleSecure && (
      <TouchableOpacity style={styles.eyeBtn} onPress={onToggleSecure}>
        <Ionicons
          name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color="#9ca3af"
        />
      </TouchableOpacity>
    )}
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [foto, setFoto] = useState('');
  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Animaciones de entrada
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!nombre.trim() || !telefono.trim() || !password.trim()) {
      showAlert('Campos incompletos', 'Por favor completa nombre, teléfono y contraseña', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }


    try {
      setLoading(true);
      const response = await authApi.register({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim() || '',
        password: password.trim(),
        foto: foto.trim() || '',
      });


      if (response.success) {
        showAlert(
          '¡Cuenta creada! 🎉',
          'Tu cuenta fue registrada correctamente. Ahora inicia sesión.',
          'success',
          () => router.replace('/login')
        );
      } else {
        showAlert('Error', response.message || 'No se pudo registrar el usuario', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showAlert(
        'Error de conexión',
        'No se pudo conectar al servidor.\n\nVerifica que el backend esté corriendo y la IP en .env sea correcta.',
        'error'
      );
    } finally {

      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Decoraciones de fondo */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <View style={styles.logoInner}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <Text style={styles.appName}>
            Food<Text style={styles.appRed}>Express</Text>
          </Text>
          <Text style={styles.appSub}>Únete a nuestra comunidad gourmet</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.cardTitle}>Crear Cuenta</Text>
          <Text style={styles.cardSub}>Regístrate y disfruta de beneficios exclusivos 🍕</Text>

          {/* Selector de Foto de Perfil */}
          <View style={{ alignItems: 'center', marginBottom: 25 }}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#f3f4f6',
                borderWidth: 2,
                borderColor: foto ? RED : '#e5e7eb',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                {foto ? (
                  <Image source={{ uri: foto }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                    <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Subir foto</Text>
                  </View>
                )}
              </View>
              {foto && (
                <TouchableOpacity 
                  onPress={() => setFoto('')}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 2,
                    elevation: 2
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={RED} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Tu foto es opcional</Text>
          </View>

          <InputField

            id="nombre"
            icon="person-outline"
            placeholder="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />


          <InputField
            id="tel"
            icon="phone-portrait-outline"
            placeholder="Número de teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            maxLength={10}
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />


          <InputField
            id="correo"
            icon="mail-outline"
            placeholder="Correo electrónico (opcional)"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />






          <InputField
            id="pass"
            icon="lock-closed-outline"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword(!showPassword)}
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />


          <InputField
            id="confirmPass"
            icon="shield-checkmark-outline"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />


          {/* Botón Registro */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnOff]}
              onPress={handleRegister}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.registerBtnTxt}>Crear Cuenta</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>¿Ya tienes cuenta?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Ir a login */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.loginBtnTxt}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>FoodExpress © 2025 · Todos los derechos reservados</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#ffffff' },
  blob1: {
    position: 'absolute', borderRadius: 999,
    width: 300, height: 300,
    backgroundColor: 'rgba(220,38,38,0.05)',
    top: -100, left: -100,
  },
  blob2: {
    position: 'absolute', borderRadius: 999,
    width: 250, height: 250,
    backgroundColor: 'rgba(251,191,36,0.04)',
    bottom: -50, right: -50,
  },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 22, paddingVertical: 40,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logoInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: RED,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10,
    elevation: 8,
  },
  logoEmoji: { fontSize: 34 },
  appName: {
    fontSize: 28, fontWeight: '900',
    color: '#111827', letterSpacing: -0.5,
  },
  appRed: { color: RED },
  appSub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 15,
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },

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
    flex: 1, paddingVertical: 12,
    fontSize: 14, fontWeight: '500', color: '#1f2937',
  },
  eyeBtn: { padding: 6 },

  registerBtn: {
    backgroundColor: RED,
    paddingVertical: 15, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14,
    elevation: 8,
  },
  btnOff: { backgroundColor: '#f87171', shadowOpacity: 0 },
  registerBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f3f4f6' },
  dividerTxt: { fontSize: 12, color: '#d1d5db', fontWeight: '500' },

  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(220,38,38,0.4)',
    paddingVertical: 13, borderRadius: 14,
  },
  loginBtnTxt: { color: RED, fontSize: 14, fontWeight: '600' },

  footer: { textAlign: 'center', color: '#d1d5db', fontSize: 10, marginTop: 24 },
});
