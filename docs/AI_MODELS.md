# AI Models Specification

## Overview

The Tree Care App uses custom-trained AI models specifically designed for horticultural analysis. Generic computer vision models cannot provide the precision needed for accurate tree care guidance.

## Model Architecture

### 1. Tree Species Classifier

**Purpose**: Identify tree species from photos with high confidence
**Critical Requirement**: Must distinguish between similar species that require different care (e.g., Red Oak vs White Oak pruning timing)

#### Model Specifications
- **Architecture**: EfficientNet-B4 backbone with custom classification head
- **Input**: RGB images (224x224x3) + optional metadata (location, season)
- **Output**: Species probabilities for 200+ common species + confidence score
- **Training Data**: 50,000+ labeled images across seasons and growth stages

#### Training Dataset Requirements
```
Species Training Data Structure:
├── Acer (Maples)/
│   ├── acer_rubrum/ (Red Maple)
│   │   ├── spring_young/     (500+ images)
│   │   ├── summer_mature/    (500+ images)
│   │   ├── fall_colors/      (500+ images)
│   │   └── winter_dormant/   (300+ images)
│   └── acer_saccharum/ (Sugar Maple)
│       └── [same structure]
├── Quercus (Oaks)/
│   ├── quercus_rubra/ (Red Oak)
│   └── quercus_alba/ (White Oak)
└── [150+ other species...]
```

#### Model Training Code
```python
# species_classifier.py
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB4
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout

class SpeciesClassifier:
    def __init__(self, num_species=200):
        self.num_species = num_species
        self.model = self.build_model()
    
    def build_model(self):
        # Load pre-trained EfficientNet
        base_model = EfficientNetB4(
            weights='imagenet',
            include_top=False,
            input_shape=(224, 224, 3)
        )
        
        # Freeze base layers initially
        base_model.trainable = False
        
        # Add custom classification head
        model = tf.keras.Sequential([
            base_model,
            GlobalAveragePooling2D(),
            Dropout(0.3),
            Dense(512, activation='relu'),
            Dropout(0.3),
            Dense(self.num_species, activation='softmax')
        ])
        
        return model
    
    def compile_model(self):
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_5_accuracy']
        )
    
    def fine_tune(self, train_data, val_data):
        # Initial training with frozen base
        history1 = self.model.fit(
            train_data,
            epochs=10,
            validation_data=val_data,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=3),
                tf.keras.callbacks.ReduceLROnPlateau(patience=2)
            ]
        )
        
        # Unfreeze top layers for fine-tuning
        self.model.layers[0].trainable = True
        
        # Lower learning rate for fine-tuning
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_5_accuracy']
        )
        
        # Fine-tune training
        history2 = self.model.fit(
            train_data,
            epochs=20,
            validation_data=val_data,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=5),
                tf.keras.callbacks.ModelCheckpoint(
                    'species_classifier_best.h5',
                    save_best_only=True
                )
            ]
        )
        
        return history1, history2
```

### 2. Tree Structure Analyzer

**Purpose**: Identify trunk, branches, canopy boundaries, and structural features
**Critical Use**: Generate precise pruning cut locations and assess tree architecture

#### Model Specifications
- **Architecture**: U-Net with ResNet50 encoder for semantic segmentation
- **Input**: RGB images (512x512x3)
- **Output**: Segmentation masks for trunk, primary branches, secondary branches, leaves
- **Additional Output**: Branch junction coordinates, trunk measurements

#### Training Data Requirements
```
Structure Annotation Format:
{
  "image_id": "tree_001.jpg",
  "annotations": {
    "trunk": {
      "mask": "binary_mask_array",
      "centerline": [[x1,y1], [x2,y2], ...],
      "diameter_pixels": 45
    },
    "primary_branches": [
      {
        "branch_id": 1,
        "mask": "binary_mask_array",
        "junction_point": [x, y],
        "angle_degrees": 45,
        "length_pixels": 120
      }
    ],
    "canopy_boundary": [[x1,y1], [x2,y2], ...],
    "pruning_points": [
      {
        "location": [x, y],
        "branch_collar": [x, y],
        "cut_angle": 45,
        "priority": "high|medium|low"
      }
    ]
  }
}
```

