import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import SignupScreen from '../SignupScreen';
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    it('renders all required form elements', () => {
      const { getByText, getByPlaceholderText, getByTestId, getAllByText } = renderWithProviders(
        <SignupScreen />
      );

      // Header - use getAllByText since there's a title and button with same text
      const createAccountElements = getAllByText('Create Account');
      expect(createAccountElements.length).toBe(2); // Title and button
      expect(getByText('Join us to start caring for your trees')).toBeTruthy();

      // Form fields
      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();

      // Links
      expect(getByText('Already have an account? Sign In')).toBeTruthy();

      // Terms
      expect(getByText(/By creating an account, you agree to our/)).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows error when name is empty', async () => {
      const { getByText, getAllByText } = renderWithProviders(<SignupScreen />);
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]); // Press the button, not the title

      await waitFor(() => {
        expect(getByText('Name is required')).toBeTruthy();
      });
    });

    it('shows error when email is invalid', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = renderWithProviders(<SignupScreen />);
      
      const nameInput = getByPlaceholderText('Full Name');
      const emailInput = getByPlaceholderText('Email');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]);

      await waitFor(() => {
        expect(getByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('shows error when password is too short', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = renderWithProviders(<SignupScreen />);
      
      const nameInput = getByPlaceholderText('Full Name');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, '12345');
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]);

      await waitFor(() => {
        expect(getByText('Password must be at least 8 characters')).toBeTruthy();
      });
    });

    it('shows error when passwords do not match', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = renderWithProviders(<SignupScreen />);
      
      const nameInput = getByPlaceholderText('Full Name');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password456');
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]);

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('shows error when terms are not accepted', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = renderWithProviders(<SignupScreen />);
      
      const nameInput = getByPlaceholderText('Full Name');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]);

      await waitFor(() => {
        expect(getByText('You must accept the terms and conditions')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('successfully submits when all fields are valid', async () => {
      const { getByText, getByPlaceholderText, getByTestId, getAllByText } = renderWithProviders(
        <SignupScreen />
      );
      
      // Fill all fields
      const nameInput = getByPlaceholderText('Full Name');
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const termsCheckbox = getByTestId('terms-checkbox');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(termsCheckbox);
      
      const signUpButtons = getAllByText('Create Account');
      fireEvent.press(signUpButtons[1]);

      await waitFor(() => {
        expect(getByTestId('button-loading')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to login screen', () => {
      const { getByText } = renderWithProviders(<SignupScreen />);
      
      const signInLink = getByText('Already have an account? Sign In');
      fireEvent.press(signInLink);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('navigates to terms and conditions', () => {
      const { getByText } = renderWithProviders(<SignupScreen />);
      
      const termsLink = getByText('Terms and Conditions');
      fireEvent.press(termsLink);

      expect(mockNavigate).toHaveBeenCalledWith('Terms');
    });

    it('navigates to privacy policy', () => {
      const { getByText } = renderWithProviders(<SignupScreen />);
      
      const privacyLink = getByText('Privacy Policy');
      fireEvent.press(privacyLink);

      expect(mockNavigate).toHaveBeenCalledWith('Privacy');
    });
  });

  describe('Password Visibility', () => {
    it('toggles password visibility', () => {
      const { getByTestId } = renderWithProviders(<SignupScreen />);
      
      const toggleButton = getByTestId('password-toggle');
      
      // Simply test that the toggle button is present and clickable
      expect(toggleButton).toBeTruthy();
      fireEvent.press(toggleButton);
      
      // Toggle back
      fireEvent.press(toggleButton);
    });

    it('toggles confirm password visibility', () => {
      const { getByTestId } = renderWithProviders(<SignupScreen />);
      
      const toggleButton = getByTestId('confirm-password-toggle');
      
      // Simply test that the toggle button is present and clickable
      expect(toggleButton).toBeTruthy();
      fireEvent.press(toggleButton);
    });
  });
});