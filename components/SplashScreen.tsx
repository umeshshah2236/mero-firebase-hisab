import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const popAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Floating particles animation values
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations sequence
    const startAnimations = () => {
      // Floating particles animation
      const createFloatingAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 3000 + delay,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 3000 + delay,
              useNativeDriver: true,
            }),
          ])
        );
      };

      // Start floating particles
      createFloatingAnimation(particle1, 0).start();
      createFloatingAnimation(particle2, 500).start();
      createFloatingAnimation(particle3, 1000).start();
      createFloatingAnimation(particle4, 1500).start();

      // Logo entrance animation - Enhanced pop up effect with longer duration
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200, // Slightly longer fade in
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 80, // Slightly softer spring
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Pop back to normal size with smoother animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 12, // Smoother settle
          useNativeDriver: true,
        }),
      ]).start();

      // Enhanced gentle pulsing effect after pop-in - slower and more elegant
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08, // Slightly more pronounced pulse
              duration: 2000, // Slower, more elegant pulsing
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 1200); // Start pulsing slightly later

      // Extended duration for better loading experience - start fade out after 4.5 seconds
      setTimeout(() => {
        // Smooth fade out animation before finishing
        Animated.timing(exitFadeAnim, {
          toValue: 0,
          duration: 1000, // 1 second fade out
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 4500);
      
      // Fallback timeout to ensure splash never gets stuck
      setTimeout(() => {
        console.warn('Splash screen fallback timeout, forcing finish');
        onFinish();
      }, 7000);
    };

    startAnimations();
  }, []);

  // Remove rotation animation

  const getParticleTransform = (animValue: Animated.Value, index: number) => {
    const translateY = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [height, -50, height],
    });
    
    const translateX = animValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [width * 0.1 * index, width * 0.9, width * 0.2 * index],
    });

    return [{ translateX }, { translateY }];
  };

  return (
    <Animated.View style={[styles.container, { opacity: exitFadeAnim }]}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={[
          '#1a1a2e',
          '#16213e',
          '#0f3460',
          '#533483',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Floating particles */}
        <Animated.View
          style={[
            styles.particle,
            {
              transform: [
                ...getParticleTransform(particle1, 1),
                { scale: 0.8 },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              transform: [
                ...getParticleTransform(particle2, 2),
                { scale: 0.6 },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              transform: [
                ...getParticleTransform(particle3, 3),
                { scale: 1.2 },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.particle,
            styles.particle4,
            {
              transform: [
                ...getParticleTransform(particle4, 4),
                { scale: 0.4 },
              ],
            },
          ]}
        />

        {/* Glowing circles background */}
        <View style={styles.glowContainer}>
          <View style={[styles.glowCircle, styles.glow1]} />
          <View style={[styles.glowCircle, styles.glow2]} />
          <View style={[styles.glowCircle, styles.glow3]} />
        </View>

        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          {/* Logo background glow */}
          <View style={styles.logoGlow} />
          
          {/* Your logo - New transparent logo */}
          <Image
            source={{ uri: 'https://r2-pub.rork.com/attachments/2xotr4o80qd1bsoukr8ci' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated border effect - No rotation */}
        <Animated.View
          style={[
            styles.borderEffect,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.borderRing} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  glow1: {
    width: 300,
    height: 300,
    backgroundColor: '#4facfe',
    top: '20%',
    left: '10%',
  },
  glow2: {
    width: 200,
    height: 200,
    backgroundColor: '#00f2fe',
    bottom: '30%',
    right: '15%',
  },
  glow3: {
    width: 150,
    height: 150,
    backgroundColor: '#43e97b',
    top: '60%',
    left: '60%',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4facfe',
    opacity: 0.6,
  },
  particle2: {
    backgroundColor: '#00f2fe',
  },
  particle3: {
    backgroundColor: '#43e97b',
  },
  particle4: {
    backgroundColor: '#fa709a',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4facfe',
    opacity: 0.2,
    ...Platform.select({
      ios: {
        shadowColor: '#4facfe',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  logo: {
    width: 150,
    height: 150,
    zIndex: 1,
  },
  borderEffect: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#4facfe',
    opacity: 0.3,
    borderStyle: 'dashed',
  },
});