#### Structure Analysis Implementation
```python
# tree_structure_analyzer.py
import tensorflow as tf
import cv2
import numpy as np

class TreeStructureAnalyzer:
    def __init__(self):
        self.segmentation_model = self.build_unet()
        self.keypoint_model = self.build_keypoint_detector()
    
    def build_unet(self):
        # U-Net architecture for semantic segmentation
        inputs = tf.keras.layers.Input(shape=(512, 512, 3))
        
        # Encoder (ResNet50 backbone)
        encoder = tf.keras.applications.ResNet50(
            weights='imagenet',
            include_top=False,
            input_tensor=inputs
        )
        
        # Decoder with skip connections
        x = encoder.get_layer('conv5_block3_out').output
        x = tf.keras.layers.UpSampling2D(2)(x)
        x = tf.keras.layers.Conv2D(512, 3, padding='same', activation='relu')(x)
        
        # Skip connection from conv4_block6_out
        skip = encoder.get_layer('conv4_block6_out').output
        x = tf.keras.layers.Concatenate()([x, skip])
        
        # Continue decoder...
        # [Additional decoder layers]
        
        # Output: 4 classes (background, trunk, branches, leaves)
        outputs = tf.keras.layers.Conv2D(4, 1, activation='softmax')(x)
        
        return tf.keras.Model(inputs, outputs)
    
    def analyze_structure(self, image):
        # Preprocess image
        img_resized = cv2.resize(image, (512, 512))
        img_normalized = img_resized / 255.0
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        # Get segmentation masks
        masks = self.segmentation_model.predict(img_batch)[0]
        
        # Extract structural features
        trunk_mask = masks[:, :, 1] > 0.5
        branch_mask = masks[:, :, 2] > 0.5
        
        # Analyze trunk
        trunk_info = self.analyze_trunk(trunk_mask)
        
        # Analyze branches
        branch_info = self.analyze_branches(branch_mask, trunk_mask)
        
        # Generate pruning recommendations
        pruning_points = self.identify_pruning_locations(
            trunk_info, branch_info, image.shape[:2]
        )
        
        return {
            'trunk': trunk_info,
            'branches': branch_info,
            'pruning_points': pruning_points,
            'raw_masks': masks
        }
    
    def analyze_trunk(self, trunk_mask):
        # Find trunk centerline and measure diameter
        contours, _ = cv2.findContours(
            trunk_mask.astype(np.uint8), 
            cv2.RETR_EXTERNAL, 
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        if not contours:
            return {'diameter': 0, 'centerline': [], 'health': 'unknown'}
        
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Calculate diameter at multiple points
        diameters = []
        centerline = []
        
        # Extract skeleton for centerline
        skeleton = self.extract_skeleton(trunk_mask)
        
        return {
            'diameter_average': np.mean(diameters),
            'diameter_variation': np.std(diameters),
            'centerline': centerline,
            'straightness_score': self.calculate_straightness(centerline)
        }
    
    def identify_pruning_locations(self, trunk_info, branch_info, original_shape):
        pruning_points = []
        
        for branch in branch_info:
            # Check if branch needs pruning based on:
            # - Crossing/rubbing with other branches
            # - Poor angle attachment
            # - Dead/diseased sections
            # - Clearance requirements
            
            if self.should_prune_branch(branch, trunk_info):
                pruning_points.append({
                    'location': branch['junction_point'],
                    'branch_collar': self.find_branch_collar(branch),
                    'reason': branch['pruning_reason'],
                    'urgency': branch['urgency'],
                    'technique': self.select_pruning_technique(branch)
                })
        
        # Scale coordinates back to original image size
        scale_x = original_shape[1] / 512
        scale_y = original_shape[0] / 512
        
        for point in pruning_points:
            point['location'] = [
                point['location'][0] * scale_x,
                point['location'][1] * scale_y
            ]
        
        return pruning_points
```

### 3. Health Assessment Model

**Purpose**: Detect diseases, pest damage, and stress indicators
**Critical Use**: Early warning system for tree health issues

#### Model Specifications
- **Architecture**: Multi-task CNN with attention mechanisms
- **Input**: RGB images + species ID + seasonal context
- **Output**: Disease probability scores, stress indicators, health score (0-100)

#### Health Conditions Detected
```python
HEALTH_CONDITIONS = {
    'diseases': [
        'oak_wilt', 'fire_blight', 'dutch_elm_disease',
        'anthracnose', 'leaf_spot', 'powdery_mildew',
        'canker', 'root_rot', 'bacterial_blight'
    ],
    'pests': [
        'emerald_ash_borer', 'gypsy_moth', 'scale_insects',
        'aphids', 'spider_mites', 'tent_caterpillars',
        'bark_beetles', 'leaf_miners'
    ],
    'stress_indicators': [
        'drought_stress', 'nutrient_deficiency', 'salt_damage',
        'compaction_stress', 'chemical_burn', 'storm_damage',
        'construction_damage', 'air_pollution'
    ],
    'structural_issues': [
        'dead_branches', 'weak_crotches', 'co_dominant_stems',
        'included_bark', 'decay_pockets', 'root_problems'
    ]
}
```

### 4. Shape Progress Tracker

**Purpose**: Assess progress toward selected tree shape goals
**Critical Use**: Personalized guidance for achieving specific canopy forms

#### Shape-Specific Models
Each tree shape requires its own specialized model:

```python
SHAPE_MODELS = {
    'high_canopy': {
        'success_criteria': [
            'clearance_height >= 8_feet',
            'central_leader_dominance > 0.7',
            'scaffold_spacing = 18_36_inches',
            'live_crown_ratio > 0.6'
        ],
        'model_file': 'high_canopy_tracker.h5'
    },
    'espalier_fan': {
        'success_criteria': [
            'branch_angle_uniformity > 0.8',
            'wall_coverage > 0.7',
            'branch_spacing_consistency > 0.75'
        ],
        'model_file': 'espalier_tracker.h5'
    },
    'privacy_screen': {
        'success_criteria': [
            'density_score > 0.8',
            'height_uniformity > 0.9',
            'gap_coverage > 0.95'
        ],
        'model_file': 'privacy_screen_tracker.h5'
    }
}
```

