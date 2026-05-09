import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface OrderStepperProps {
  status: 'pendiente' | 'preparando' | 'en_camino' | 'entregado';
}

const steps = [
  { id: 'pendiente', label: 'Recibido', icon: 'time-outline' },
  { id: 'preparando', label: 'Cocinando', icon: 'restaurant-outline' },
  { id: 'en_camino', label: 'En camino', icon: 'bicycle-outline' },
  { id: 'entregado', label: 'Entregado', icon: 'checkmark-done-outline' },
];

export const OrderStepper = ({ status }: OrderStepperProps) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const currentStepIndex = steps.findIndex(step => step.id === status);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.iconWrapper}>
              <View
                style={[
                  styles.circle,
                  isDark && styles.circleDark,
                  isActive && styles.activeCircle,
                  isCurrent && styles.currentCircle,
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={24}
                  color={isActive ? '#fff' : (isDark ? '#4b5563' : '#9ca3af')}
                />
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isDark && styles.lineDark,
                    index < currentStepIndex && styles.activeLine,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.label,
                isDark && styles.labelDark,
                isActive && styles.activeLabel,
                isActive && isDark && styles.activeLabelDark,
                isCurrent && styles.currentLabel,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  circle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  activeCircle: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  currentCircle: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  line: {
    position: 'absolute',
    top: 22.5,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#e5e7eb',
    zIndex: 1,
  },
  activeLine: {
    backgroundColor: '#dc2626',
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#374151',
  },
  currentLabel: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  circleDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  lineDark: {
    backgroundColor: '#1e293b',
  },
  labelDark: {
    color: '#4b5563',
  },
  activeLabelDark: {
    color: '#94a3b8',
  },
});
