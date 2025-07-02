import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistConfig } from 'redux-persist';

// Redux persist configuration
export const persistConfig: PersistConfig<any> = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'trees'], // Only persist auth and trees state
  blacklist: [], // No blacklisted slices for now
  timeout: 10000, // 10 second timeout for rehydration
  debug: process.env.NODE_ENV !== 'production', // Enable debug mode in development
};

// Auth slice specific persist config (if needed for fine-grained control)
export const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'tokens'], // Only persist user and tokens, not loading/error states
};

// Trees slice specific persist config (if needed for fine-grained control)
export const treesPersistConfig = {
  key: 'trees',
  storage: AsyncStorage,
  whitelist: ['trees', 'selectedTreeId'], // Persist trees and selection, not loading/error states
};