import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authReducer from './slices/authSlice';
import treesReducer from './slices/treesSlice';

// Persist configuration
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'tokens'], // Only persist user and tokens
};

const treesPersistConfig = {
  key: 'trees',
  storage: AsyncStorage,
};

// Apply persistence to reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedTreesReducer = persistReducer(treesPersistConfig, treesReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    trees: persistedTreesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Export persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;