import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CameraScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="camera-screen">
      <Text style={styles.title}>Camera</Text>
      <Text style={styles.subtitle}>Photo capture coming in Phase 3.1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default CameraScreen;