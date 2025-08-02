import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function CalculatorLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
      animationDuration: Platform.OS === 'android' ? 0 : 300,
      animationTypeForReplace: 'push',
      detachPreviousScreen: false,
      freezeOnBlur: Platform.OS === 'android' ? false : true, // Keep Android screens active
      lazy: false, // Pre-render all screens
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ 
        headerShown: false, 
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: Platform.OS === 'android' ? 'none' : 'slide_from_right',
        animationDuration: Platform.OS === 'android' ? 0 : 300,
        animationTypeForReplace: 'push',
        freezeOnBlur: Platform.OS === 'android' ? false : true,
        lazy: false,
      }} />
    </Stack>
  );
}