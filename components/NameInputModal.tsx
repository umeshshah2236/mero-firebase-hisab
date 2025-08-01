import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Heart, ArrowRight } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface NameInputModalProps {
  visible: boolean;
  onSave: (name: string) => void;
  onSkip: () => void;
}

export default function NameInputModal({ visible, onSave, onSkip }: NameInputModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Handle keyboard visibility to prevent blinking
  useEffect(() => {
    if (!visible) {
      setName('');
      setIsKeyboardVisible(false);
      return;
    }

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    // Auto-focus input after modal is fully visible
    const focusTimeout = setTimeout(() => {
      if (visible && inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      clearTimeout(focusTimeout);
    };
  }, [visible]);

  const handleSave = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      if (name.trim()) {
        onSave(name.trim());
      } else {
        onSkip();
      }
      setName('');
    }, 100);
  };

  const handleSkip = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      onSkip();
      setName('');
    }, 100);
  };

  const handleModalPress = () => {
    // Prevent modal from closing when tapping inside
  };

  // Clean, modern color scheme
  const modalBackgroundColor = '#FFFFFF';
  const inputBackgroundColor = '#F8FAFC';
  const inputBorderColor = '#E2E8F0';
  const inputTextColor = '#1A202C';
  const placeholderTextColor = '#64748B';
  const textColor = '#1A202C';
  const secondaryTextColor = '#64748B';
  const accentColor = '#3B82F6';

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback onPress={handleModalPress}>
              <View style={[styles.modalContent, { 
                backgroundColor: modalBackgroundColor,
                transform: isKeyboardVisible && Platform.OS === 'android' ? [{ translateY: -50 }] : [{ translateY: 0 }]
              }]}>
          {/* Header with decorative element */}
          <View style={styles.header}>
            <View style={[styles.decorativeBar, { backgroundColor: accentColor }]} />
            <View style={[styles.iconContainer, { backgroundColor: accentColor + '15' }]}>
              <Heart size={24} color={accentColor} fill={accentColor + '30'} />
            </View>
          </View>

          {/* Welcome content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: textColor }]}>
              स्वागत छ!
            </Text>
          </View>

          {/* Input section */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: textColor }]}>तपाईंको पूरा नाम</Text>
            <View style={[styles.inputContainer, { 
              borderColor: name.trim() ? accentColor : inputBorderColor,
              backgroundColor: inputBackgroundColor
            }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: inputTextColor }, Platform.OS === 'web' && styles.webInput]}
                value={name}
                onChangeText={setName}
                placeholder="यहाँ आफ्नो नाम लेख्नुहोस्"
                placeholderTextColor={placeholderTextColor}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                autoFocus={false}
                blurOnSubmit={true}
                selectTextOnFocus={false}
                // Improved touch sensitivity
                editable={true}
                contextMenuHidden={false}
                showSoftInputOnFocus={true}
                spellCheck={false}
                autoComplete="off"
                textContentType="none"
                // Enhanced touch response
                onFocus={() => {
                  // Ensure immediate focus response
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                onPressIn={() => {
                  // Immediate response to touch
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: accentColor }]} 
              onPress={handleSave}
            >
              <Text style={styles.primaryButtonText}>
                {name.trim() ? 'सुरु गरौं' : 'जारी राख्नुहोस्'}
              </Text>
              <ArrowRight size={18} color="white" style={styles.buttonIcon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, { color: secondaryTextColor }]}>
                अहिलेको लागि छोड्नुहोस्
              </Text>
            </TouchableOpacity>
          </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    position: 'relative',
  },
  decorativeBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 0,
  },

  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  webInput: {
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    }),
    cursor: 'text',
  } as any,
  actionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 4,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});