## Model Deployment

### SageMaker Endpoints
```python
# model_deployment.py
import boto3
import sagemaker

def deploy_models():
    sagemaker_session = sagemaker.Session()
    
    # Deploy species classifier
    species_model = sagemaker.tensorflow.TensorFlowModel(
        model_data='s3://tree-models/species-classifier/model.tar.gz',
        role=sagemaker.get_execution_role(),
        framework_version='2.8'
    )
    
    species_predictor = species_model.deploy(
        initial_instance_count=1,
        instance_type='ml.m5.large',
        endpoint_name='tree-species-classifier'
    )
    
    # Deploy structure analyzer
    structure_model = sagemaker.tensorflow.TensorFlowModel(
        model_data='s3://tree-models/structure-analyzer/model.tar.gz',
        role=sagemaker.get_execution_role(),
        framework_version='2.8'
    )
    
    structure_predictor = structure_model.deploy(
        initial_instance_count=1,
        instance_type='ml.p3.2xlarge',  # GPU for faster inference
        endpoint_name='tree-structure-analyzer'
    )
    
    return {
        'species_endpoint': species_predictor.endpoint_name,
        'structure_endpoint': structure_predictor.endpoint_name
    }
```

### Model Performance Monitoring
```python
# model_monitoring.py
import boto3
import json

def monitor_model_performance():
    cloudwatch = boto3.client('cloudwatch')
    
    # Track inference latency
    cloudwatch.put_metric_data(
        Namespace='TreeCareApp/ModelPerformance',
        MetricData=[
            {
                'MetricName': 'InferenceLatency',
                'Dimensions': [
                    {'Name': 'ModelType', 'Value': 'SpeciesClassifier'}
                ],
                'Value': inference_time_ms,
                'Unit': 'Milliseconds'
            }
        ]
    )
    
    # Track prediction confidence
    cloudwatch.put_metric_data(
        Namespace='TreeCareApp/ModelAccuracy',
        MetricData=[
            {
                'MetricName': 'PredictionConfidence',
                'Dimensions': [
                    {'Name': 'ModelType', 'Value': 'SpeciesClassifier'}
                ],
                'Value': confidence_score,
                'Unit': 'Percent'
            }
        ]
    )
```

## Model Training Pipeline

### Automated Retraining
```python
# training_pipeline.py
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import TrainingStep, ProcessingStep

def create_retraining_pipeline():
    # Data preprocessing step
    preprocessing_step = ProcessingStep(
        name='preprocess-training-data',
        processor=sklearn_processor,
        inputs=[
            ProcessingInput(
                source='s3://tree-training-data/new-images/',
                destination='/opt/ml/processing/input'
            )
        ],
        code='preprocessing.py'
    )
    
    # Model training step
    training_step = TrainingStep(
        name='train-species-classifier',
        estimator=tensorflow_estimator,
        inputs={
            'train': TrainingInput(
                s3_data='s3://tree-training-data/processed/train/',
                content_type='image/jpeg'
            ),
            'validation': TrainingInput(
                s3_data='s3://tree-training-data/processed/val/',
                content_type='image/jpeg'
            )
        }
    )
    
    # Model evaluation step
    evaluation_step = ProcessingStep(
        name='evaluate-model',
        processor=evaluation_processor,
        inputs=[
            ProcessingInput(
                source=training_step.properties.ModelArtifacts.S3ModelArtifacts,
                destination='/opt/ml/processing/model'
            )
        ],
        code='evaluation.py'
    )
    
    # Create pipeline
    pipeline = Pipeline(
        name='tree-model-training-pipeline',
        steps=[preprocessing_step, training_step, evaluation_step]
    )
    
    return pipeline
```

## Model Accuracy Targets

### Species Classifier
- **Primary Species (Top 50)**: >95% accuracy
- **Secondary Species (51-150)**: >85% accuracy  
- **Rare Species (151-200)**: >70% accuracy
- **Confidence Threshold**: Reject predictions <80% confidence

### Structure Analyzer
- **Trunk Detection**: >98% pixel accuracy
- **Primary Branch Detection**: >90% accuracy
- **Pruning Point Precision**: Within 2 inches of expert annotation

### Health Assessment
- **Disease Detection**: >85% sensitivity, <10% false positive rate
- **Pest Identification**: >80% accuracy on common pests
- **Stress Indicator Detection**: >75% accuracy

### Shape Progress Tracker
- **Progress Scoring**: ±10% of expert evaluation
- **Milestone Achievement**: >90% agreement with arborists
- **Timeline Prediction**: ±6 months accuracy

These AI models form the intelligent core of the Tree Care App, providing professional-grade analysis that transforms amateur tree care into expert-guided cultivation.
