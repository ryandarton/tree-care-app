# Technical Architecture

## System Overview

The Tree Care App uses a serverless-first architecture built entirely on AWS services, with custom AI models for horticultural analysis and a React Native mobile frontend.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  React Native   │────│   API Gateway    │────│   Lambda Functions │
│   Mobile App    │    │   + CloudFront   │    │    (Node.js)       │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                         │
                                │                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   S3 Storage    │    │   EventBridge    │    │     DynamoDB        │
│ (Photos/Assets) │    │   (Scheduling)   │    │   (User/Tree Data)  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                         │
                                │                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   SageMaker     │    │      SNS         │    │    DocumentDB       │
│  (AI Models)    │    │ (Notifications)  │    │ (Species/Rules DB)  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Core Services

### Mobile Application (React Native + Expo)

**Key Dependencies:**
```json
{
  "expo": "~49.0.0",
  "react-native": "0.72.0",
  "aws-amplify": "^6.0.0",
  "react-native-camera": "^4.2.1",
  "react-native-svg": "^13.9.0",
  "@stripe/stripe-react-native": "^0.27.0",
  "react-native-google-mobile-ads": "^12.0.0"
}
```

**Core Features:**
- Photo capture with camera guides
- Real-time AI analysis integration
- Offline-capable data storage
- Push notification handling
- Subscription management
- Visual overlay rendering

### Backend API (AWS Lambda + Node.js)

**Lambda Functions:**
- `analyzePhoto`: Process tree photos with AI models
- `generateRecommendations`: Create personalized care advice
- `manageSubscriptions`: Handle Stripe payment events
- `sendNotifications`: Smart scheduling and reminders
- `processImages`: Resize and optimize uploaded photos

**API Endpoints:**
```
POST /api/v1/trees                    # Create new tree profile
GET  /api/v1/trees/{id}              # Get tree details
POST /api/v1/photos/analyze          # Analyze tree photo
GET  /api/v1/recommendations/{treeId} # Get care recommendations
POST /api/v1/subscriptions           # Manage payments
POST /api/v1/notifications/schedule  # Schedule reminders
```

### Database Architecture

#### DynamoDB Tables

**Users Table:**
```javascript
{
  userId: String (PK),
  email: String,
  subscriptionTier: String, // 'free', 'hobbyist', 'arborist'
  location: {
    coordinates: [Number],
    climateZone: String
  },
  preferences: Object,
  createdAt: Date
}
```

**Trees Table:**
```javascript
{
  treeId: String (PK),
  userId: String (GSI),
  species: {
    scientificName: String,
    commonName: String
  },
  shapeGoal: {
    goalId: String, // 'high_canopy', 'espalier_fan'
    selectedAt: Date,
    targetTimeline: Number
  },
  currentStatus: {
    height: Number,
    age: Number,
    healthScore: Number
  },
  careHistory: Array
}
```

**Photos Table:**
```javascript
{
  photoId: String (PK),
  treeId: String (GSI),
  s3Key: String,
  analysisResults: {
    speciesConfidence: Number,
    structureData: Object,
    healthAssessment: Object,
    recommendedActions: Array
  },
  timestamp: Date
}
```

#### DocumentDB Collections

**Species Database:**
```javascript
{
  _id: ObjectId,
  scientificName: String,
  commonNames: [String],
  characteristics: {
    matureHeight: [Number, Number],
    growthRate: String,
    pruningSchedule: Object
  },
  shapeCompatibility: [String], // Compatible shape goals
  careInstructions: Object
}
```

## AI/ML Architecture

### Custom Models (SageMaker)

**1. Tree Species Classifier**
- **Input**: RGB image (224x224)
- **Output**: Species probabilities + confidence scores
- **Training Data**: 50,000+ labeled tree images
- **Accuracy Target**: >85% on common species

**2. Tree Structure Analyzer**
- **Input**: RGB image + species metadata
- **Output**: Branch locations, trunk measurements, canopy boundaries
- **Model Type**: Semantic segmentation + object detection
- **Training Data**: 100,000+ annotated structural images

