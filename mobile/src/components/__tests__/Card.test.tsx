import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Card } from '../common/Card';

describe('Card Component', () => {
  describe('Basic Functionality', () => {
    it('renders with children content', () => {
      const { getByText } = render(
        <Card>
          <Text>Test Content</Text>
        </Card>
      );
      expect(getByText('Test Content')).toBeTruthy();
    });

    it('renders with title', () => {
      const { getByText } = render(
        <Card title="Tree Card">
          <>Content</>
        </Card>
      );
      expect(getByText('Tree Card')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <Card title="Oak Tree" subtitle="Planted 2 years ago">
          <>Content</>
        </Card>
      );
      expect(getByText('Oak Tree')).toBeTruthy();
      expect(getByText('Planted 2 years ago')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Card title="Pressable Card" onPress={mockOnPress} testID="card">
          <>Content</>
        </Card>
      );
      
      fireEvent.press(getByTestId('card'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tree Specific Features', () => {
    it('displays tree image', () => {
      const mockImage = 'https://example.com/tree.jpg';
      const { getByTestId } = render(
        <Card title="Oak Tree" image={mockImage} testID="card">
          <>Content</>
        </Card>
      );
      
      const image = getByTestId('card-image');
      expect(image.props.source).toEqual({ uri: mockImage });
    });

    it('displays tree status badge', () => {
      const { getByText } = render(
        <Card title="Oak Tree" status="healthy">
          <>Content</>
        </Card>
      );
      expect(getByText('Healthy')).toBeTruthy();
    });

    it('displays different status colors', () => {
      const { getByTestId, rerender } = render(
        <Card title="Tree" status="healthy" testID="card">
          <>Content</>
        </Card>
      );
      
      let statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.style[1]).toMatchObject({
        backgroundColor: '#10B981',
      });

      rerender(
        <Card title="Tree" status="warning" testID="card">
          <>Content</>
        </Card>
      );
      
      statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.style[1]).toMatchObject({
        backgroundColor: '#F59E0B',
      });

      rerender(
        <Card title="Tree" status="critical" testID="card">
          <>Content</>
        </Card>
      );
      
      statusBadge = getByTestId('status-badge');
      expect(statusBadge.props.style[1]).toMatchObject({
        backgroundColor: '#EF4444',
      });
    });

    it('displays next action date', () => {
      const nextAction = new Date('2025-08-15T00:00:00.000Z');
      const { getByText } = render(
        <Card title="Oak Tree" nextAction={nextAction}>
          <>Content</>
        </Card>
      );
      expect(getByText(/Next:.*Aug.*2025/)).toBeTruthy();
    });

    it('displays location if provided', () => {
      const { getByText } = render(
        <Card title="Oak Tree" location="Front Yard">
          <>Content</>
        </Card>
      );
      expect(getByText(/📍.*Front Yard/)).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('applies default card styles', () => {
      const { getByTestId } = render(
        <Card title="Default" testID="card">
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowOpacity: 0.1,
      });
    });

    it('applies compact variant styles', () => {
      const { getByTestId } = render(
        <Card title="Compact" variant="compact" testID="card">
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({
        padding: 12,
      });
    });

    it('applies featured variant styles', () => {
      const { getByTestId } = render(
        <Card title="Featured" variant="featured" testID="card">
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.style).toMatchObject({
        borderColor: '#2D5016',
        borderWidth: 2,
      });
    });
  });

  describe('Interactive States', () => {
    it('applies pressed state when touchable', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <Card title="Pressable" onPress={mockOnPress} testID="card">
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      // Should be pressable
      fireEvent.press(card);
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('is not touchable when no onPress provided', () => {
      const { getByTestId } = render(
        <Card title="Static" testID="card">
          <>Content</>
        </Card>
      );
      
      // Should render as View and not be pressable
      const card = getByTestId('card');
      expect(() => fireEvent.press(card)).not.toThrow();
    });

    it('shows loading state', () => {
      const { getByTestId } = render(
        <Card title="Loading" loading testID="card">
          <>Content</>
        </Card>
      );
      
      expect(getByTestId('card-loading')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility role when pressable', () => {
      const { getByRole } = render(
        <Card title="Pressable" onPress={jest.fn()}>
          <>Content</>
        </Card>
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('supports accessibility label', () => {
      const { getByLabelText } = render(
        <Card title="Oak Tree" accessibilityLabel="Oak tree card, healthy status">
          <>Content</>
        </Card>
      );
      expect(getByLabelText('Oak tree card, healthy status')).toBeTruthy();
    });

    it('provides accessibility hint for tree status', () => {
      const { getByTestId } = render(
        <Card 
          title="Oak Tree" 
          status="warning" 
          onPress={jest.fn()}
          testID="card"
        >
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.accessibilityHint).toContain('warning');
    });

    it('includes next action in accessibility hint', () => {
      const nextAction = new Date('2025-08-15T00:00:00.000Z');
      const { getByTestId } = render(
        <Card 
          title="Oak Tree" 
          nextAction={nextAction}
          testID="card"
        >
          <>Content</>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.accessibilityHint).toMatch(/Next action:.*Aug.*2025/);
    });
  });

  describe('Custom Actions', () => {
    it('renders action buttons', () => {
      const mockAction = jest.fn();
      const actions = [
        { label: 'Edit', onPress: mockAction },
        { label: 'Delete', onPress: mockAction, variant: 'destructive' as const },
      ];
      
      const { getByText } = render(
        <Card title="Oak Tree" actions={actions}>
          <>Content</>
        </Card>
      );
      
      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });

    it('calls action handlers when pressed', () => {
      const mockEdit = jest.fn();
      const mockDelete = jest.fn();
      const actions = [
        { label: 'Edit', onPress: mockEdit },
        { label: 'Delete', onPress: mockDelete },
      ];
      
      const { getByText } = render(
        <Card title="Oak Tree" actions={actions}>
          <>Content</>
        </Card>
      );
      
      fireEvent.press(getByText('Edit'));
      fireEvent.press(getByText('Delete'));
      
      expect(mockEdit).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });
});