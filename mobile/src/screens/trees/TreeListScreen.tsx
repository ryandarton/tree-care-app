import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TreeListScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="tree-list-screen">
      <Text style={styles.title}>My Trees</Text>
      <Text style={styles.subtitle}>Tree management coming in Phase 2.5</Text>
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

export default TreeListScreen;