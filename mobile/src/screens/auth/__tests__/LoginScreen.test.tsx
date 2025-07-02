import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import LoginScreen from '../LoginScreen';
import { store } from '../../../store';
import { Alert } from 'react-native';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    it('renders all required form elements', () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen />
      );

      expect(getByTestId('app-logo')).toBeTruthy();
      expect(getByText('Welcome Back!')).toBeTruthy();
      expect(getByText('Sign in to continue caring for your trees')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Forgot Password?')).toBeTruthy();
      expect(getByText("Don't have an account? Sign Up")).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Email is required')).toBeTruthy();
      });
    });

    it('shows error when email is invalid', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('shows error when password is empty', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByText('Password is required')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('disables button and shows loading during submission', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(
        <LoginScreen />
      );
      
      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(getByTestId('button-loading')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to forgot password screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      
      const forgotPasswordLink = getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('navigates to signup screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);
      
      const signUpLink = getByText("Don't have an account? Sign Up");
      fireEvent.press(signUpLink);

      expect(mockNavigate).toHaveBeenCalledWith('Signup');
    });
  });
});