**3. Health Assessment Model**
- **Input**: RGB image + species + season data
- **Output**: Disease indicators, stress signs, health score
- **Training Data**: 25,000+ diagnostic images
- **Integration**: Alerts for urgent health issues

**4. Shape Progress Tracker**
- **Input**: Photo + target shape goal + tree age
- **Output**: Progress score + specific corrections needed
- **Model Type**: Custom CNN with shape-specific training
- **Training Data**: Before/after pairs for each shape type

### Model Deployment Pipeline

```python
# SageMaker training pipeline
def create_training_pipeline():
    pipeline = Pipeline(
        name='tree-analysis-training',
        steps=[
            ProcessingStep(
                name='data-preprocessing',
                processor=data_processor,
                inputs=[training_data_s3]
            ),
            TrainingStep(
                name='model-training',
                estimator=tensorflow_estimator,
                inputs={'train': processed_data}
            ),
            CreateModelStep(
                name='create-model',
                model=model_from_estimator
            ),
            RegisterModelStep(
                name='register-model',
                model=model,
                model_package_group_name='tree-analysis-models'
            )
        ]
    )
    return pipeline
```

## Data Flow

### Photo Analysis Workflow

1. **Mobile App** captures photo with metadata (GPS, timestamp, user annotations)
2. **S3** stores original photo, triggers Lambda via EventBridge
3. **Image Processing Lambda** resizes/optimizes photo
4. **AI Analysis Lambda** runs multiple models in parallel:
   - Species identification
   - Structure analysis
   - Health assessment
   - Shape progress evaluation
5. **Recommendation Engine** combines AI results with species data and care history
6. **Response** sent back to mobile app with:
   - Analysis results
   - Visual overlays for pruning guidance
   - Personalized recommendations
   - Timeline updates

### Notification Scheduling

1. **EventBridge** rules trigger based on:
   - Species-specific care calendars
   - Weather conditions (API integration)
   - User-defined preferences
   - Tree age and development stage
2. **Lambda Function** evaluates conditions and creates notifications
3. **SNS** delivers via push notifications and/or SMS
4. **DynamoDB** tracks delivery and user responses

## Security & Privacy

### Authentication
- AWS Cognito for user management
- JWT tokens for API access
- OAuth integration for social login

### Data Protection
- All photos encrypted at rest (S3 KMS)
- API traffic over HTTPS only
- Personal data anonymized for AI training
- GDPR/CCPA compliance for data deletion

### Access Control
- IAM roles with least privilege
- API rate limiting per user tier
- Geographic restrictions where applicable

## Performance & Scalability

### Caching Strategy
- CloudFront CDN for photo delivery
- DynamoDB DAX for hot data
- Lambda provisioned concurrency for critical functions
- Redis cluster for session data

### Auto-Scaling
- Lambda automatically scales to demand
- DynamoDB on-demand pricing with burst capacity
- SageMaker endpoints with auto-scaling policies
- S3 with Intelligent Tiering for cost optimization

### Monitoring
- CloudWatch dashboards for all services
- X-Ray tracing for request flow analysis
- Custom metrics for business KPIs
- Automated alerts for system health

## Cost Optimization

### Estimated Monthly Costs (10K active users)
- **Lambda**: $150 (photo processing + API calls)
- **DynamoDB**: $200 (user/tree data + photos metadata)
- **S3**: $100 (photo storage + transfers)
- **SageMaker**: $800 (AI inference + training)
- **Other AWS Services**: $250 (SNS, EventBridge, CloudWatch)
- **Total**: ~$1,500/month

### Optimization Strategies
- Spot instances for model training (70% savings)
- S3 lifecycle policies for old photos
- Lambda provisioned concurrency only for critical paths
- Reserved capacity for predictable workloads

## Development Workflow

### Environment Strategy
- **Development**: Local dev + AWS sandbox account
- **Staging**: Full AWS environment with synthetic data
- **Production**: Multi-region deployment with monitoring

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy Tree Care App
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          aws cloudformation deploy \
            --template-file infrastructure/cloudformation.yml \
            --stack-name tree-care-app-prod
```

This architecture provides enterprise-grade reliability, security, and scalability while maintaining cost efficiency through serverless-first design and intelligent resource management.
