import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { Calculator, ArrowLeftRight, ArrowRight, ClipboardList, Sparkles, TrendingUp, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAuth } from '@/contexts/AuthContext';

import NameInputModal from '@/components/NameInputModal';
import { capitalizeFirstLetters } from '@/utils/string-utils';


// Dynamic responsive hook
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

// Enhanced responsive sizing function optimized for all devices
const getResponsiveSize = (baseSize: number, screenWidth: number, screenHeight: number) => {
  // Base dimensions (iPhone 12/13/14 standard)
  const baseWidth = 390;
  const baseHeight = 844;
  
  // Calculate scale factors
  const widthScale = screenWidth / baseWidth;
  const heightScale = screenHeight / baseHeight;
  
  // Use average scale but cap it for very large screens
  const scale = Math.min((widthScale + heightScale) / 2, 1.3);
  
  // Ensure minimum readable size
  const scaledSize = baseSize * Math.max(0.8, scale);
  return Math.round(scaledSize);
};

// Responsive spacing function optimized for content fitting
const getResponsiveSpacing = (baseSpacing: number, screenWidth: number, screenHeight: number) => {
  const baseHeight = 844; // iPhone 12/13/14 standard
  const heightRatio = screenHeight / baseHeight;
  
  // More conservative scaling for spacing to ensure content fits
  const adjustedSpacing = baseSpacing * Math.max(0.6, Math.min(heightRatio, 1.1));
  return Math.round(adjustedSpacing);
};

