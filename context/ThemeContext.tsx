import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ThemeMode;
  toggleColorScheme: () => void;
  setColorScheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorScheme, setColorScheme: setNativeColorScheme, toggleColorScheme: toggleNativeColorScheme } = useNativeColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setNativeColorScheme(savedTheme as ThemeMode);
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  const toggleColorScheme = async () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem('themeMode', newTheme);
    toggleNativeColorScheme();
  };

  const setColorScheme = async (mode: ThemeMode) => {
    await AsyncStorage.setItem('themeMode', mode);
    setNativeColorScheme(mode);
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ colorScheme: colorScheme as ThemeMode, toggleColorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
