import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AddTreeScreen from '../AddTreeScreen';
import { store } from '../../../store';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock Redux hooks
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));


// Mock image picker
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
  requestCameraPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => ({ status: 'granted' })),
}));

const ImagePicker = require('expo-image-picker');

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </Provider>
  );
};

describe('AddTreeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
  });

  describe('Step 1: Photo Selection', () => {
    it('renders photo selection step by default', () => {
      const { getByText, getByTestId } = renderWithProviders(<AddTreeScreen />);
      
      expect(getByText('Add Your Tree')).toBeTruthy();
      expect(getByText('Step 1 of 3: Add Photo')).toBeTruthy();
      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('gallery-button')).toBeTruthy();
    });

    it('opens camera when camera button is pressed', async () => {
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByTestId } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      });
    });

    it('opens gallery when gallery button is pressed', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByTestId } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('gallery-button'));
      
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    it('shows selected photo and enables next button', async () => {
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
        expect(getByText('Next')).toBeTruthy();
      });
    });

    it('allows retaking photo', async () => {
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });

      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });

      fireEvent.press(getByText('Retake Photo'));
      
      expect(getByTestId('camera-button')).toBeTruthy();
      expect(getByTestId('gallery-button')).toBeTruthy();
    });
  });

  describe('Step 2: Tree Information', () => {
    beforeEach(async () => {
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });
    });

    it('shows tree information form after photo selection', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
        expect(getByTestId('tree-name-input')).toBeTruthy();
        expect(getByTestId('species-selector')).toBeTruthy();
        expect(getByTestId('planted-date-input')).toBeTruthy();
      });
    });

    it('validates required fields', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      // Go to step 2
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      // Try to go to next step without filling required fields
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Tree name is required')).toBeTruthy();
        expect(getByText('Please select a species')).toBeTruthy();
      });
    });

    it('allows going back to photo selection', async () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(<AddTreeScreen />);
      
      // Go to step 2
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      // Go back
      fireEvent.press(getByText('Back'));
      
      await waitFor(() => {
        expect(queryByText('Step 1 of 3: Add Photo')).toBeTruthy();
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
    });

    it('shows species search functionality', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      // Go to step 2
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('species-selector'));
      
      await waitFor(() => {
        expect(getByTestId('species-search-input')).toBeTruthy();
        expect(getByText('Popular Species')).toBeTruthy();
      });
    });
  });

  describe('Step 3: Location & Goals', () => {
    beforeEach(async () => {
      ImagePicker.launchCameraAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });
    });

    it('shows location and goals form', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      // Go through steps
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      // Fill step 2
      fireEvent.changeText(getByTestId('tree-name-input'), 'My Oak Tree');
      fireEvent.press(getByTestId('species-selector'));
      
      await waitFor(() => {
        expect(getByText('Popular Species')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Oak'));
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 3 of 3: Location & Goals')).toBeTruthy();
        expect(getByTestId('location-selector')).toBeTruthy();
        expect(getByTestId('sun-exposure-selector')).toBeTruthy();
        expect(getByTestId('target-height-input')).toBeTruthy();
      });
    });

    it('completes tree creation on save', async () => {
      // Mock successful dispatch
      mockDispatch.mockResolvedValueOnce({
        payload: { id: 'tree-123' },
        type: 'trees/addTree/fulfilled',
      });
      
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      // Go through all steps
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      // Fill step 2
      fireEvent.changeText(getByTestId('tree-name-input'), 'My Oak Tree');
      fireEvent.press(getByTestId('species-selector'));
      
      await waitFor(() => {
        expect(getByText('Popular Species')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Oak'));
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 3 of 3: Location & Goals')).toBeTruthy();
      });
      
      // Fill step 3
      fireEvent.press(getByTestId('location-selector'));
      
      await waitFor(() => {
        expect(getByText('Front Yard')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Front Yard'));
      
      fireEvent.press(getByText('Save Tree'));
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('TreeDetail', { treeId: 'tree-123' });
      });
    });
  });

  describe('Navigation', () => {
    it('shows cancel confirmation dialog', () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('cancel-button'));
      
      expect(getByText('Cancel Adding Tree?')).toBeTruthy();
      expect(getByText('You will lose your progress.')).toBeTruthy();
    });

    it('cancels and goes back on confirmation', () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('cancel-button'));
      fireEvent.press(getByText('Yes, Cancel'));
      
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('continues when dismissing cancel dialog', () => {
      const { getByTestId, getByText, queryByText } = renderWithProviders(<AddTreeScreen />);
      
      fireEvent.press(getByTestId('cancel-button'));
      fireEvent.press(getByText('Continue'));
      
      expect(queryByText('Cancel Adding Tree?')).toBeFalsy();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('Progress Indicator', () => {
    beforeEach(() => {
      ImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      });
    });

    it('shows progress through steps', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddTreeScreen />);
      
      // Step 1
      expect(getByTestId('progress-step-1')).toHaveStyle({ backgroundColor: '#2D5016' });
      expect(getByTestId('progress-step-2')).toHaveStyle({ backgroundColor: '#E5E7EB' });
      expect(getByTestId('progress-step-3')).toHaveStyle({ backgroundColor: '#E5E7EB' });
      
      // Go to step 2
      fireEvent.press(getByTestId('camera-button'));
      
      await waitFor(() => {
        expect(getByTestId('selected-photo')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Next'));
      
      await waitFor(() => {
        expect(getByText('Step 2 of 3: Tree Information')).toBeTruthy();
      });
      
      expect(getByTestId('progress-step-1')).toHaveStyle({ backgroundColor: '#2D5016' });
      expect(getByTestId('progress-step-2')).toHaveStyle({ backgroundColor: '#2D5016' });
      expect(getByTestId('progress-step-3')).toHaveStyle({ backgroundColor: '#E5E7EB' });
    });
  });
});