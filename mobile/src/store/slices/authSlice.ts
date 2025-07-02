import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  subscription: 'free' | 'hobbyist' | 'arborist' | 'professional';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

// Helper function to check if tokens are expired
const isTokenExpired = (tokens: Tokens | null): boolean => {
  if (!tokens) return true;
  return Date.now() >= tokens.expiresAt;
};

// Async thunks
export const login = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual AWS Cognito login
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: 'user-123',
          email: credentials.email,
          name: 'Test User',
          subscription: 'free',
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: Date.now() + 3600000, // 1 hour
        },
      };
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
  }
});

export const refreshToken = createAsyncThunk<
  Tokens,
  string,
  { rejectValue: string }
>('auth/refreshToken', async (refreshTokenValue, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual AWS Cognito token refresh
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (refreshTokenValue === 'refresh-token-123') {
      return {
        accessToken: 'new-access-token-123',
        refreshToken: refreshTokenValue,
        expiresAt: Date.now() + 3600000, // 1 hour
      };
    } else {
      throw new Error('Refresh token expired');
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
  }
});

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = !isTokenExpired(action.payload.tokens);
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = action.payload || action.error?.message || 'Login failed';
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.tokens = action.payload;
        state.isAuthenticated = !isTokenExpired(action.payload);
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = action.payload || action.error?.message || 'Token refresh failed';
      });
  },
});

// Export actions
export const { logout, setUser, clearError, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;