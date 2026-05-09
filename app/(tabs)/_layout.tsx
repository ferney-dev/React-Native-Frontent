import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: 'absolute',
          bottom: 15,
          left: 15,
          right: 15,
          height: 80,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderRadius: 30,
          borderTopWidth: 0,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? '#1e293b' : 'transparent',

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 10,

          paddingTop: 10,
        },

        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#9ca3af',

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 8,
        },
      }}
    >
      {/* INICIO */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused 
                  ? (isDark ? '#dc262620' : '#fee2e2') 
                  : 'transparent',
                padding: 10,
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

    {/* OFERTAS */}
<Tabs.Screen
  name="ofertas"
  options={{
    title: 'Ofertas',

    tabBarIcon: ({ color, focused }) => (
      <View
        style={{
          backgroundColor: focused 
            ? (isDark ? '#dc262620' : '#fee2e2') 
            : 'transparent',
          padding: 10,
          borderRadius: 18,
        }}
      >
        <Ionicons
          name={focused ? 'pricetag' : 'pricetag-outline'}
          size={26}
          color={color}
        />
      </View>
    ),
  }}
/>

      {/* FAVORITOS */}
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused 
                  ? (isDark ? '#dc262620' : '#fee2e2') 
                  : 'transparent',
                padding: 10,
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* PERFIL */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',

          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused 
                  ? (isDark ? '#dc262620' : '#fee2e2') 
                  : 'transparent',
                padding: 10,
                borderRadius: 18,
              }}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}