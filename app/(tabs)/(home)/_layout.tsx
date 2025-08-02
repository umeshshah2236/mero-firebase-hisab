import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: false,
      headerTitle: 'Home',
      title: 'Home', // Force all screens to have 'Home' as title
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: 'slide_from_right',
      animationDuration: 300, // Standard animation speed
    }}>
      <Stack.Screen name="index" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="add-loan" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="add-customer" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="customer-form" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="customer-detail" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="add-receive-entry" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="add-give-entry" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="edit-give-entry" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
      <Stack.Screen name="edit-receive-entry" options={{ headerShown: false, headerTitle: 'Home', title: 'Home' }} />
    </Stack>
  );
}