import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  testID,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    ...styles.base,
    ...variants[variant],
    ...sizes[size],
    ...(isDisabled && styles.disabled),
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...textVariants[variant],
    ...textSizes[size],
    ...(isDisabled && styles.textDisabled),
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : '#2D5016'}
          testID="button-loading"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size for accessibility
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textDisabled: {
    opacity: 0.7,
  },
});

const variants: Record<'primary' | 'secondary' | 'outline', ViewStyle> = {
  primary: {
    backgroundColor: '#2D5016',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: '#2D5016',
    borderWidth: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#666',
    borderWidth: 1,
  },
};

const sizes: Record<'small' | 'medium' | 'large', ViewStyle> = {
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
};

const textVariants: Record<'primary' | 'secondary' | 'outline', TextStyle> = {
  primary: {
    color: '#fff',
  },
  secondary: {
    color: '#2D5016',
  },
  outline: {
    color: '#666',
  },
};

const textSizes: Record<'small' | 'medium' | 'large', TextStyle> = {
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 16,
  },
  large: {
    fontSize: 18,
  },
};