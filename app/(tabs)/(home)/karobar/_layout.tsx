import { Stack } from "expo-router";
import React from "react";

export default function KarobarLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: 'slide_from_right',
      animationDuration: 1000, // Much slower animation for karobar
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ 
        headerShown: false, 
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
        animationDuration: 1000,
      }} />
    </Stack>
  );
}