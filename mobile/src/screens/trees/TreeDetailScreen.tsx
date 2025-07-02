import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { RootState } from '../../store';
import { setSelectedTree, deleteTree } from '../../store/slices/treesSlice';

type Tab = 'overview' | 'health' | 'history' | 'actions';

const TreeDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  
  const { treeId } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { trees, isLoading } = useSelector((state: RootState) => state.trees);
  const tree = trees.find(t => t.id === treeId);
  
  useEffect(() => {
    if (tree) {
      dispatch(setSelectedTree(tree.id));
    }
  }, [tree, dispatch]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const result = await dispatch(deleteTree(tree!.id));
      if (result.type === 'trees/deleteTree/fulfilled') {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete tree');
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Good Health';
    if (score >= 60) return 'Fair Health';
    return 'Poor Health';
  };

  const formatGrowthStage = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2D5016" testID="loading-indicator" />
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Tree not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
          size="medium"
        />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        testID="back-button"
        style={styles.headerButton}
      >
        <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle} numberOfLines={1}>
        {tree.name}
      </Text>
      
      <TouchableOpacity
        onPress={() => {}}
        testID="share-button"
        style={styles.headerButton}
      >
        <MaterialIcons name="share" size={24} color="#1F2937" />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['overview', 'health', 'history', 'actions'] as Tab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} testID="overview-tab-content">
      <Card
        title="Basic Information"
        testID="basic-info-card"
      >
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Species</Text>
          <View>
            <Text style={styles.infoValue}>{tree.species.commonName}</Text>
            <Text style={styles.infoSubValue}>{tree.species.scientificName}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{tree.location.yardPosition}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Planted</Text>
          <Text style={styles.infoValue}>
            Planted on {formatDate(tree.plantedDate)}
          </Text>
        </View>
      </Card>

      <View style={styles.cardWrapper}>
        <Card
          title="Current Measurements"
        >
        <View style={styles.measurementRow}>
          <View style={styles.measurement}>
            <Text style={styles.measurementLabel}>Height</Text>
            <Text style={styles.measurementValue}>{tree.currentStatus.height} ft</Text>
          </View>
          <View style={styles.measurement}>
            <Text style={styles.measurementLabel}>Trunk Diameter</Text>
            <Text style={styles.measurementValue}>{tree.currentStatus.trunkDiameter} in</Text>
          </View>
          <View style={styles.measurement}>
            <Text style={styles.measurementLabel}>Canopy Spread</Text>
            <Text style={styles.measurementValue}>{tree.currentStatus.canopySpread} ft</Text>
          </View>
        </View>
        </Card>
      </View>

      <View style={styles.cardWrapper}>
        <Card
          title="Growth Goals"
        >
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Target Height</Text>
          <Text style={styles.infoValue}>Target Height: {tree.goals.targetHeight} ft</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Clearance</Text>
          <Text style={styles.infoValue}>Clearance Needed: {tree.goals.clearanceNeeded} ft</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Aesthetic</Text>
          <Text style={styles.infoValue}>
            Style: {tree.goals.aestheticStyle.charAt(0).toUpperCase() + 
                   tree.goals.aestheticStyle.slice(1)}
          </Text>
        </View>
        </Card>
      </View>
    </ScrollView>
  );

  const renderHealthTab = () => (
    <ScrollView style={styles.tabContent} testID="health-tab-content">
      <View style={styles.cardWrapper}>
        <Card title="Health Score">
        <View style={styles.healthScoreContainer}>
          <View
            style={[
              styles.healthScoreIndicator,
              { backgroundColor: getHealthColor(tree.currentStatus.healthScore) }
            ]}
            testID="health-score-indicator"
          />
          <View style={styles.healthScoreInfo}>
            <Text style={styles.healthScoreValue}>{tree.currentStatus.healthScore}%</Text>
            <Text style={styles.healthScoreStatus}>
              {getHealthStatus(tree.currentStatus.healthScore)}
            </Text>
          </View>
        </View>
        </Card>
      </View>

      <View style={styles.cardWrapper}>
        <Card title="Growth Stage">
        <Text style={styles.growthStageLabel}>Growth Stage</Text>
        <Text style={styles.growthStageValue}>
          {formatGrowthStage(tree.currentStatus.growthStage)}
        </Text>
        </Card>
      </View>

      <View style={styles.cardWrapper}>
        <Card title="Health Recommendations">
        <View testID="health-recommendations">
          <Text style={styles.recommendationText}>
            • Continue regular watering schedule
          </Text>
          <Text style={styles.recommendationText}>
            • Monitor for pests and diseases
          </Text>
          <Text style={styles.recommendationText}>
            • Consider pruning in late winter
          </Text>
        </View>
        </Card>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} testID="history-tab-content">
      <View style={styles.emptyState}>
        <MaterialIcons name="photo-library" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateTitle}>No history recorded yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Take a photo to start tracking progress
        </Text>
        <Button
          title="Add Photo"
          onPress={() => navigation.navigate('Camera', { treeId: tree.id })}
          variant="primary"
          size="medium"
          testID="add-photo-button"
        />
      </View>
    </ScrollView>
  );

  const renderActionsTab = () => (
    <ScrollView style={styles.tabContent} testID="actions-tab-content">
      <View style={styles.cardWrapper}>
        <Card>
        <Button
          title="Take Photo"
          onPress={() => navigation.navigate('Camera', { treeId: tree.id })}
          variant="primary"
          size="large"
        />
        
        <View style={styles.actionSpacer} />
        
        <Button
          title="Edit Tree Info"
          onPress={() => navigation.navigate('EditTree', { treeId: tree.id })}
          variant="secondary"
          size="large"
        />
        
        <View style={styles.actionSpacer} />
        
        <Button
          title="Set Reminder"
          onPress={() => {}}
          variant="secondary"
          size="large"
        />
        
        <View style={styles.actionSpacer} />
        <View style={styles.actionSpacer} />
        
        <Button
          title="Delete Tree"
          onPress={() => setShowDeleteDialog(true)}
          variant="outline"
          size="large"
        />
        </Card>
      </View>
    </ScrollView>
  );

  const renderDeleteDialog = () => (
    <Modal
      visible={showDeleteDialog}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowDeleteDialog(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogTitle}>Delete Tree?</Text>
          <Text style={styles.dialogMessage}>This action cannot be undone.</Text>
          
          <View style={styles.dialogButtons}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
            />
            <Button
              title="Yes, Delete"
              variant="primary"
              onPress={handleDelete}
              loading={deleteLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'health' && renderHealthTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'actions' && renderActionsTab()}
      
      {renderDeleteDialog()}
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2D5016',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2D5016',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  cardWrapper: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  measurement: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  healthScoreStatus: {
    fontSize: 16,
    color: '#6B7280',
  },
  growthStageLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  growthStageValue: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '500',
  },
  recommendationText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    paddingLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  actionSpacer: {
    height: 12,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default TreeDetailScreen;