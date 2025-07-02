import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
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

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    it('renders all required elements', () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ForgotPasswordScreen />
      );

      // Header
      expect(getByText('Reset Password')).toBeTruthy();
      expect(getByText('Enter your email and we\'ll send you a reset link')).toBeTruthy();

      // Form fields
      expect(getByPlaceholderText('Email')).toBeTruthy();

      // Buttons
      expect(getByText('Send Reset Link')).toBeTruthy();
      expect(getByText('Back to Sign In')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const { getByText } = renderWithProviders(<ForgotPasswordScreen />);
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('Email is required')).toBeTruthy();
      });
    });

    it('shows error when email is invalid', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ForgotPasswordScreen />
      );
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('Please enter a valid email')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('successfully submits when email is valid', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(
        <ForgotPasswordScreen />
      );
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByTestId('button-loading')).toBeTruthy();
      });
    });

    it('shows success message after submission', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ForgotPasswordScreen />
      );
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText(/Check your email/)).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('navigates back to login screen', () => {
      const { getByText } = renderWithProviders(<ForgotPasswordScreen />);
      
      const backLink = getByText('Back to Sign In');
      fireEvent.press(backLink);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Success State', () => {
    it('shows resend button after successful submission', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ForgotPasswordScreen />
      );
      
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('Resend Email')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('allows resending the reset email', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(
        <ForgotPasswordScreen />
      );
      
      // First submission
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const sendButton = getByText('Send Reset Link');
      fireEvent.press(sendButton);

      // Wait for success state
      await waitFor(() => {
        expect(getByText('Resend Email')).toBeTruthy();
      }, { timeout: 3000 });

      // Resend
      const resendButton = getByText('Resend Email');
      fireEvent.press(resendButton);

      await waitFor(() => {
        // Should show loading state again
        expect(getByTestId('button-loading')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});