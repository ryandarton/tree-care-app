import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import TreeDetailScreen from '../TreeDetailScreen';
import { store } from '../../../store';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRoute = {
  params: { treeId: 'tree-123' },
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
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

const mockTree = {
  id: 'tree-123',
  userId: 'user-123',
  name: 'Front Yard Oak',
  species: {
    scientificName: 'Quercus alba',
    commonName: 'White Oak',
    speciesId: 'oak',
  },
  plantedDate: '2023-05-15',
  location: {
    yardPosition: 'Front Yard',
    coordinates: [40.7128, -74.0060],
    sunExposure: 'partial sun',
    soilType: 'loam',
  },
  currentStatus: {
    height: 12.5,
    trunkDiameter: 4.2,
    canopySpread: 8.3,
    healthScore: 85,
    growthStage: 'young_adult',
  },
  goals: {
    targetHeight: 20,
    clearanceNeeded: 10,
    aestheticStyle: 'natural',
  },
  createdAt: '2023-05-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('TreeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockTreesSelector.mockReturnValue({
      trees: [mockTree],
      selectedTreeId: 'tree-123',
      isLoading: false,
      error: null,
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when fetching tree data', () => {
      mockTreesSelector.mockReturnValue({
        trees: [],
        selectedTreeId: null,
        isLoading: true,
        error: null,
      });
      
      const { getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('shows error message when tree not found', () => {
      mockTreesSelector.mockReturnValue({
        trees: [],
        selectedTreeId: null,
        isLoading: false,
        error: null,
      });
      
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('Tree not found')).toBeTruthy();
      expect(getByText('Go Back')).toBeTruthy();
    });

    it('navigates back when Go Back is pressed', () => {
      mockTreesSelector.mockReturnValue({
        trees: [],
        selectedTreeId: null,
        isLoading: false,
        error: null,
      });
      
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Go Back'));
      
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Tab Navigation', () => {
    it('renders all tabs', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('Overview')).toBeTruthy();
      expect(getByText('Health')).toBeTruthy();
      expect(getByText('History')).toBeTruthy();
      expect(getByText('Actions')).toBeTruthy();
    });

    it('shows overview tab by default', () => {
      const { getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByTestId('overview-tab-content')).toBeTruthy();
    });

    it('switches to health tab when pressed', () => {
      const { getByText, getByTestId, queryByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Health'));
      
      expect(queryByTestId('overview-tab-content')).toBeFalsy();
      expect(getByTestId('health-tab-content')).toBeTruthy();
    });

    it('switches to history tab when pressed', () => {
      const { getByText, getByTestId, queryByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('History'));
      
      expect(queryByTestId('overview-tab-content')).toBeFalsy();
      expect(getByTestId('history-tab-content')).toBeTruthy();
    });

    it('switches to actions tab when pressed', () => {
      const { getByText, getByTestId, queryByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      
      expect(queryByTestId('overview-tab-content')).toBeFalsy();
      expect(getByTestId('actions-tab-content')).toBeTruthy();
    });
  });

  describe('Overview Tab', () => {
    it('displays tree basic information', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('Front Yard Oak')).toBeTruthy();
      expect(getByText('White Oak')).toBeTruthy();
      expect(getByText('Quercus alba')).toBeTruthy();
      expect(getByText('Front Yard')).toBeTruthy();
      expect(getByText(/Planted on May \d{1,2}, 2023/)).toBeTruthy();
    });

    it('displays current measurements', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('12.5 ft')).toBeTruthy(); // height
      expect(getByText('4.2 in')).toBeTruthy(); // trunk diameter
      expect(getByText('8.3 ft')).toBeTruthy(); // canopy spread
    });

    it('displays growth goals', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('Target Height: 20 ft')).toBeTruthy();
      expect(getByText('Clearance Needed: 10 ft')).toBeTruthy();
      expect(getByText('Style: Natural')).toBeTruthy();
    });
  });

  describe('Health Tab', () => {
    it('displays health score', () => {
      const { getByText, getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Health'));
      
      expect(getByText('85%')).toBeTruthy();
      expect(getByText('Good Health')).toBeTruthy();
      expect(getByTestId('health-score-indicator')).toHaveStyle({ 
        backgroundColor: '#10B981' // green for good health
      });
    });

    it('displays growth stage', () => {
      const { getByText, getAllByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Health'));
      
      const growthStageElements = getAllByText('Growth Stage');
      expect(growthStageElements.length).toBeGreaterThan(0);
      expect(getByText('Young Adult')).toBeTruthy();
    });

    it('displays health recommendations', () => {
      const { getByText, getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Health'));
      
      expect(getByTestId('health-recommendations')).toBeTruthy();
    });
  });

  describe('History Tab', () => {
    it('shows empty state when no history', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('History'));
      
      expect(getByText('No history recorded yet')).toBeTruthy();
      expect(getByText('Take a photo to start tracking progress')).toBeTruthy();
    });

    it('shows add photo button', () => {
      const { getByText, getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('History'));
      
      expect(getByTestId('add-photo-button')).toBeTruthy();
    });

    it('navigates to camera when add photo is pressed', () => {
      const { getByText, getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('History'));
      fireEvent.press(getByTestId('add-photo-button'));
      
      expect(mockNavigate).toHaveBeenCalledWith('Camera', { treeId: 'tree-123' });
    });
  });

  describe('Actions Tab', () => {
    it('displays action buttons', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      
      expect(getByText('Take Photo')).toBeTruthy();
      expect(getByText('Edit Tree Info')).toBeTruthy();
      expect(getByText('Set Reminder')).toBeTruthy();
      expect(getByText('Delete Tree')).toBeTruthy();
    });

    it('navigates to camera when take photo is pressed', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      fireEvent.press(getByText('Take Photo'));
      
      expect(mockNavigate).toHaveBeenCalledWith('Camera', { treeId: 'tree-123' });
    });

    it('navigates to edit screen when edit is pressed', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      fireEvent.press(getByText('Edit Tree Info'));
      
      expect(mockNavigate).toHaveBeenCalledWith('EditTree', { treeId: 'tree-123' });
    });

    it('shows delete confirmation dialog', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      fireEvent.press(getByText('Delete Tree'));
      
      expect(getByText('Delete Tree?')).toBeTruthy();
      expect(getByText('This action cannot be undone.')).toBeTruthy();
    });

    it('deletes tree and navigates back on confirm', async () => {
      mockDispatch.mockImplementation(() => Promise.resolve({
        type: 'trees/deleteTree/fulfilled',
      }));
      
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByText('Actions'));
      fireEvent.press(getByText('Delete Tree'));
      fireEvent.press(getByText('Yes, Delete'));
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('Header Actions', () => {
    it('shows header with tree name', () => {
      const { getByText } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByText('Front Yard Oak')).toBeTruthy();
    });

    it('shows back button', () => {
      const { getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('navigates back when back button is pressed', () => {
      const { getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      fireEvent.press(getByTestId('back-button'));
      
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('shows share button', () => {
      const { getByTestId } = renderWithProviders(<TreeDetailScreen />);
      
      expect(getByTestId('share-button')).toBeTruthy();
    });
  });
});