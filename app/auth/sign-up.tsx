import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Dimensions, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, MessageSquare, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;

// Dynamic sizing based on screen size
const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

export default function SignUpScreen() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const { checkUserExists, sendOtp, verifyOtp } = useAuth();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(phone || '+977');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpExpiryTime, setOtpExpiryTime] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    otp?: string;
  }>({});

  // Countdown timer for resend OTP
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // OTP expiry timer
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpExpiryTime && isOtpSent) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = otpExpiryTime - now;
        
        if (remaining <= 0) {
          setOtpExpired(true);
          setTimeRemaining('');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpExpiryTime, isOtpSent]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and check if it starts with +977 and has exactly 10 digits after
    const cleanPhone = phone.replace(/\s/g, '');
    const nepaliPhoneRegex = /^\+977[0-9]{10}$/;
    return nepaliPhoneRegex.test(cleanPhone);
  };

  const handleSendOtp = async (isResend = false) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isResend) {
      setIsResending(true);
    } else {
      setIsLoading(true);
    }
    setErrors({});

    if (!name.trim() || name.trim().length < 2) {
      setErrors({ name: 'Please enter your full name (at least 2 characters)' });
      if (isResend) {
        setIsResending(false);
      } else {
        setIsLoading(false);
      }
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setErrors({ phone: 'Please enter a valid Nepali phone number (+977XXXXXXXXXX)' });
      if (isResend) {
        setIsResending(false);
      } else {
        setIsLoading(false);
      }
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s/g, '');

    // Check if user already exists before sending OTP (only for initial send, not resend)
    if (!isResend) {
      const userCheck = await checkUserExists(cleanPhone);
      
      if (userCheck.error) {
        setErrors({ phone: userCheck.error });
        setIsLoading(false);
        return;
      }

      if (userCheck.exists) {
        // User already exists, redirect to sign-in with a helpful message
        Alert.alert(
          "Account Already Exists", 
          "This phone number is already registered. Please sign in to your account.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => {
                router.push('/auth/sign-in');
              }
            }
          ]
        );
        setIsLoading(false);
        return;
      }
    }

    const result = await sendOtp(cleanPhone, name.trim());

    if (result.success) {
      setIsOtpSent(true);
      setCountdown(60); // 1 minute countdown (60 seconds)
      setOtpExpiryTime(result.expiresAt || (Date.now() + (60 * 60 * 1000))); // Use server time or fallback to 1 hour
      setOtpExpired(false);
      setOtp(''); // Clear previous OTP
      Alert.alert('OTP Sent', 'Please check your phone for the verification code. Code expires in 1 hour.');
    } else {
      setErrors({ phone: result.error });
      Alert.alert('Failed to Send OTP', result.error || 'Please try again.');
    }

    if (isResend) {
      setIsResending(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    setErrors({});

    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP' });
      setIsLoading(false);
      return;
    }

    if (otpExpired) {
      setErrors({ otp: 'OTP has expired. Please request a new code.' });
      setIsLoading(false);
      return;
    }

    const result = await verifyOtp(phoneNumber.replace(/\s/g, ''), otp);

    if (result.success) {
      // Navigation is handled automatically by AuthContext
    } else {
      setErrors({ otp: result.error });
      Alert.alert('Verification Failed', result.error || 'Please try again.');
    }

    setIsLoading(false);
  };

  const handleGoBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Add a small delay for smoother transition
    setTimeout(() => {
      // Navigate directly to sign-in instead of using router.back()
      router.push('/auth/sign-in');
    }, 100);
  };

  const handleSignIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Add a small delay for smoother transition
    setTimeout(() => {
      router.push('/auth/sign-in');
    }, 100);
  };

  // Responsive header sizing - more compact
  const headerPaddingTop = Math.max(insets.top + getResponsiveSize(12, 16, 20), 40);
  const headerPaddingBottom = getResponsiveSize(16, 20, 24);
  const headerPaddingHorizontal = getResponsiveSize(12, 16, 20);

  const inputBackgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.inputBackground;
  const inputBorderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : theme.colors.border;
  const inputTextColor = isDark ? 'white' : theme.colors.text;
  const placeholderTextColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(160, 160, 160, 0.8)';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={[styles.container, { backgroundColor: isDark ? theme.colors.background : '#f8fafc' }]} 
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            style={[styles.header, { 
              paddingTop: headerPaddingTop,
              paddingBottom: headerPaddingBottom,
              paddingHorizontal: headerPaddingHorizontal,
            }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={[styles.backButton, {
                  width: getResponsiveSize(40, 44, 48),
                  height: getResponsiveSize(40, 44, 48),
                }]} 
                onPress={handleGoBack}
              >
                <ArrowLeft size={getResponsiveSize(20, 24, 26)} color="white" />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={[styles.headerTitle, {
                  fontSize: getResponsiveSize(22, 26, 30),
                }]}>
                  {isOtpSent ? 'Verify Code' : 'Create Account'}
                </Text>
                <Text style={[styles.headerSubtitle, {
                  fontSize: getResponsiveSize(13, 14, 15),
                  marginTop: getResponsiveSize(2, 4, 6),
                  marginBottom: getResponsiveSize(4, 6, 8),
                }]}>
                  {isOtpSent ? 'Enter the verification code sent to your phone' : 'Join us and start managing your finances'}
                </Text>
              </View>
              
              <View style={[styles.spacer, {
                width: getResponsiveSize(40, 44, 48),
              }]} />
            </View>
          </LinearGradient>
          
          <View style={[styles.formContainer, { 
            backgroundColor: isDark ? theme.colors.surface : 'white',
            paddingHorizontal: getResponsiveSize(16, 20, 24),
            paddingTop: getResponsiveSize(24, 28, 32),
            marginHorizontal: getResponsiveSize(12, 16, 20),
            marginTop: getResponsiveSize(-16, -20, -24),
            borderRadius: getResponsiveSize(16, 18, 20),
            shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 8,
          }]}>
            {!isOtpSent ? (
              <>
                {/* Name Input */}
                <View style={[styles.inputWrapper, {
                  marginBottom: getResponsiveSize(14, 18, 22),
                  marginTop: getResponsiveSize(2, 4, 6),
                }]}>
                  <Text style={[styles.inputLabel, { 
                    color: isDark ? theme.colors.text : '#1e293b',
                    fontSize: getResponsiveSize(16, 17, 18),
                    fontWeight: '700',
                  }]}>
                    Full Name
                  </Text>
                  <View style={[styles.inputContainer, {
                    borderColor: errors.name ? (isDark ? '#f87171' : '#ef4444') : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f8fafc',
                  }]}>
                    <User size={20} color={isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: isDark ? theme.colors.text : '#1e293b' }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8'}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                  </View>
                  {errors.name && (
                    <Text style={[styles.errorText, { color: isDark ? '#f87171' : '#ef4444' }]}>
                      {errors.name}
                    </Text>
                  )}
                </View>

                {/* Phone Number Input */}
                <View style={[styles.inputWrapper, {
                  marginBottom: getResponsiveSize(20, 24, 28),
                }]}>
                  <Text style={[styles.inputLabel, { 
                    color: isDark ? theme.colors.text : '#1e293b',
                    fontSize: getResponsiveSize(16, 17, 18),
                    fontWeight: '700',
                  }]}>
                    Mobile Number
                  </Text>
                  <View style={[styles.inputContainer, {
                    borderColor: errors.phone ? (isDark ? '#f87171' : '#ef4444') : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f8fafc',
                  }]}>
                    <Phone size={20} color={isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: isDark ? theme.colors.text : '#1e293b' }]}
                      value={phoneNumber}
                      onChangeText={(text) => {
                        // Ensure +977 prefix is always present
                        if (!text.startsWith('+977')) {
                          setPhoneNumber('+977');
                        } else {
                          setPhoneNumber(text);
                        }
                      }}
                      placeholder="+977 98XXXXXXXX"
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8'}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      maxLength={14}
                    />
                  </View>
                  {errors.phone && (
                    <Text style={[styles.errorText, { color: isDark ? '#f87171' : '#ef4444' }]}>
                      {errors.phone}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              /* OTP Input */
              <View style={[styles.inputWrapper, {
                marginBottom: getResponsiveSize(20, 24, 28),
              }]}>
                <Text style={[styles.inputLabel, { 
                  color: isDark ? theme.colors.text : '#1e293b',
                  fontSize: getResponsiveSize(16, 17, 18),
                  fontWeight: '700',
                }]}>
                  Verification Code
                </Text>
                <Text style={[styles.otpHint, { 
                  color: otpExpired ? (isDark ? '#f87171' : '#ef4444') : (isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b'),
                  fontSize: getResponsiveSize(12, 13, 14),
                  marginBottom: 8,
                }]}>
                  {otpExpired 
                    ? 'OTP has expired. Please request a new code.' 
                    : `Enter the 6-digit code sent to your phone.${timeRemaining ? ` Expires in ${timeRemaining}` : ''}`
                  }
                </Text>
                <View style={[styles.inputContainer, {
                  borderColor: errors.otp ? (isDark ? '#f87171' : '#ef4444') : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'),
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f8fafc',
                }]}>
                  <MessageSquare size={20} color={isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? theme.colors.text : '#1e293b', textAlign: 'center', letterSpacing: 4 }]}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="000000"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94a3b8'}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    maxLength={6}
                  />
                </View>
                {errors.otp && (
                  <Text style={[styles.errorText, { color: isDark ? '#f87171' : '#ef4444' }]}>
                    {errors.otp}
                  </Text>
                )}
                <View style={styles.otpActions}>
                  <TouchableOpacity 
                    style={[styles.resendButton, {
                      backgroundColor: (countdown > 0 || isResending) ? 'rgba(0,0,0,0.05)' : 'transparent',
                      borderRadius: 8,
                    }]}
                    onPress={() => handleSendOtp(true)}
                    disabled={countdown > 0 || isResending}
                  >
                    <Text style={[styles.resendText, { 
                      color: countdown > 0 ? (isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b') : '#2563eb',
                      opacity: countdown > 0 ? 0.6 : 1,
                      fontWeight: countdown > 0 ? '500' : '600'
                    }]}>
                      {isResending ? 'Resending...' : countdown > 0 ? `Resend OTP (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.changeNumberButton}
                    onPress={() => {
                      setIsOtpSent(false);
                      setOtp('');
                      setErrors({});
                      setCountdown(0);
                      setOtpExpiryTime(null);
                      setOtpExpired(false);
                      setTimeRemaining('');
                    }}
                  >
                    <Text style={[styles.changeNumberText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b' }]}>
                      Change Phone Number
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Action Button */}
            <TouchableOpacity 
              style={[styles.signUpButton, {
                minHeight: getResponsiveSize(48, 52, 56),
                opacity: (isLoading || (isOtpSent && otpExpired)) ? 0.7 : 1,
              }]} 
              onPress={() => {
                Keyboard.dismiss();
                setTimeout(() => {
                  isOtpSent ? handleVerifyOtp() : handleSendOtp(false);
                }, 100);
              }}
              disabled={isLoading || (isOtpSent && otpExpired)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.buttonGradient}
              >
                <Text style={[styles.signUpButtonText, {
                  fontSize: getResponsiveSize(14, 15, 16),
                }]}>
                  {isLoading 
                    ? (isOtpSent ? 'Verifying...' : 'Sending OTP...') 
                    : (isOtpSent ? 'Verify OTP' : 'Send OTP')
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={[styles.signInContainer, {
              marginTop: getResponsiveSize(24, 28, 32),
              marginBottom: getResponsiveSize(12, 16, 20),
            }]}>
              <Text style={[styles.signInText, { 
                color: isDark ? theme.colors.textSecondary : '#64748b',
                fontSize: getResponsiveSize(14, 15, 16),
              }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={[styles.signInLink, { 
                  color: '#2563eb',
                  fontSize: getResponsiveSize(14, 15, 16),
                }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '400',
  },
  spacer: {
    // Invisible spacer to balance the layout
  },
  formContainer: {
    // Dynamic styles applied inline
  },
  inputWrapper: {
    // Dynamic styles applied inline
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  otpActions: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeNumberButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeNumberText: {
    fontSize: 13,
    fontWeight: '500',
  },
  otpHint: {
    fontStyle: 'italic',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    // Dynamic styles applied inline
  },
  signInLink: {
    fontWeight: '600',
  },
});