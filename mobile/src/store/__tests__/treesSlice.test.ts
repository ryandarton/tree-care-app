import { configureStore } from '@reduxjs/toolkit';
import treesReducer, {
  addTree,
  updateTree,
  deleteTree,
  fetchTrees,
  setSelectedTree,
  clearSelectedTree,
  setError,
  setLoading,
} from '../slices/treesSlice';

// Define the test store type
type TestStore = ReturnType<typeof configureStore<{trees: ReturnType<typeof treesReducer>}>>;

// Mock tree data for testing
const mockTree = {
  id: 'tree-123',
  userId: 'user-123',
  name: 'Front Yard Oak',
  species: {
    scientificName: 'Quercus rubra',
    commonName: 'Red Oak',
    speciesId: 'oak-red',
  },
  plantedDate: '2023-01-15',
  location: {
    yardPosition: 'front yard',
    coordinates: [40.7128, -74.0060] as [number, number],
    sunExposure: 'full sun',
    soilType: 'clay',
  },
  currentStatus: {
    height: 8.5,
    trunkDiameter: 3.2,
    canopySpread: 6.0,
    healthScore: 85,
    growthStage: 'juvenile' as const,
  },
  goals: {
    targetHeight: 15,
    clearanceNeeded: 8,
    aestheticStyle: 'natural' as const,
  },
  createdAt: '2023-01-15T10:30:00Z',
  updatedAt: '2023-07-02T14:20:00Z',
};

const mockTree2 = {
  ...mockTree,
  id: 'tree-456',
  name: 'Backyard Maple',
  species: {
    scientificName: 'Acer saccharum',
    commonName: 'Sugar Maple',
    speciesId: 'maple-sugar',
  },
};

describe('treesSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: { trees: treesReducer },
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().trees;
      expect(state).toEqual({
        trees: [],
        selectedTreeId: null,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('fetchTrees action', () => {
    it('should handle fetchTrees.pending', () => {
      store.dispatch(fetchTrees.pending('request-id', 'user-123'));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle fetchTrees.fulfilled', () => {
      const trees = [mockTree, mockTree2];
      store.dispatch(fetchTrees.fulfilled(trees, 'request-id', 'user-123'));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees).toEqual(trees);
      expect(state.error).toBe(null);
    });

    it('should handle fetchTrees.rejected', () => {
      const error = new Error('Failed to fetch trees');
      store.dispatch(fetchTrees.rejected(error, 'request-id', 'user-123'));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees).toEqual([]);
      expect(state.error).toBe('Failed to fetch trees');
    });
  });

  describe('addTree action', () => {
    it('should handle addTree.pending', () => {
      const treeData = { name: 'New Tree', species: 'oak' };
      store.dispatch(addTree.pending('request-id', treeData));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle addTree.fulfilled', () => {
      const treeData = { name: 'New Tree', species: 'oak' };
      store.dispatch(addTree.fulfilled(mockTree, 'request-id', treeData));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees).toContain(mockTree);
      expect(state.error).toBe(null);
    });

    it('should handle addTree.rejected', () => {
      const error = new Error('Failed to add tree');
      const treeData = { name: 'New Tree', species: 'oak' };
      store.dispatch(addTree.rejected(error, 'request-id', treeData));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to add tree');
    });
  });

  describe('updateTree action', () => {
    beforeEach(() => {
      // Add a tree to update
      store.dispatch(fetchTrees.fulfilled([mockTree], 'request-id', 'user-123'));
    });

    it('should handle updateTree.fulfilled', () => {
      const updatedTree = { ...mockTree, name: 'Updated Oak Tree' };
      store.dispatch(updateTree.fulfilled(updatedTree, 'request-id', updatedTree));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees[0].name).toBe('Updated Oak Tree');
      expect(state.error).toBe(null);
    });

    it('should handle updateTree.rejected', () => {
      const error = new Error('Failed to update tree');
      store.dispatch(updateTree.rejected(error, 'request-id', mockTree));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to update tree');
    });
  });

  describe('deleteTree action', () => {
    beforeEach(() => {
      // Add trees to delete
      store.dispatch(fetchTrees.fulfilled([mockTree, mockTree2], 'request-id', 'user-123'));
    });

    it('should handle deleteTree.fulfilled', () => {
      store.dispatch(deleteTree.fulfilled('tree-123', 'request-id', 'tree-123'));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees).toHaveLength(1);
      expect(state.trees[0].id).toBe('tree-456');
      expect(state.error).toBe(null);
    });

    it('should handle deleteTree.rejected', () => {
      const error = new Error('Failed to delete tree');
      store.dispatch(deleteTree.rejected(error, 'request-id', 'tree-123'));
      const state = store.getState().trees;
      
      expect(state.isLoading).toBe(false);
      expect(state.trees).toHaveLength(2); // No trees removed
      expect(state.error).toBe('Failed to delete tree');
    });

    it('should clear selectedTreeId when deleting selected tree', () => {
      // Select a tree first
      store.dispatch(setSelectedTree('tree-123'));
      
      // Delete the selected tree
      store.dispatch(deleteTree.fulfilled('tree-123', 'request-id', 'tree-123'));
      const state = store.getState().trees;
      
      expect(state.selectedTreeId).toBe(null);
    });
  });

  describe('synchronous actions', () => {
    beforeEach(() => {
      store.dispatch(fetchTrees.fulfilled([mockTree, mockTree2], 'request-id', 'user-123'));
    });

    it('should handle setSelectedTree', () => {
      store.dispatch(setSelectedTree('tree-123'));
      const state = store.getState().trees;
      
      expect(state.selectedTreeId).toBe('tree-123');
    });

    it('should handle clearSelectedTree', () => {
      store.dispatch(setSelectedTree('tree-123'));
      store.dispatch(clearSelectedTree());
      const state = store.getState().trees;
      
      expect(state.selectedTreeId).toBe(null);
    });

    it('should handle setError', () => {
      store.dispatch(setError('Custom error message'));
      const state = store.getState().trees;
      
      expect(state.error).toBe('Custom error message');
    });

    it('should handle setLoading', () => {
      store.dispatch(setLoading(true));
      expect(store.getState().trees.isLoading).toBe(true);
      
      store.dispatch(setLoading(false));
      expect(store.getState().trees.isLoading).toBe(false);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      store.dispatch(fetchTrees.fulfilled([mockTree, mockTree2], 'request-id', 'user-123'));
      store.dispatch(setSelectedTree('tree-123'));
    });

    it('should get selected tree', () => {
      const state = store.getState().trees;
      const selectedTree = state.trees.find(tree => tree.id === state.selectedTreeId);
      
      expect(selectedTree).toEqual(mockTree);
      expect(selectedTree?.id).toBe('tree-123');
    });

    it('should return null when no tree is selected', () => {
      store.dispatch(clearSelectedTree());
      const state = store.getState().trees;
      const selectedTree = state.trees.find(tree => tree.id === state.selectedTreeId);
      
      expect(selectedTree).toBeUndefined();
      expect(state.selectedTreeId).toBe(null);
    });
  });
});