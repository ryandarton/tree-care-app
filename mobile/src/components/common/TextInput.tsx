import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';

export interface TextInputProps {
  value?: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'numeric';
  size?: 'small' | 'medium' | 'large';
  multiline?: boolean;
  numberOfLines?: number;
  testID?: string;
  accessibilityLabel?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  placeholder,
  onChangeText,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  type = 'text',
  size = 'medium',
  multiline = false,
  numberOfLines,
  testID,
  accessibilityLabel,
}) => {
  const hasError = !!error;
  
  const inputStyle: TextStyle = {
    ...styles.input,
    ...sizes[size],
    ...(hasError && styles.inputError),
    ...(disabled && styles.inputDisabled),
    ...(multiline && styles.inputMultiline),
    ...(multiline && numberOfLines && { minHeight: 80 }),
  };

  const containerStyle: ViewStyle = {
    ...styles.container,
  };

  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'numeric':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const getAutoCapitalize = () => {
    return type === 'email' || type === 'password' ? 'none' : 'sentences';
  };

  const getAccessibilityHint = () => {
    if (error) return `Error: ${error}`;
    if (helperText && !error) return helperText;
    return undefined;
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <RNTextInput
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        editable={!disabled}
        keyboardType={getKeyboardType()}
        autoCapitalize={getAutoCapitalize()}
        secureTextEntry={type === 'password'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        testID={testID}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={getAccessibilityHint()}
        placeholderTextColor="#999"
      />
      
      {(error || helperText) && (
        <Text style={hasError ? styles.errorText : styles.helperText}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    fontWeight: '400',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
});

const sizes: Record<'small' | 'medium' | 'large', TextStyle> = {
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
  },
};