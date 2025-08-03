import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function CalculatorLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: 'slide_from_right', // Forward navigation - slide from right  
      animationDuration: Platform.OS === 'android' ? 250 : 300, // Slightly faster on Android
      animationTypeForReplace: Platform.OS === 'android' ? 'push' : 'push',
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          // Android-specific: VERY different animation when coming back to index
          ...(Platform.OS === 'android' && {
            animation: 'slide_from_bottom', // Dramatic upward slide for Android backward
            animationDuration: 400, // Slightly longer to make it more noticeable
          }),
        }} 
      />
      <Stack.Screen name="results" options={{ 
        headerShown: false, 
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right', // Forward: Calculator → Results
        animationDuration: Platform.OS === 'android' ? 250 : 300, // Slightly faster on Android
        animationTypeForReplace: Platform.OS === 'android' ? 'pop' : 'push', // Pop for Android backward
      }} />
    </Stack>
  );
}