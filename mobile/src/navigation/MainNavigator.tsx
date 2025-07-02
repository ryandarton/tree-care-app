import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import TreeListScreen from '../screens/trees/TreeListScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import AnalysisScreen from '../screens/analysis/AnalysisScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Main tab parameter list for type safety
export type MainTabParamList = {
  TreeList: undefined;
  Camera: undefined;
  Analysis: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <View testID="main-navigator" style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="TreeList"
        screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="TreeList"
        component={TreeListScreen}
        options={{
          title: 'My Trees',
          tabBarLabel: 'Trees',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="park" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Capture Photo',
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="camera-alt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          title: 'Analysis Results',
          tabBarLabel: 'Analysis',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    </View>
  );
};

export default MainNavigator;