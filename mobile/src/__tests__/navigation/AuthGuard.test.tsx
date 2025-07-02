import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import authSlice, { AuthState } from '../../store/slices/authSlice';
import treesSlice from '../../store/slices/treesSlice';
import AppNavigator from '../../navigation/AppNavigator';

import { View, Text } from 'react-native';

// Mock the navigation screens to avoid complex rendering
jest.mock('../../screens/auth/LoginScreen', () => {
  return function MockLoginScreen() {
    return <View testID="mock-login-screen"><Text>Mock Login</Text></View>;
  };
});

jest.mock('../../screens/trees/TreeListScreen', () => {
  return function MockTreeListScreen() {
    return <View testID="mock-tree-list-screen"><Text>Mock Tree List</Text></View>;
  };
});

// Create mock store function
const createMockStore = (authState: Partial<AuthState> = {}) => {
  const defaultAuthState: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    ...authState,
  };

  return configureStore({
    reducer: {
      auth: authSlice,
      trees: treesSlice,
    },
    preloadedState: {
      auth: defaultAuthState,
      trees: { trees: [], selectedTreeId: null, isLoading: false, error: null },
    },
  });
};

// Helper to render with providers
const renderWithProviders = (store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

describe('Authentication Route Guard', () => {
  describe('Route Protection Logic', () => {
    it('should block access to main app when not authenticated', () => {
      const unauthenticatedStore = createMockStore({
        isAuthenticated: false,
        user: null,
        tokens: null,
      });

      renderWithProviders(unauthenticatedStore);

      // Should show auth screen, not main app
      expect(screen.getByTestId('auth-navigator')).toBeTruthy();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });

    it('should grant access to main app when authenticated', () => {
      const authenticatedStore = createMockStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'free',
        },
        tokens: {
          accessToken: 'valid-token',
          refreshToken: 'valid-refresh',
          expiresAt: Date.now() + 3600000, // 1 hour from now
        },
      });

      renderWithProviders(authenticatedStore);

      // Should show main app, not auth screen
      expect(screen.getByTestId('main-navigator')).toBeTruthy();
      expect(screen.queryByTestId('auth-navigator')).toBeNull();
    });

    it('should show loading state during authentication check', () => {
      const loadingStore = createMockStore({
        isLoading: true,
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(loadingStore);

      // Should show loading, not either navigator
      expect(screen.getByTestId('app-loading')).toBeTruthy();
      expect(screen.queryByTestId('auth-navigator')).toBeNull();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });

    it('should prioritize loading state over authentication state', () => {
      const loadingAndAuthenticatedStore = createMockStore({
        isLoading: true,
        isAuthenticated: true, // Even though authenticated, should still show loading
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'free',
        },
      });

      renderWithProviders(loadingAndAuthenticatedStore);

      // Loading should take precedence
      expect(screen.getByTestId('app-loading')).toBeTruthy();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });
  });

  describe('Authentication State Transitions', () => {
    it('should handle logout transition correctly', () => {
      // Start authenticated
      const authenticatedStore = createMockStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'free',
        },
      });

      const { rerender } = renderWithProviders(authenticatedStore);
      expect(screen.getByTestId('main-navigator')).toBeTruthy();

      // Simulate logout
      const loggedOutStore = createMockStore({
        isAuthenticated: false,
        user: null,
        tokens: null,
      });

      rerender(
        <Provider store={loggedOutStore}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </Provider>
      );

      expect(screen.getByTestId('auth-navigator')).toBeTruthy();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });

    it('should handle login transition correctly', () => {
      // Start unauthenticated
      const unauthenticatedStore = createMockStore({
        isAuthenticated: false,
        user: null,
      });

      const { rerender } = renderWithProviders(unauthenticatedStore);
      expect(screen.getByTestId('auth-navigator')).toBeTruthy();

      // Simulate login
      const authenticatedStore = createMockStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscription: 'free',
        },
      });

      rerender(
        <Provider store={authenticatedStore}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </Provider>
      );

      expect(screen.getByTestId('main-navigator')).toBeTruthy();
      expect(screen.queryByTestId('auth-navigator')).toBeNull();
    });
  });

  describe('Error State Handling', () => {
    it('should show auth screen when there is an authentication error', () => {
      const errorStore = createMockStore({
        isAuthenticated: false,
        user: null,
        tokens: null,
        error: 'Authentication failed',
        isLoading: false,
      });

      renderWithProviders(errorStore);

      // Should show auth screen to allow retry
      expect(screen.getByTestId('auth-navigator')).toBeTruthy();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });

    it('should not show loading when there is an error', () => {
      const errorStore = createMockStore({
        isAuthenticated: false,
        user: null,
        error: 'Login failed',
        isLoading: false, // Loading false with error
      });

      renderWithProviders(errorStore);

      expect(screen.queryByTestId('app-loading')).toBeNull();
      expect(screen.getByTestId('auth-navigator')).toBeTruthy();
    });
  });
});