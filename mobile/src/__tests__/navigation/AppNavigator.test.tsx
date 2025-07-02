import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer } from '@react-navigation/native';
import authSlice, { AuthState } from '../../store/slices/authSlice';
import treesSlice from '../../store/slices/treesSlice';
import AppNavigator from '../../navigation/AppNavigator';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
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
const renderWithProviders = (component: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('AppNavigator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('should render auth navigator', () => {
      const unauthenticatedStore = createMockStore({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(<AppNavigator />, unauthenticatedStore);

      // Should show login screen or auth stack
      expect(screen.getByTestId('auth-navigator')).toBeTruthy();
    });

    it('should not render main app navigator when unauthenticated', () => {
      const unauthenticatedStore = createMockStore({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(<AppNavigator />, unauthenticatedStore);

      // Should not show main app
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });
  });

  describe('when user is authenticated', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      subscription: 'free' as const,
    };

    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresAt: Date.now() + 3600000, // 1 hour from now
    };

    it('should render main navigator', () => {
      const authenticatedStore = createMockStore({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
      });

      renderWithProviders(<AppNavigator />, authenticatedStore);

      // Should show main app navigator
      expect(screen.getByTestId('main-navigator')).toBeTruthy();
    });

    it('should not render auth navigator when authenticated', () => {
      const authenticatedStore = createMockStore({
        isAuthenticated: true,
        user: mockUser,
        tokens: mockTokens,
      });

      renderWithProviders(<AppNavigator />, authenticatedStore);

      // Should not show auth stack
      expect(screen.queryByTestId('auth-navigator')).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should show loading indicator when auth is loading', () => {
      const loadingStore = createMockStore({
        isLoading: true,
        isAuthenticated: false,
      });

      renderWithProviders(<AppNavigator />, loadingStore);

      // Should show loading state
      expect(screen.getByTestId('app-loading')).toBeTruthy();
    });

    it('should not show navigators while loading', () => {
      const loadingStore = createMockStore({
        isLoading: true,
        isAuthenticated: false,
      });

      renderWithProviders(<AppNavigator />, loadingStore);

      // Should not show either navigator while loading
      expect(screen.queryByTestId('auth-navigator')).toBeNull();
      expect(screen.queryByTestId('main-navigator')).toBeNull();
    });
  });
});