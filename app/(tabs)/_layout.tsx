import { Tabs, router, usePathname } from "expo-router";
import { Calculator, Settings, BarChart3, ArrowLeft, Home } from "lucide-react-native";
import React, { useRef } from "react";
import { BackHandler, Platform } from "react-native";
import * as Haptics from 'expo-haptics';
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const lastPressTime = useRef(0);
  const isProcessingPress = useRef(false);
  
  // Debug: Log the current pathname
  console.log('Current pathname:', pathname, 'isAuthenticated:', isAuthenticated);
  
  // Simple logic:
  // - Public flow (not authenticated): ALWAYS show Calculator icon, NEVER show back button
  // - Private flow (authenticated): ALWAYS show Home icon, NEVER show back button
  const shouldShowBackButton = false; // Never show back button in either flow
  
  // Debug: Log the computed values
  console.log('shouldShowBackButton:', shouldShowBackButton, 'isAuthenticated:', isAuthenticated);
  
  // Handle hardware back button for authenticated users
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname === '/(tabs)/(home)/dashboard') {
        // From dashboard (main authenticated page), exit app
        return false;
      }
      
      // For authenticated users, prevent going back to public flow
      // Always navigate to dashboard instead of allowing back navigation
      // This ensures users can never go back to calculator/public flow
      router.replace('/(tabs)/(home)/dashboard');
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [pathname, isAuthenticated]);

  // Use blue background in light mode, matching color in dark mode
  const tabBarBackgroundColor = isDark ? '#1E3A8A' : '#3B82F6';
  const tabBarBorderColor = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: tabBarBorderColor,
        },
        tabBarLabelStyle: {
          fontWeight: 'bold',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('home'),
          tabBarLabel: t('home'),
          tabBarIcon: ({ color }) => {
            if (isAuthenticated) {
              return <Home color="#FFFFFF" strokeWidth={2.5} />;
            }
            return <Calculator color="#FFFFFF" strokeWidth={2.5} />;
          },
          headerShown: false,
          headerTitle: 'Home',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
        listeners={{
          tabPress: (e) => {
            const currentTime = Date.now();
            
            // Prevent double-click within 500ms
            if (currentTime - lastPressTime.current < 500 || isProcessingPress.current) {
              e.preventDefault();
              return;
            }
            
            // Set processing flag to prevent rapid successive presses
            isProcessingPress.current = true;
            lastPressTime.current = currentTime;
            
            // Reset processing flag after a short delay
            setTimeout(() => {
              isProcessingPress.current = false;
            }, 300);
            
            // Add haptic feedback
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            
            // Handle navigation based on authentication state
            e.preventDefault();
            
            if (isAuthenticated) {
              // Check if already on dashboard - if so, don't navigate
              if (pathname === '/(tabs)/(home)/dashboard') {
                console.log('Already on dashboard - preventing navigation');
                return;
              }
              
              // For authenticated users, navigate to dashboard (Customer List page)
              console.log('Home button pressed - navigating to dashboard');
              router.replace('/(tabs)/(home)/dashboard');
            } else {
              // Check if already on home index - if so, don't navigate
              if (pathname === '/(tabs)/(home)') {
                console.log('Already on home index - preventing navigation');
                return;
              }
              
              // For non-authenticated users, navigate to home index (calculator page)
              console.log('Home button pressed - navigating to calculator');
              router.replace('/(tabs)/(home)');
            }
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Settings color="#FFFFFF" strokeWidth={2.5} />,
          headerShown: false,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
        listeners={{
          tabPress: (e) => {
            // Add haptic feedback
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      />
    </Tabs>
  );
}