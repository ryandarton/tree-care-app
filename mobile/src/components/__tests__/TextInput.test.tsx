import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInput } from '../common/TextInput';

describe('TextInput Component', () => {
  describe('Basic Functionality', () => {
    it('renders with placeholder text', () => {
      const { getByPlaceholderText } = render(
        <TextInput placeholder="Enter text" onChangeText={jest.fn()} />
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('calls onChangeText when text changes', () => {
      const mockOnChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <TextInput placeholder="Test input" onChangeText={mockOnChangeText} />
      );
      
      fireEvent.changeText(getByPlaceholderText('Test input'), 'new text');
      expect(mockOnChangeText).toHaveBeenCalledWith('new text');
    });

    it('displays current value', () => {
      const { getByDisplayValue } = render(
        <TextInput value="Current value" onChangeText={jest.fn()} />
      );
      expect(getByDisplayValue('Current value')).toBeTruthy();
    });

    it('is disabled when disabled prop is true', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Disabled"
          onChangeText={jest.fn()}
          disabled
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('Label and Helper Text', () => {
    it('renders with label', () => {
      const { getByText } = render(
        <TextInput label="Username" placeholder="Enter username" onChangeText={jest.fn()} />
      );
      expect(getByText('Username')).toBeTruthy();
    });

    it('renders helper text', () => {
      const { getByText } = render(
        <TextInput
          placeholder="Email"
          helperText="Enter your email address"
          onChangeText={jest.fn()}
        />
      );
      expect(getByText('Enter your email address')).toBeTruthy();
    });

    it('shows required indicator when required', () => {
      const { getByText } = render(
        <TextInput label="Password" required onChangeText={jest.fn()} />
      );
      expect(getByText('Password *')).toBeTruthy();
    });
  });

  describe('Error States', () => {
    it('displays error message', () => {
      const { getByText } = render(
        <TextInput
          placeholder="Email"
          error="Please enter a valid email"
          onChangeText={jest.fn()}
        />
      );
      expect(getByText('Please enter a valid email')).toBeTruthy();
    });

    it('applies error styling when error prop is provided', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Email"
          error="Invalid email"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.style).toMatchObject({
        borderColor: '#DC2626',
      });
    });

    it('shows error text instead of helper text when both provided', () => {
      const { getByText, queryByText } = render(
        <TextInput
          placeholder="Email"
          helperText="Enter your email"
          error="Invalid email format"
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText('Invalid email format')).toBeTruthy();
      expect(queryByText('Enter your email')).toBeNull();
    });
  });

  describe('Input Types', () => {
    it('applies email keyboard type', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Email"
          type="email"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.keyboardType).toBe('email-address');
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('applies password security and type', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Password"
          type="password"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.secureTextEntry).toBe(true);
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('applies numeric keyboard type', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Phone"
          type="numeric"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.keyboardType).toBe('numeric');
    });
  });

  describe('Sizes', () => {
    it('applies small size styles', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Small"
          size="small"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.style).toMatchObject({
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 14,
      });
    });

    it('applies medium size styles by default', () => {
      const { getByTestId } = render(
        <TextInput placeholder="Medium" onChangeText={jest.fn()} testID="input" />
      );
      
      const input = getByTestId('input');
      expect(input.props.style).toMatchObject({
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
      });
    });

    it('applies large size styles', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Large"
          size="large"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.style).toMatchObject({
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 18,
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility label', () => {
      const { getByLabelText } = render(
        <TextInput
          label="Username"
          placeholder="Enter username"
          onChangeText={jest.fn()}
        />
      );
      expect(getByLabelText('Username')).toBeTruthy();
    });

    it('supports custom accessibility label', () => {
      const { getByLabelText } = render(
        <TextInput
          placeholder="Search"
          accessibilityLabel="Search for trees"
          onChangeText={jest.fn()}
        />
      );
      expect(getByLabelText('Search for trees')).toBeTruthy();
    });

    it('indicates required state to screen readers', () => {
      const { getByText } = render(
        <TextInput
          label="Email"
          required
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      // Required indicator should be visible in the label
      expect(getByText('Email *')).toBeTruthy();
    });

    it('provides accessibility hint for error state', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Email"
          error="Invalid email format"
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.accessibilityHint).toContain('Invalid email format');
    });
  });

  describe('Multiline Support', () => {
    it('supports multiline input', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Description"
          multiline
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.multiline).toBe(true);
    });

    it('applies multiline styles', () => {
      const { getByTestId } = render(
        <TextInput
          placeholder="Notes"
          multiline
          numberOfLines={4}
          onChangeText={jest.fn()}
          testID="input"
        />
      );
      
      const input = getByTestId('input');
      expect(input.props.numberOfLines).toBe(4);
      expect(input.props.style).toMatchObject({
        textAlignVertical: 'top',
        minHeight: 80,
      });
    });
  });
});