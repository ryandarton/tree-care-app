import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../common/Button';

describe('Button Component', () => {
  describe('Basic Functionality', () => {
    it('renders with title text', () => {
      const { getByText } = render(<Button title="Test Button" onPress={jest.fn()} />);
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(<Button title="Press Me" onPress={mockOnPress} />);
      
      fireEvent.press(getByText('Press Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Button title="Disabled" onPress={mockOnPress} disabled testID="button" />
      );
      
      const button = getByTestId('button');
      fireEvent.press(button);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies primary variant styles by default', () => {
      const { getByTestId } = render(
        <Button title="Primary" onPress={jest.fn()} testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        backgroundColor: '#2D5016',
      });
    });

    it('applies secondary variant styles', () => {
      const { getByTestId } = render(
        <Button title="Secondary" onPress={jest.fn()} variant="secondary" testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        backgroundColor: 'transparent',
        borderColor: '#2D5016',
        borderWidth: 2,
      });
    });

    it('applies outline variant styles', () => {
      const { getByTestId } = render(
        <Button title="Outline" onPress={jest.fn()} variant="outline" testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        backgroundColor: 'transparent',
        borderColor: '#666',
        borderWidth: 1,
      });
    });
  });

  describe('Sizes', () => {
    it('applies small size styles', () => {
      const { getByTestId } = render(
        <Button title="Small" onPress={jest.fn()} size="small" testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        paddingVertical: 8,
        paddingHorizontal: 16,
      });
    });

    it('applies medium size styles by default', () => {
      const { getByTestId } = render(
        <Button title="Medium" onPress={jest.fn()} testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        paddingVertical: 12,
        paddingHorizontal: 24,
      });
    });

    it('applies large size styles', () => {
      const { getByTestId } = render(
        <Button title="Large" onPress={jest.fn()} size="large" testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.style).toMatchObject({
        paddingVertical: 16,
        paddingHorizontal: 32,
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility role', () => {
      const { getByRole } = render(<Button title="Accessible" onPress={jest.fn()} />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('supports accessibility label', () => {
      const { getByLabelText } = render(
        <Button title="Save" onPress={jest.fn()} accessibilityLabel="Save document" />
      );
      expect(getByLabelText('Save document')).toBeTruthy();
    });

    it('indicates disabled state to screen readers', () => {
      const { getByTestId } = render(
        <Button title="Disabled" onPress={jest.fn()} disabled testID="button" />
      );
      
      const button = getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      const { getByTestId } = render(
        <Button title="Loading" onPress={jest.fn()} loading testID="button" />
      );
      
      expect(getByTestId('button-loading')).toBeTruthy();
    });

    it('disables button when loading', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Button title="Loading" onPress={mockOnPress} loading testID="button" />
      );
      
      const button = getByTestId('button');
      fireEvent.press(button);
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });
});