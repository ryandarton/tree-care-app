import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface TreeSpecies {
  scientificName: string;
  commonName: string;
  speciesId: string;
}

export interface TreeLocation {
  yardPosition: string;
  coordinates: [number, number]; // [latitude, longitude]
  sunExposure: string;
  soilType: string;
}

export interface TreeStatus {
  height: number; // in feet
  trunkDiameter: number; // in inches
  canopySpread: number; // in feet
  healthScore: number; // 0-100
  growthStage: 'seedling' | 'juvenile' | 'young_adult' | 'mature';
}

export interface TreeGoals {
  targetHeight: number;
  clearanceNeeded: number;
  aestheticStyle: 'natural' | 'formal' | 'pollarded';
}

export interface Tree {
  id: string;
  userId: string;
  name: string;
  species: TreeSpecies;
  plantedDate: string;
  location: TreeLocation;
  currentStatus: TreeStatus;
  goals: TreeGoals;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreeData {
  name: string;
  species: string;
  plantedDate?: string;
  location?: Partial<TreeLocation>;
  goals?: Partial<TreeGoals>;
}

export interface TreesState {
  trees: Tree[];
  selectedTreeId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Async thunks
export const fetchTrees = createAsyncThunk<
  Tree[],
  string,
  { rejectValue: string }
>('trees/fetchTrees', async (userId, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulated successful response - return empty array for now
    return [];
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch trees');
  }
});

export const addTree = createAsyncThunk<
  Tree,
  CreateTreeData,
  { rejectValue: string }
>('trees/addTree', async (treeData, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulated successful response
    const newTree: Tree = {
      id: `tree-${Date.now()}`,
      userId: 'user-123', // TODO: Get from auth state
      name: treeData.name,
      species: {
        scientificName: 'Quercus alba',
        commonName: 'White Oak',
        speciesId: treeData.species,
      },
      plantedDate: treeData.plantedDate || new Date().toISOString().split('T')[0],
      location: {
        yardPosition: treeData.location?.yardPosition || 'backyard',
        coordinates: treeData.location?.coordinates || [0, 0],
        sunExposure: treeData.location?.sunExposure || 'partial sun',
        soilType: treeData.location?.soilType || 'loam',
      },
      currentStatus: {
        height: 2.0,
        trunkDiameter: 0.5,
        canopySpread: 1.5,
        healthScore: 100,
        growthStage: 'seedling',
      },
      goals: {
        targetHeight: treeData.goals?.targetHeight || 12,
        clearanceNeeded: treeData.goals?.clearanceNeeded || 8,
        aestheticStyle: treeData.goals?.aestheticStyle || 'natural',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return newTree;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to add tree');
  }
});

export const updateTree = createAsyncThunk<
  Tree,
  Tree,
  { rejectValue: string }
>('trees/updateTree', async (tree, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulated successful response
    return {
      ...tree,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update tree');
  }
});

export const deleteTree = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('trees/deleteTree', async (treeId, { rejectWithValue }) => {
  try {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulated successful response
    return treeId;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete tree');
  }
});

// Initial state
const initialState: TreesState = {
  trees: [],
  selectedTreeId: null,
  isLoading: false,
  error: null,
};

// Trees slice
const treesSlice = createSlice({
  name: 'trees',
  initialState,
  reducers: {
    setSelectedTree: (state, action: PayloadAction<string>) => {
      state.selectedTreeId = action.payload;
    },
    clearSelectedTree: (state) => {
      state.selectedTreeId = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Trees
    builder
      .addCase(fetchTrees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trees = action.payload;
        state.error = null;
      })
      .addCase(fetchTrees.rejected, (state, action) => {
        state.isLoading = false;
        state.trees = [];
        state.error = action.payload || action.error?.message || 'Failed to fetch trees';
      });

    // Add Tree
    builder
      .addCase(addTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTree.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trees.push(action.payload);
        state.error = null;
      })
      .addCase(addTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to add tree';
      });

    // Update Tree
    builder
      .addCase(updateTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTree.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.trees.findIndex(tree => tree.id === action.payload.id);
        if (index !== -1) {
          state.trees[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to update tree';
      });

    // Delete Tree
    builder
      .addCase(deleteTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTree.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trees = state.trees.filter(tree => tree.id !== action.payload);
        // Clear selection if deleted tree was selected
        if (state.selectedTreeId === action.payload) {
          state.selectedTreeId = null;
        }
        state.error = null;
      })
      .addCase(deleteTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to delete tree';
      });
  },
});

// Export actions
export const { setSelectedTree, clearSelectedTree, setError, setLoading } = treesSlice.actions;

// Export reducer
export default treesSlice.reducer;