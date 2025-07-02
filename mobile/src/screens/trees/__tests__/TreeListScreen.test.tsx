import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import TreeListScreen from '../TreeListScreen';
import { store } from '../../../store';

// Mock navigation
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Redux hooks
const mockDispatch = jest.fn();
const mockTreesSelector = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => {
    if (selector.toString().includes('trees')) {
      return mockTreesSelector();
    }
    return jest.requireActual('react-redux').useSelector(selector);
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('TreeListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTreesSelector.mockReturnValue({ trees: [], isLoading: false, error: null });
  });

  describe('Empty State', () => {
    it('renders empty state when no trees exist', () => {
      const { getByText, getByTestId } = renderWithProviders(<TreeListScreen />);
      
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText('No Trees Yet')).toBeTruthy();
      expect(getByText('Start caring for your first tree!')).toBeTruthy();
      expect(getByText('Add Your First Tree')).toBeTruthy();
    });

    it('navigates to add tree screen from empty state', () => {
      const { getByText } = renderWithProviders(<TreeListScreen />);
      
      const addButton = getByText('Add Your First Tree');
      fireEvent.press(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('AddTree');
    });
  });

  describe('Tree List', () => {
    const mockTrees = [
      {
        id: '1',
        name: 'Front Yard Oak',
        species: 'Oak',
        plantedDate: '2023-05-15',
        location: 'Front Yard',
        status: 'healthy',
        nextActionDate: '2025-08-15',
        image: 'https://example.com/oak.jpg',
      },
      {
        id: '2',
        name: 'Backyard Maple',
        species: 'Maple',
        plantedDate: '2022-04-20',
        location: 'Backyard',
        status: 'warning',
        nextActionDate: '2025-07-10',
        image: 'https://example.com/maple.jpg',
      },
    ];

    beforeEach(() => {
      mockTreesSelector.mockReturnValue({ trees: mockTrees, isLoading: false, error: null });
    });

    it('renders list of trees', () => {
      const { getByText, queryByTestId } = renderWithProviders(<TreeListScreen />);
      
      expect(queryByTestId('empty-state')).toBeFalsy();
      expect(getByText('Front Yard Oak')).toBeTruthy();
      expect(getByText('Backyard Maple')).toBeTruthy();
      expect(getByText('Oak')).toBeTruthy();
      expect(getByText('Maple')).toBeTruthy();
    });

    it('shows tree status badges', () => {
      const { getByText } = renderWithProviders(<TreeListScreen />);
      
      expect(getByText('Healthy')).toBeTruthy();
      expect(getByText('Warning')).toBeTruthy();
    });

    it('navigates to tree detail on press', () => {
      const { getByText } = renderWithProviders(<TreeListScreen />);
      
      const treeCard = getByText('Front Yard Oak');
      fireEvent.press(treeCard.parent?.parent!);
      
      expect(mockNavigate).toHaveBeenCalledWith('TreeDetail', { treeId: '1' });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when fetching trees', () => {
      // Loading state only shows when loading and we have no existing trees
      mockTreesSelector.mockReturnValue({ trees: [], isLoading: true, error: null });
      
      const { getByTestId } = renderWithProviders(<TreeListScreen />);
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', () => {
      mockTreesSelector.mockReturnValue({ 
        trees: [], 
        isLoading: false, 
        error: 'Failed to load trees' 
      });
      
      const { getByText } = renderWithProviders(<TreeListScreen />);
      
      expect(getByText('Failed to load trees')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('retries fetch on error retry button press', () => {
      mockTreesSelector.mockReturnValue({ 
        trees: [], 
        isLoading: false, 
        error: 'Failed to load trees' 
      });
      
      const { getByText } = renderWithProviders(<TreeListScreen />);
      
      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);
      
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('Header Actions', () => {
    it('renders add tree button in header', () => {
      mockTreesSelector.mockReturnValue({ trees: [{ id: '1' }], isLoading: false, error: null });
      
      const { getByTestId } = renderWithProviders(<TreeListScreen />);
      
      expect(getByTestId('add-tree-button')).toBeTruthy();
    });

    it('navigates to add tree screen from header button', () => {
      mockTreesSelector.mockReturnValue({ trees: [{ id: '1' }], isLoading: false, error: null });
      
      const { getByTestId } = renderWithProviders(<TreeListScreen />);
      
      const addButton = getByTestId('add-tree-button');
      fireEvent.press(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('AddTree');
    });
  });

  describe('Pull to Refresh', () => {
    it('supports pull to refresh', async () => {
      mockTreesSelector.mockReturnValue({ trees: [{ id: '1' }], isLoading: false, error: null });
      
      const { getByTestId } = renderWithProviders(<TreeListScreen />);
      
      const flatList = getByTestId('tree-list');
      const { refreshControl } = flatList.props;
      
      expect(refreshControl).toBeTruthy();
      
      // Trigger refresh
      await refreshControl.props.onRefresh();
      
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});