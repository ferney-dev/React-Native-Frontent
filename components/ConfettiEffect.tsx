import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CONFETTI_COUNT = 30;
const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export const ConfettiEffect = ({ onComplete }: { onComplete?: () => void }) => {
  const pieces = useRef(
    Array.from({ length: CONFETTI_COUNT }).map(() => ({
      x: Math.random() * width,
      y: new Animated.Value(-50),
      rotate: new Animated.Value(Math.random() * 360),
      scale: Math.random() * 0.8 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2000,
      duration: Math.random() * 2000 + 3000,
    }))
  ).current;

  useEffect(() => {
    const animations = pieces.map((piece) => {
      piece.y.setValue(-50);
      piece.rotate.setValue(0);
      
      return Animated.sequence([
        Animated.delay(piece.delay),
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: 360,
            duration: piece.duration,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });


    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: piece.x,
              transform: [
                { translateY: piece.y },
                { rotate: piece.rotate.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })},
                { scale: piece.scale },
              ],
            },
          ]}
        >
          <Ionicons name="square" size={15} color={piece.color} />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  confetti: {
    position: 'absolute',
    top: 0,
  },
});
