import { Alert, Platform } from 'react-native';
import Swal from 'sweetalert2';

/**
 * Utilidad para mostrar alertas que funcionen tanto en Web (SweetAlert2)
 * como en Móvil (Alert nativo).
 */
export const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onPress?: () => void) => {
  if (Platform.OS === 'web') {
    Swal.fire({
      title: title,
      text: message,
      icon: type,
      confirmButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed && onPress) {
        onPress();
      }
    });
  } else {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: onPress,
        },
      ],
      { cancelable: true }
    );
  }
};

export const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: onConfirm },
      ]
    );
  }
};
