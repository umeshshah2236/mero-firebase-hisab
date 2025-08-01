import { Stack } from "expo-router";
import React from "react";

export default function KarobarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}