import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Button, TextInput } from '../../components';
import { addTree } from '../../store/slices/treesSlice';

interface TreeFormData {
  photo: string | null;
  name: string;
  species: string;
  plantedDate: string;
  location: string;
  sunExposure: string;
  targetHeight: string;
}

const AddTreeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [formData, setFormData] = useState<TreeFormData>({
    photo: null,
    name: '',
    species: '',
    plantedDate: new Date().toISOString().split('T')[0],
    location: '',
    sunExposure: 'partial',
    targetHeight: '',
  });

  const [errors, setErrors] = useState<Partial<TreeFormData>>({});

  const popularSpecies = [
    { id: 'oak', name: 'Oak', scientific: 'Quercus' },
    { id: 'maple', name: 'Maple', scientific: 'Acer' },
    { id: 'pine', name: 'Pine', scientific: 'Pinus' },
    { id: 'birch', name: 'Birch', scientific: 'Betula' },
    { id: 'apple', name: 'Apple', scientific: 'Malus domestica' },
  ];

  const locations = [
    'Front Yard',
    'Back Yard',
    'Side Yard',
    'Garden',
    'Driveway',
  ];

  const handlePhotoSelection = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required to select photos.');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photo: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TreeFormData> = {};

    switch (step) {
      case 1:
        if (!formData.photo) {
          Alert.alert('Photo Required', 'Please take or select a photo of your tree.');
          return false;
        }
        break;
      case 2:
        if (!formData.name.trim()) {
          newErrors.name = 'Tree name is required';
        }
        if (!formData.species) {
          newErrors.species = 'Please select a species';
        }
        break;
      case 3:
        if (!formData.location) {
          newErrors.location = 'Please select a location';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const result = await dispatch(addTree({
        name: formData.name,
        species: formData.species,
        plantedDate: formData.plantedDate,
        location: {
          yardPosition: formData.location,
          sunExposure: formData.sunExposure,
        },
        goals: {
          targetHeight: parseFloat(formData.targetHeight) || 12,
        },
      }));

      if (result.type === 'trees/addTree/fulfilled') {
        navigation.navigate('TreeDetail', { treeId: result.payload.id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save tree');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.progressDot,
            currentStep >= step && styles.progressDotActive,
          ]}
          testID={`progress-step-${step}`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1 of 3: Add Photo</Text>
      
      {!formData.photo ? (
        <View style={styles.photoButtonsContainer}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => handlePhotoSelection('camera')}
            testID="camera-button"
          >
            <Text style={styles.photoButtonIcon}>📷</Text>
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => handlePhotoSelection('gallery')}
            testID="gallery-button"
          >
            <Text style={styles.photoButtonIcon}>🖼️</Text>
            <Text style={styles.photoButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: formData.photo }}
            style={styles.selectedPhoto}
            testID="selected-photo"
          />
          <Button
            title="Retake Photo"
            variant="secondary"
            size="medium"
            onPress={() => setFormData({ ...formData, photo: null })}
          />
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2 of 3: Tree Information</Text>
      
      <TextInput
        label="Tree Name"
        placeholder="e.g., Front Yard Oak"
        value={formData.name}
        onChangeText={(text) => {
          setFormData({ ...formData, name: text });
          if (errors.name) setErrors({ ...errors, name: undefined });
        }}
        error={errors.name}
        testID="tree-name-input"
      />

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowSpeciesModal(true)}
        testID="species-selector"
      >
        <Text style={styles.selectorLabel}>Species</Text>
        <Text style={[
          styles.selectorValue,
          !formData.species && styles.selectorPlaceholder
        ]}>
          {formData.species || 'Select species'}
        </Text>
      </TouchableOpacity>
      {errors.species && <Text style={styles.errorText}>{errors.species}</Text>}

      <TextInput
        label="Planted Date"
        placeholder="YYYY-MM-DD"
        value={formData.plantedDate}
        onChangeText={(text) => setFormData({ ...formData, plantedDate: text })}
        testID="planted-date-input"
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3 of 3: Location & Goals</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowLocationModal(true)}
        testID="location-selector"
      >
        <Text style={styles.selectorLabel}>Location</Text>
        <Text style={[
          styles.selectorValue,
          !formData.location && styles.selectorPlaceholder
        ]}>
          {formData.location || 'Select location'}
        </Text>
      </TouchableOpacity>
      {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

      <View style={styles.sunExposureContainer}>
        <Text style={styles.selectorLabel}>Sun Exposure</Text>
        <View style={styles.sunExposureOptions} testID="sun-exposure-selector">
          {['full', 'partial', 'shade'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sunOption,
                formData.sunExposure === option && styles.sunOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, sunExposure: option })}
            >
              <Text style={[
                styles.sunOptionText,
                formData.sunExposure === option && styles.sunOptionTextActive,
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        label="Target Height (feet)"
        placeholder="e.g., 12"
        value={formData.targetHeight}
        onChangeText={(text) => setFormData({ ...formData, targetHeight: text })}
        type="numeric"
        testID="target-height-input"
      />
    </ScrollView>
  );

  const renderSpeciesModal = () => (
    <Modal
      visible={showSpeciesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSpeciesModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Species</Text>
          
          <TextInput
            placeholder="Search species..."
            value=""
            onChangeText={() => {}}
            testID="species-search-input"
          />
          
          <Text style={styles.modalSubtitle}>Popular Species</Text>
          
          <ScrollView style={styles.speciesList}>
            {popularSpecies.map((species) => (
              <TouchableOpacity
                key={species.id}
                style={styles.speciesItem}
                onPress={() => {
                  setFormData({ ...formData, species: species.name });
                  setShowSpeciesModal(false);
                  if (errors.species) setErrors({ ...errors, species: undefined });
                }}
              >
                <Text style={styles.speciesName}>{species.name}</Text>
                <Text style={styles.speciesScientific}>{species.scientific}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => setShowSpeciesModal(false)}
          />
        </View>
      </View>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location</Text>
          
          <ScrollView style={styles.locationList}>
            {locations.map((location) => (
              <TouchableOpacity
                key={location}
                style={styles.locationItem}
                onPress={() => {
                  setFormData({ ...formData, location });
                  setShowLocationModal(false);
                  if (errors.location) setErrors({ ...errors, location: undefined });
                }}
              >
                <Text style={styles.locationText}>{location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => setShowLocationModal(false)}
          />
        </View>
      </View>
    </Modal>
  );

  const renderCancelDialog = () => (
    <Modal
      visible={showCancelDialog}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowCancelDialog(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogTitle}>Cancel Adding Tree?</Text>
          <Text style={styles.dialogMessage}>You will lose your progress.</Text>
          
          <View style={styles.dialogButtons}>
            <Button
              title="Continue"
              variant="secondary"
              onPress={() => setShowCancelDialog(false)}
            />
            <Button
              title="Yes, Cancel"
              variant="primary"
              onPress={confirmCancel}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          testID="cancel-button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Your Tree</Text>
        <View style={styles.spacer} />
      </View>

      {renderProgressIndicator()}

      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <Button
            title="Back"
            variant="secondary"
            onPress={handleBack}
            disabled={loading}
          />
        )}
        
        {currentStep < 3 ? (
          <Button
            title="Next"
            variant="primary"
            onPress={handleNext}
            disabled={!formData.photo && currentStep === 1}
          />
        ) : (
          <Button
            title="Save Tree"
            variant="primary"
            onPress={handleSave}
            loading={loading}
          />
        )}
      </View>

      {renderSpeciesModal()}
      {renderLocationModal()}
      {renderCancelDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelText: {
    fontSize: 16,
    color: '#2D5016',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  spacer: {
    width: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: '#2D5016',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
  },
  photoButtonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  photoButton: {
    backgroundColor: '#F3F4F6',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  photoButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  selectedPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectorPlaceholder: {
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  sunExposureContainer: {
    marginBottom: 16,
  },
  sunExposureOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sunOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  sunOptionActive: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  sunOptionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  sunOptionTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  speciesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  speciesItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  speciesName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  speciesScientific: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  locationList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  locationItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locationText: {
    fontSize: 16,
    color: '#1F2937',
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

export default AddTreeScreen;