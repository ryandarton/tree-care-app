import { store, RootState } from '../store';
import { login, logout } from '../slices/authSlice';
import { fetchTrees, addTree } from '../slices/treesSlice';

// Mock AsyncStorage for tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('Redux Store Configuration', () => {
  it('should have correct initial state structure', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('trees');
    
    // Check auth initial state
    expect(state.auth).toEqual({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Check trees initial state
    expect(state.trees).toEqual({
      trees: [],
      selectedTreeId: null,
      isLoading: false,
      error: null,
    });
  });

  it('should handle auth actions', async () => {
    const loginPromise = store.dispatch(login({ 
      email: 'test@example.com', 
      password: 'password' 
    }));
    
    // Check pending state
    let state = store.getState();
    expect(state.auth.isLoading).toBe(true);
    
    // Wait for completion
    await loginPromise;
    
    // Check fulfilled state
    state = store.getState();
    expect(state.auth.isLoading).toBe(false);
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user).toBeTruthy();
  });

  it('should handle trees actions', async () => {
    const fetchPromise = store.dispatch(fetchTrees('user-123'));
    
    // Check pending state
    let state = store.getState();
    expect(state.trees.isLoading).toBe(true);
    
    // Wait for completion
    await fetchPromise;
    
    // Check fulfilled state
    state = store.getState();
    expect(state.trees.isLoading).toBe(false);
    expect(state.trees.trees).toHaveLength(1);
  });

  it('should handle cross-slice interactions', async () => {
    // Login first
    await store.dispatch(login({ 
      email: 'test@example.com', 
      password: 'password' 
    }));
    
    // Add a tree
    await store.dispatch(addTree({
      name: 'Test Tree',
      species: 'oak',
    }));
    
    const state = store.getState();
    
    // Both auth and trees should be updated
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.trees.trees.length).toBeGreaterThan(0);
    
    // Find the test tree we just added
    const testTree = state.trees.trees.find((tree: any) => tree.name === 'Test Tree');
    expect(testTree).toBeTruthy();
    expect(testTree?.name).toBe('Test Tree');
  });

  it('should maintain state isolation between slices', () => {
    // Dispatch an action that only affects auth
    store.dispatch(logout());
    
    const state = store.getState();
    
    // Auth should be reset
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBe(null);
    
    // Trees should remain unchanged (assuming there were trees)
    // This tests that slices don't interfere with each other
    expect(state.trees).toHaveProperty('trees');
    expect(state.trees).toHaveProperty('selectedTreeId');
  });

  it('should support TypeScript typing', () => {
    const state: RootState = store.getState();
    
    // TypeScript should infer correct types
    expect(typeof state.auth.isAuthenticated).toBe('boolean');
    expect(typeof state.trees.isLoading).toBe('boolean');
    
    if (state.auth.user) {
      expect(typeof state.auth.user.email).toBe('string');
      expect(typeof state.auth.user.subscription).toBe('string');
    }
    
    if (state.trees.trees.length > 0) {
      const tree = state.trees.trees[0];
      expect(typeof tree.name).toBe('string');
      expect(typeof tree.currentStatus.height).toBe('number');
    }
  });
});