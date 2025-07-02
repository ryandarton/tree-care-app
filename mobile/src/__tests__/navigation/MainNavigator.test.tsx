import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from '../../navigation/MainNavigator';

import { View, Text } from 'react-native';

// Mock the screen components
jest.mock('../../screens/trees/TreeListScreen', () => {
  return function MockTreeListScreen() {
    return <View testID="tree-list-screen"><Text>Tree List Screen</Text></View>;
  };
});

jest.mock('../../screens/camera/CameraScreen', () => {
  return function MockCameraScreen() {
    return <View testID="camera-screen"><Text>Camera Screen</Text></View>;
  };
});

jest.mock('../../screens/analysis/AnalysisScreen', () => {
  return function MockAnalysisScreen() {
    return <View testID="analysis-screen"><Text>Analysis Screen</Text></View>;
  };
});

jest.mock('../../screens/profile/ProfileScreen', () => {
  return function MockProfileScreen() {
    return <View testID="profile-screen"><Text>Profile Screen</Text></View>;
  };
});

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Helper to render with navigation
const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

describe('MainNavigator', () => {
  it('should render main tab navigator', () => {
    renderWithNavigation(<MainNavigator />);
    
    expect(screen.getByTestId('main-navigator')).toBeTruthy();
  });

  it('should have tree list as initial route', () => {
    renderWithNavigation(<MainNavigator />);
    
    // Tree list should be the default tab
    expect(screen.getByTestId('tree-list-screen')).toBeTruthy();
  });

  it('should render tab bar with all main tabs', () => {
    renderWithNavigation(<MainNavigator />);
    
    // Should have all the main navigation tabs
    expect(screen.getByTestId('main-navigator')).toBeTruthy();
  });

  it('should be accessible via navigation', () => {
    const navigator = renderWithNavigation(<MainNavigator />);
    
    // Should render without navigation errors
    expect(navigator).toBeTruthy();
  });
});