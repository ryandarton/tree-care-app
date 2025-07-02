import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button } from '../../components';
import { RootState } from '../../store';
import { fetchTrees, Tree as TreeType } from '../../store/slices/treesSlice';

// Simplified tree interface for display
interface TreeDisplay {
  id: string;
  name: string;
  species: string;
  plantedDate: string;
  location: string;
  status: 'healthy' | 'warning' | 'critical';
  nextActionDate?: string;
  image?: string;
}

const TreeListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  
  const { trees, isLoading: loading, error } = useSelector((state: RootState) => state.trees);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchTrees('user-123')); // TODO: Get from auth state
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTrees('user-123')); // TODO: Get from auth state
    setRefreshing(false);
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchTrees('user-123')); // TODO: Get from auth state
  };

  const handleAddTree = () => {
    navigation.navigate('AddTree');
  };

  const handleTreePress = (treeId: string) => {
    navigation.navigate('TreeDetail', { treeId });
  };

  const renderTreeItem = ({ item }: { item: TreeType }) => {
    // Map tree data to display format
    const status = getTreeStatus(item);
    const statusText = status === 'healthy' ? 'Healthy' : 
                      status === 'warning' ? 'Needs Attention' : 'Critical';
    
    return (
      <Card
        title={item.name}
        subtitle={item.species.commonName}
        image={undefined} // TODO: Add image support
        status={status}
        nextAction={undefined} // TODO: Calculate next action date
        location={item.location.yardPosition}
        onPress={() => handleTreePress(item.id)}
        testID={`tree-card-${item.id}`}
      >
        <></>
      </Card>
    );
  };

  // Helper function to determine tree status based on health score
  const getTreeStatus = (tree: TreeType): 'healthy' | 'warning' | 'critical' => {
    if (tree.currentStatus.healthScore >= 80) return 'healthy';
    if (tree.currentStatus.healthScore >= 60) return 'warning';
    return 'critical';
  };

  const renderHeader = () => {
    if (trees.length === 0) return null;
    
    return (
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleAddTree}
        testID="add-tree-button"
      >
        <Text style={styles.headerButtonText}>+ Add Tree</Text>
      </TouchableOpacity>
    );
  };

  if (loading && trees.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2D5016" testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={handleRetry}
          variant="secondary"
          size="medium"
        />
      </View>
    );
  }

  if (trees.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="empty-state">
        <Image
          source={{ uri: 'https://via.placeholder.com/200x200/E5F3DC/2D5016?text=🌳' }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>No Trees Yet</Text>
        <Text style={styles.emptySubtitle}>Start caring for your first tree!</Text>
        <Button
          title="Add Your First Tree"
          onPress={handleAddTree}
          size="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={trees}
        renderItem={renderTreeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2D5016']}
            tintColor="#2D5016"
          />
        }
        testID="tree-list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
    borderRadius: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 12,
    paddingHorizontal: 24,
    margin: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
});

export default TreeListScreen;