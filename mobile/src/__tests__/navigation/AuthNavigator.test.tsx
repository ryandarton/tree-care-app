import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from '../../navigation/AuthNavigator';

import { View, Text } from 'react-native';

// Mock the screens
jest.mock('../../screens/auth/LoginScreen', () => {
  return function MockLoginScreen() {
    return <View testID="login-screen"><Text>Login Screen</Text></View>;
  };
});

jest.mock('../../screens/auth/SignupScreen', () => {
  return function MockSignupScreen() {
    return <View testID="signup-screen"><Text>Signup Screen</Text></View>;
  };
});

jest.mock('../../screens/auth/ForgotPasswordScreen', () => {
  return function MockForgotPasswordScreen() {
    return <View testID="forgot-password-screen"><Text>Forgot Password Screen</Text></View>;
  };
});

// Helper to render with navigation
const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

describe('AuthNavigator', () => {
  it('should render auth stack navigator', () => {
    renderWithNavigation(<AuthNavigator />);
    
    expect(screen.getByTestId('auth-navigator')).toBeTruthy();
  });

  it('should have login screen as initial route', () => {
    renderWithNavigation(<AuthNavigator />);
    
    // Login screen should be the default/initial screen
    expect(screen.getByTestId('login-screen')).toBeTruthy();
  });

  it('should be accessible via navigation', () => {
    const navigator = renderWithNavigation(<AuthNavigator />);
    
    // Should render without navigation errors
    expect(navigator).toBeTruthy();
  });
});