// Device type detection for better optimization
const getDeviceType = (width: number, height: number) => {
  const aspectRatio = height / width;
  
  if (height < 700) return 'compact'; // iPhone SE, small Android
  if (height < 800) return 'standard'; // iPhone 8, iPhone X
  if (height < 900) return 'large'; // iPhone 12/13/14
  if (height < 950) return 'extraLarge'; // iPhone 14 Plus, iPhone 15 Plus
  return 'proMax'; // iPhone Pro Max, large Android
};

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { theme, isDark, isLoading: themeLoading } = useTheme();
  const { firstName, isFirstLaunch, isLoading, setUserName, skipNameEntry } = useUserProfile();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const insets = useSafeAreaInsets();
  const [forceShowApp, setForceShowApp] = React.useState(false);
  const [isPageFullyLoaded, setIsPageFullyLoaded] = React.useState(false);
  const { width: screenWidth, height: screenHeight } = useResponsiveDimensions();
  
  // Fallback background color while theme is loading
  const backgroundColor = themeLoading ? '#FFFFFF' : theme.colors.background;
  
  // Enhanced device detection
  const deviceType = getDeviceType(screenWidth, screenHeight);
  const isCompactScreen = deviceType === 'compact';
  const isVeryCompactScreen = screenHeight < 680;
  const isExtraCompactScreen = screenHeight < 600;
  const isProMaxScreen = deviceType === 'proMax';

  // Redirect authenticated users to dashboard - optimized for smooth transitions
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard');
      // Use immediate navigation for smooth transitions
      router.replace('/(tabs)/(home)/dashboard');
    } else if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, staying on home screen');
    }
  }, [isAuthenticated, authLoading]);

  const handleFeaturePress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as any);
  };

  const handleTrackLoansPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Check authentication state
    if (!isAuthenticated) {
      // Redirect to sign in screen
      router.push('/auth/sign-in');
    } else {
      // User is authenticated, redirect to dashboard
      router.push('/(tabs)/(home)/dashboard');
    }
  };

  const getGreeting = () => {
    if (firstName) {
      return `Hi! ${capitalizeFirstLetters(firstName)}`;
    }
    return 'Hi there!';
  };



  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading || authLoading || themeLoading) {
        console.warn('Loading timeout reached, forcing app to continue');
        console.warn('Loading states:', { isLoading, authLoading, themeLoading });
        setForceShowApp(true);
      }
    }, 5000); // Reduced to 5 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [isLoading, authLoading, themeLoading]);

  // Mark page as fully loaded after all loading states are complete
  useEffect(() => {
    if (!isLoading && !authLoading && !themeLoading) {
      // Add a small delay to ensure the UI is fully rendered
      const timer = setTimeout(() => {
        setIsPageFullyLoaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, authLoading, themeLoading]);

  // Show loading only if not forced to show app
  if ((isLoading || authLoading || themeLoading) && !forceShowApp) {
    console.log('Showing loading screen:', { isLoading, authLoading, themeLoading, forceShowApp });
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <Text style={[styles.loadingText, { color: themeLoading ? '#000000' : theme.colors.text }]}>Loading...</Text>
      </View>
    );
  }

  // Render the main content
  const renderMainContent = () => {

  // Don't render the public home if user is authenticated (will redirect)
  if (!authLoading && isAuthenticated) {
    return null;
  }

  // Optimized spacing based on device type
  const getSpacingForDevice = () => {
    switch (deviceType) {
      case 'compact':
        return { header: 8, section: 16, card: 12, hero: 180 };
      case 'standard':
        return { header: 12, section: 20, card: 16, hero: 220 };
      case 'large':
        return { header: 16, section: 24, card: 18, hero: 240 };
      case 'extraLarge':
        return { header: 18, section: 26, card: 20, hero: 260 };
      case 'proMax':
        return { header: 20, section: 28, card: 22, hero: 280 };
      default:
        return { header: 16, section: 24, card: 18, hero: 240 };
    }
  };
  
  const spacing = getSpacingForDevice();
  const headerPaddingTop = insets.top + getResponsiveSpacing(spacing.header, screenWidth, screenHeight);
  const sectionSpacing = getResponsiveSpacing(spacing.section, screenWidth, screenHeight);
  const cardSpacing = getResponsiveSpacing(spacing.card, screenWidth, screenHeight);

    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Hero Section with Better Contrast */}
        <LinearGradient
          colors={isDark ? ['#1e3a8a', '#3b82f6'] : ['#1e40af', '#2563eb']}
          style={[styles.compactHeroSection, { 
            paddingTop: Platform.OS === 'ios' ? headerPaddingTop : insets.top + 40, // Increased padding for Android camera area
            paddingBottom: getResponsiveSpacing(isVeryCompactScreen ? 18 : isCompactScreen ? 22 : 28, screenWidth, screenHeight),
            paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
            minHeight: spacing.hero,
            marginTop: Platform.OS === 'android' ? -insets.top : 0, // Negative margin to extend behind status bar on Android
          }]}
        >
          {/* Enhanced floating elements with better visibility */}
          <View style={[styles.subtleFloatingElement, styles.subtleElement1, {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
          }]} />
          <View style={[styles.subtleFloatingElement, styles.subtleElement2, {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          }]} />
          
          <View style={styles.compactHeroContent}>
            {/* Compact Logo and Title Row */}
            <View style={styles.compactLogoRow}>
              <View style={[styles.compactLogoIcon, {
                width: getResponsiveSize(44, screenWidth, screenHeight),
                height: getResponsiveSize(44, screenWidth, screenHeight),
                borderRadius: getResponsiveSize(22, screenWidth, screenHeight),
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }]}>
                <Sparkles size={getResponsiveSize(22, screenWidth, screenHeight)} color="#ffffff" />
              </View>
              <Text style={[styles.compactAppTitle, {
                fontSize: getResponsiveSize(isProMaxScreen ? 28 : 26, screenWidth, screenHeight),
                marginLeft: getResponsiveSpacing(14, screenWidth, screenHeight),
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }]}>
                {t('appTitle')}
              </Text>
            </View>

            {/* Compact Welcome Message */}
            <View style={[styles.compactWelcomeSection, {
              marginTop: getResponsiveSpacing(isVeryCompactScreen ? 12 : 16, screenWidth, screenHeight),
            }]}>
              <Text style={[styles.compactWelcomeTitle, {
                fontSize: getResponsiveSize(isProMaxScreen ? 22 : 20, screenWidth, screenHeight),
                marginBottom: getResponsiveSpacing(6, screenWidth, screenHeight),
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.compactWelcomeSubtitle, {
                fontSize: getResponsiveSize(isProMaxScreen ? 18 : 16, screenWidth, screenHeight),
                lineHeight: getResponsiveSize(isProMaxScreen ? 24 : 22, screenWidth, screenHeight),
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }]}>
                {t('financialTools')}
              </Text>
            </View>

            {/* Compact Trust Indicators - Centered */}
            <View style={[styles.compactTrustIndicators, {
              marginTop: getResponsiveSpacing(isVeryCompactScreen ? 12 : 16, screenWidth, screenHeight),
              alignSelf: 'center',
              width: '100%',
              maxWidth: 300,
            }]}>
              <View style={styles.compactTrustItem}>
                <Shield size={getResponsiveSize(18, screenWidth, screenHeight)} color="#ffffff" />
                <Text style={[styles.compactTrustText, {
                  fontSize: getResponsiveSize(14, screenWidth, screenHeight),
                }]}>Secure</Text>
              </View>
              <View style={styles.compactTrustItem}>
                <TrendingUp size={getResponsiveSize(18, screenWidth, screenHeight)} color="#ffffff" />
                <Text style={[styles.compactTrustText, {
                  fontSize: getResponsiveSize(14, screenWidth, screenHeight),
                }]}>Reliable</Text>
              </View>
              <View style={styles.compactTrustItem}>
                <Sparkles size={getResponsiveSize(18, screenWidth, screenHeight)} color="#ffffff" />
                <Text style={[styles.compactTrustText, {
                  fontSize: getResponsiveSize(14, screenWidth, screenHeight),
                }]}>Easy to Use</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        
        {/* Features Section */}
        <View style={[styles.featuresSection, {
          paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
          marginTop: getResponsiveSpacing(isExtraCompactScreen ? -8 : isVeryCompactScreen ? -12 : -16, screenWidth, screenHeight),
          marginBottom: sectionSpacing,
        }]}>
          <View style={styles.featuresGrid}>
            <TouchableOpacity 
              style={[styles.modernFeatureCard, {
                backgroundColor: theme.colors.surface,
                marginBottom: cardSpacing,
                paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
                paddingVertical: getResponsiveSpacing(isExtraCompactScreen ? 12 : isVeryCompactScreen ? 14 : 16, screenWidth, screenHeight),
              }]}
              onPress={() => handleFeaturePress('/(tabs)/(home)/calculator')}
              activeOpacity={0.8}
            >
              <View style={[styles.modernIconContainer, { 
                backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
                width: getResponsiveSize(52, screenWidth, screenHeight),
                height: getResponsiveSize(52, screenWidth, screenHeight),
                borderWidth: 2,
                borderColor: isDark ? '#3b82f6' : '#2563eb',
              }]}>
                <Calculator size={getResponsiveSize(22, screenWidth, screenHeight)} color={isDark ? '#ffffff' : '#2563eb'} />
              </View>
              <View style={styles.modernFeatureContent}>
                <Text style={[styles.modernFeatureTitle, {
                  fontSize: getResponsiveSize(isProMaxScreen ? 20 : 18, screenWidth, screenHeight),
                  color: theme.colors.text,
                  fontWeight: '500',
                }]}>
                  {t('calculator')}
                </Text>
                <Text style={[styles.modernFeatureDesc, {
                  fontSize: getResponsiveSize(16, screenWidth, screenHeight),
                  color: theme.colors.textSecondary,
                  lineHeight: getResponsiveSize(22, screenWidth, screenHeight),
                  fontWeight: '400',
                }]}>
                  {t('calculateInterestDesc')}
                </Text>
              </View>
              <View style={styles.modernArrowContainer}>
                <ArrowRight size={getResponsiveSize(20, screenWidth, screenHeight)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernFeatureCard, {
                backgroundColor: theme.colors.surface,
                marginBottom: cardSpacing,
                paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
                paddingVertical: getResponsiveSpacing(isExtraCompactScreen ? 12 : isVeryCompactScreen ? 14 : 16, screenWidth, screenHeight),
              }]}
              onPress={() => handleFeaturePress('/(tabs)/(home)/karobar')}
              activeOpacity={0.8}
            >
              <View style={[styles.modernIconContainer, { 
                backgroundColor: isDark ? '#92400e' : '#fef3c7',
                width: getResponsiveSize(52, screenWidth, screenHeight),
                height: getResponsiveSize(52, screenWidth, screenHeight),
                borderWidth: 2,
                borderColor: isDark ? '#f59e0b' : '#d97706',
              }]}>
                <ArrowLeftRight size={getResponsiveSize(22, screenWidth, screenHeight)} color={isDark ? '#ffffff' : '#d97706'} />
              </View>
              <View style={styles.modernFeatureContent}>
                <Text style={[styles.modernFeatureTitle, {
                  fontSize: getResponsiveSize(isProMaxScreen ? 20 : 18, screenWidth, screenHeight),
                  color: theme.colors.text,
                  fontWeight: '500',
                }]}>
                  {t('karobar')}
                </Text>
                <Text style={[styles.modernFeatureDesc, {
                  fontSize: getResponsiveSize(16, screenWidth, screenHeight),
                  color: theme.colors.textSecondary,
                  lineHeight: getResponsiveSize(22, screenWidth, screenHeight),
                  fontWeight: '400',
                }]}>
                  {t('trackLoansDesc')}
                </Text>
              </View>
              <View style={styles.modernArrowContainer}>
                <ArrowRight size={getResponsiveSize(20, screenWidth, screenHeight)} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Call to Action Section - Optimized for all screens */}
        <View style={[styles.ctaSection, {
          paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
          marginBottom: getResponsiveSpacing(isExtraCompactScreen ? 16 : isVeryCompactScreen ? 20 : isProMaxScreen ? 32 : 28, screenWidth, screenHeight),
          paddingBottom: getResponsiveSpacing(isProMaxScreen ? 20 : 16, screenWidth, screenHeight),
        }]}>
          <View style={[styles.ctaCard, {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingHorizontal: getResponsiveSpacing(20, screenWidth, screenHeight),
            paddingVertical: getResponsiveSpacing(isExtraCompactScreen ? 12 : isVeryCompactScreen ? 14 : 16, screenWidth, screenHeight),
          }]}>
            <View style={styles.ctaContent}>
              <Text style={[styles.ctaTitle, {
                fontSize: getResponsiveSize(isProMaxScreen ? 21 : 20, screenWidth, screenHeight),
                marginBottom: getResponsiveSpacing(8, screenWidth, screenHeight),
                color: theme.colors.text,
                fontWeight: '500',
              }]}>
                {t('readyToGetStarted')}
              </Text>
              <Text style={[styles.ctaSubtitle, {
                fontSize: getResponsiveSize(isProMaxScreen ? 18 : 17, screenWidth, screenHeight),
                marginBottom: getResponsiveSpacing(isExtraCompactScreen ? 16 : isVeryCompactScreen ? 18 : isProMaxScreen ? 22 : 20, screenWidth, screenHeight),
                lineHeight: getResponsiveSize(isProMaxScreen ? 24 : 23, screenWidth, screenHeight),
                color: theme.colors.textSecondary,
                fontWeight: '400',
              }]}>
                {t('joinThousandsOfUsers')}
              </Text>
              
              <TouchableOpacity 
                style={[styles.primaryButton, {
                  paddingHorizontal: getResponsiveSpacing(28, screenWidth, screenHeight),
                  paddingVertical: getResponsiveSpacing(14, screenWidth, screenHeight),
                }]}
                onPress={handleTrackLoansPress}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  style={styles.buttonGradient}
                >
                  <ClipboardList size={getResponsiveSize(20, screenWidth, screenHeight)} color="#ffffff" />
                  <Text style={[styles.primaryButtonText, {
                    fontSize: getResponsiveSize(isProMaxScreen ? 18 : 17, screenWidth, screenHeight),
                    marginLeft: getResponsiveSpacing(10, screenWidth, screenHeight),
                    fontWeight: '500',
                  }]}>
                    {t('trackLoans')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>

      
      {renderMainContent()}
      
      {/* Show name modal overlay if it's first launch and page is fully loaded */}
      {isFirstLaunch && isPageFullyLoaded && !isLoading && !authLoading && !themeLoading && (
        <NameInputModal
          visible={true}
          onSave={setUserName}
          onSkip={skipNameEntry}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40, // Increased bottom padding for better spacing
  },
  compactHeroSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  subtleFloatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 50,
  },
  subtleElement1: {
    width: 60,
    height: 60,
    top: 20,
    right: 20,
  },
  subtleElement2: {
    width: 80,
    height: 80,
    bottom: 10,
    left: -10,
  },
  compactHeroContent: {
    zIndex: 1,
  },
  compactLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLogoIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  compactAppTitle: {
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  compactWelcomeSection: {
    alignItems: 'center',
  },
  compactWelcomeTitle: {
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  compactWelcomeSubtitle: {
    color: '#ffffff',
    textAlign: 'center',
    maxWidth: 280,
    fontWeight: '400',
  },
  compactTrustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  compactTrustItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 80,
  },
  compactTrustText: {
    color: '#ffffff',
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresSection: {
    zIndex: 2,
  },
  featuresGrid: {
    // Dynamic styles applied inline
  },
  modernFeatureCard: {
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  modernIconContainer: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modernFeatureContent: {
    flex: 1,
    marginLeft: 16,
  },
  modernFeatureTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  modernFeatureDesc: {
    lineHeight: 20,
  },
  modernArrowContainer: {
    marginLeft: 12,
  },
  ctaSection: {
    // Dynamic styles applied inline
  },
  ctaCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaContent: {
    alignItems: 'center',
    width: '100%',
  },
  ctaTitle: {
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  ctaSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});