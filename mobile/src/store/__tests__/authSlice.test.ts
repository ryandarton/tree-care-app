import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  logout,
  refreshToken,
  setUser,
  clearError,
  setLoading,
} from '../slices/authSlice';

// Define the test store type
type TestStore = ReturnType<typeof configureStore<{auth: ReturnType<typeof authReducer>}>>;
type RootState = ReturnType<TestStore['getState']>;

// Mock user data for testing
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

describe('authSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('login action', () => {
    it('should handle login.pending', () => {
      store.dispatch(login.pending('request-id', { email: 'test@example.com', password: 'password' }));
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle login.fulfilled', () => {
      const payload = { user: mockUser, tokens: mockTokens };
      store.dispatch(login.fulfilled(payload, 'request-id', { email: 'test@example.com', password: 'password' }));
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.error).toBe(null);
    });

    it('should handle login.rejected', () => {
      const error = new Error('Invalid credentials');
      store.dispatch(login.rejected(error, 'request-id', { email: 'test@example.com', password: 'password' }));
      const state = store.getState().auth;
      
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.tokens).toBe(null);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('refreshToken action', () => {
    beforeEach(() => {
      // Set up authenticated state
      const payload = { user: mockUser, tokens: mockTokens };
      store.dispatch(login.fulfilled(payload, 'request-id', { email: 'test@example.com', password: 'password' }));
    });

    it('should handle refreshToken.fulfilled', () => {
      const newTokens = { ...mockTokens, accessToken: 'new-access-token' };
      store.dispatch(refreshToken.fulfilled(newTokens, 'request-id', mockTokens.refreshToken));
      const state = store.getState().auth;
      
      expect(state.tokens).toEqual(newTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle refreshToken.rejected', () => {
      const error = new Error('Refresh token expired');
      store.dispatch(refreshToken.rejected(error, 'request-id', mockTokens.refreshToken));
      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.tokens).toBe(null);
      expect(state.error).toBe('Refresh token expired');
    });
  });

  describe('synchronous actions', () => {
    it('should handle logout', () => {
      // Set up authenticated state first
      const payload = { user: mockUser, tokens: mockTokens };
      store.dispatch(login.fulfilled(payload, 'request-id', { email: 'test@example.com', password: 'password' }));
      
      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;
      
      expect(state.user).toBe(null);
      expect(state.tokens).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle setUser', () => {
      store.dispatch(setUser(mockUser));
      const state = store.getState().auth;
      
      expect(state.user).toEqual(mockUser);
    });

    it('should handle clearError', () => {
      // Set an error first
      const error = new Error('Test error');
      store.dispatch(login.rejected(error, 'request-id', { email: 'test@example.com', password: 'password' }));
      
      // Then clear it
      store.dispatch(clearError());
      const state = store.getState().auth;
      
      expect(state.error).toBe(null);
    });

    it('should handle setLoading', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().auth.isLoading).toBe(true);
      
      store.dispatch(setLoading(false));
      expect(store.getState().auth.isLoading).toBe(false);
    });
  });

  describe('token expiration', () => {
    it('should mark as unauthenticated when tokens are expired', () => {
      const expiredTokens = {
        ...mockTokens,
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      const payload = { user: mockUser, tokens: expiredTokens };
      store.dispatch(login.fulfilled(payload, 'request-id', { email: 'test@example.com', password: 'password' }));
      
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });

    it('should remain authenticated when tokens are valid', () => {
      const validTokens = {
        ...mockTokens,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
      const payload = { user: mockUser, tokens: validTokens };
      store.dispatch(login.fulfilled(payload, 'request-id', { email: 'test@example.com', password: 'password' }));
      
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });
  });
});