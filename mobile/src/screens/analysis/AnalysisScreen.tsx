import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnalysisScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="analysis-screen">
      <Text style={styles.title}>Analysis</Text>
      <Text style={styles.subtitle}>AI analysis coming in Phase 3.3</Text>
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

export default AnalysisScreen;