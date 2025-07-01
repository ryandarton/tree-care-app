# Development Guidelines

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

#### Required Software
- **Node.js 18+** and npm
- **Python 3.9+** for AI model development
- **AWS CLI** configured with development credentials
- **Git** for version control

#### Mobile Development
- **React Native CLI**: `npm install -g react-native-cli`
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Development**: Xcode 14+ (macOS only)
- **Android Development**: Android Studio + SDK

#### Backend Development
- **AWS SAM CLI** for local Lambda testing
- **Docker** for containerized development
- **Postman** or similar for API testing

### Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-org/tree-care-app.git
cd tree-care-app

# Install dependencies for all components
npm run install-all

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your development keys
```

## Project Structure Deep Dive

### Mobile App (`/mobile`)

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Camera/        # Photo capture components
│   │   ├── TreeCard/      # Tree profile display
│   │   ├── ProgressBar/   # Shape goal progress
│   │   └── common/        # Shared UI elements
│   ├── screens/           # Main app screens
│   │   ├── TreeList/      # User's tree inventory
│   │   ├── PhotoAnalysis/ # AI analysis results
│   │   ├── ShapeGoals/    # Goal selection
│   │   └── Settings/      # User preferences
│   ├── services/          # API and business logic
│   │   ├── TreeService.js # Tree CRUD operations
│   │   ├── PhotoService.js # Image handling
│   │   ├── AIService.js   # ML model integration
│   │   └── PaymentService.js # Stripe integration
│   ├── store/             # Redux state management
│   │   ├── slices/        # Redux Toolkit slices
│   │   └── middleware/    # Custom middleware
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript definitions
├── assets/                # Images, fonts, icons
├── __tests__/            # Unit and integration tests
└── android/ios/          # Platform-specific code
```

### Backend (`/backend`)

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── photoAnalysis.js   # AI processing
│   │   ├── recommendations.js # Care guidance
│   │   ├── subscriptions.js   # Payment handling
│   │   └── notifications.js   # Smart scheduling
│   ├── services/          # Business logic
│   │   ├── AIModelService.js  # SageMaker integration
│   │   ├── DatabaseService.js # DynamoDB operations
│   │   ├── SpeciesService.js  # Tree knowledge base
│   │   └── WeatherService.js  # External API integration
│   ├── models/            # Data models and schemas
│   ├── utils/             # Shared utilities
│   └── middleware/        # Request processing
├── tests/                 # Backend tests
├── infrastructure/        # CloudFormation templates
└── docs/                 # API documentation
```

### AI Models (`/ai-models`)

```
ai-models/
├── species_classifier/    # Tree species identification
│   ├── model.py          # Model architecture
│   ├── training.py       # Training pipeline
│   ├── preprocessing.py  # Data preparation
│   └── evaluation.py     # Model validation
├── structure_analyzer/    # Tree structure analysis
├── health_assessor/       # Disease/pest detection
├── shape_tracker/         # Progress monitoring
├── data/                  # Training datasets
│   ├── species/          # Species images
│   ├── structure/        # Annotated structure data
│   └── health/           # Disease/health examples
└── notebooks/            # Jupyter research notebooks
```

## Development Workflow

### Feature Development Process

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/shape-goal-selection
   ```

2. **Follow TDD Approach**
   ```bash
   # Write tests first
   npm run test:watch
   
   # Implement feature
   # Run tests continuously
   ```

3. **Code Quality Checks**
   ```bash
   # Lint and format
   npm run lint
   npm run format
   
   # Type checking (if using TypeScript)
   npm run type-check
   ```

4. **Test Thoroughly**
   ```bash
   # Unit tests
   npm run test
   
   # Integration tests
   npm run test:integration
   
   # Mobile app testing
   npm run test:detox
   ```

5. **Create Pull Request**
   - Include detailed description
   - Add screenshots for UI changes
   - Link to relevant issues
   - Request code review

### Code Standards

#### JavaScript/TypeScript Style

```javascript
// Use descriptive variable names
const treeAnalysisResults = await analyzeTreePhoto(photoUri);

// Prefer const/let over var
const MAX_TREE_COUNT = 10;
let currentTreeCount = userTrees.length;

// Use async/await over promises
async function uploadPhoto(imageUri) {
  try {
    const uploadResult = await S3Service.upload(imageUri);
    return uploadResult.Location;
  } catch (error) {
    console.error('Upload failed:', error);
    throw new Error('Photo upload failed');
  }
}

// Comment complex business logic
// Calculate optimal pruning timing based on species, climate, and season
const optimalPruningDate = calculatePruningWindow(
  treeSpecies,
  climateZone,
  currentSeason
);
```

#### React Native Component Standards

```javascript
// Use functional components with hooks
import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const TreeCard = ({tree, onPress}) => {
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    calculateHealthScore(tree).then(setHealthScore);
  }, [tree]);

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(tree)}>
      <Text style={styles.treeName}>{tree.name}</Text>
      <Text style={styles.species}>{tree.species.commonName}</Text>
      <View style={styles.healthBar}>
        <View style={[styles.healthFill, {width: `${healthScore}%`}]} />
      </View>
    </TouchableOpacity>
  );
};

// Use StyleSheet for better performance
const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  species: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  healthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
});

export default TreeCard;
```

#### Backend API Standards

```javascript
// Use proper error handling
exports.analyzePhoto = async (event, context) => {
  try {
    // Validate input
    const {treeId, photoData} = JSON.parse(event.body);
    if (!treeId || !photoData) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: 'Missing required fields'}),
      };
    }

    // Process request
    const analysisResult = await AIService.analyzeTreePhoto(photoData);
    const recommendations = await generateRecommendations(treeId, analysisResult);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        analysis: analysisResult,
        recommendations: recommendations,
      }),
    };
  } catch (error) {
    console.error('Photo analysis failed:', error);
    
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
```

### Testing Standards

#### Unit Tests (Jest)

```javascript
// TreeService.test.js
import TreeService from '../services/TreeService';
import {mockTree, mockUser} from '../__mocks__/testData';

describe('TreeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTree', () => {
    it('should create a new tree with valid data', async () => {
      const treeData = {
        name: 'Front Yard Oak',
        species: 'quercus_rubra',
        location: {lat: 40.7128, lng: -74.0060},
      };

      const result = await TreeService.createTree(mockUser.id, treeData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(treeData.name);
      expect(result.species).toBe(treeData.species);
    });

    it('should reject invalid species', async () => {
      const invalidTreeData = {
        name: 'Invalid Tree',
        species: 'fake_species',
      };

      await expect(
        TreeService.createTree(mockUser.id, invalidTreeData)
      ).rejects.toThrow('Invalid species');
    });
  });
});
```

#### Integration Tests

```javascript
// API integration tests
describe('Photo Analysis API', () => {
  it('should process photo and return analysis', async () => {
    const testPhotoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
    
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        treeId: 'test-tree-123',
        photoData: testPhotoBase64,
      }),
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.analysis).toBeDefined();
    expect(result.analysis.species).toBeDefined();
    expect(result.recommendations).toBeInstanceOf(Array);
  });
});
```

#### Mobile UI Tests (Detox)

```javascript
// TreeList.e2e.js
describe('Tree List Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display user trees', async () => {
    await expect(element(by.id('tree-list'))).toBeVisible();
    await expect(element(by.text('Front Yard Oak'))).toBeVisible();
  });

  it('should navigate to tree details when tapped', async () => {
    await element(by.text('Front Yard Oak')).tap();
    await expect(element(by.id('tree-details-screen'))).toBeVisible();
  });

  it('should allow adding new tree', async () => {
    await element(by.id('add-tree-button')).tap();
    await expect(element(by.id('add-tree-screen'))).toBeVisible();
  });
});
```

### Environment Management

#### Development Environment Variables

```bash
# .env.development
NODE_ENV=development
API_BASE_URL=https://api-dev.treecare.app
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
```

#### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
API_BASE_URL=https://api-staging.treecare.app
# ... staging-specific values
```

#### Production Environment

```bash
# .env.production
NODE_ENV=production
API_BASE_URL=https://api.treecare.app
# ... production values (never commit to git)
```

### Performance Guidelines

#### Mobile App Performance

```javascript
// Use React.memo for expensive components
const TreeAnalysisResults = React.memo(({analysis}) => {
  return (
    <View>
      {/* Render analysis results */}
    </View>
  );
});

// Implement lazy loading for images
const LazyImage = ({uri, style}) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <View style={style}>
      {!loaded && <ActivityIndicator />}
      <Image
        source={{uri}}
        style={[style, {opacity: loaded ? 1 : 0}]}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};

// Use FlatList for large datasets
const TreeList = ({trees}) => {
  const renderTree = useCallback(({item}) => (
    <TreeCard tree={item} />
  ), []);

  return (
    <FlatList
      data={trees}
      renderItem={renderTree}
      keyExtractor={item => item.id}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};
```

#### Backend Performance

```javascript
// Use connection pooling for databases
const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamoClient = new DynamoDB.DocumentClient({
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100;
    }
  }
});

// Implement caching for expensive operations
const NodeCache = require('node-cache');
const speciesCache = new NodeCache({stdTTL: 3600}); // 1 hour

async function getSpeciesData(speciesId) {
  const cacheKey = `species:${speciesId}`;
  let speciesData = speciesCache.get(cacheKey);
  
  if (!speciesData) {
    speciesData = await database.getSpecies(speciesId);
    speciesCache.set(cacheKey, speciesData);
  }
  
  return speciesData;
}
```

### Security Best Practices

#### API Security

```javascript
// Input validation
const Joi = require('joi');

const treeSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  species: Joi.string().pattern(/^[a-z_]+$/).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
});

// Rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
```

#### Mobile App Security

```javascript
// Secure storage for sensitive data
import {getSecureStore, setSecureStore} from './secureStorage';

const storeAuthToken = async (token) => {
  await setSecureStore('auth_token', token);
};

const getAuthToken = async () => {
  return await getSecureStore('auth_token');
};

// Certificate pinning for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Add certificate pinning in production
});
```

## Debugging and Troubleshooting

### Common Issues

#### React Native Debugging

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clean build
cd ios && xcodebuild clean && cd ..
cd android && ./gradlew clean && cd ..

# Check bundle analyzer
npx react-native bundle --platform ios --dev false --analyze
```

#### Backend Debugging

```bash
# Local Lambda testing
sam local start-api --env-vars env.json

# CloudWatch logs
aws logs tail /aws/lambda/tree-care-photo-analysis --follow

# DynamoDB local
docker run -p 8000:8000 amazon/dynamodb-local
```

### Performance Monitoring

```javascript
// Mobile app performance tracking
import {Performance} from 'react-native-performance';

const trackPhotoAnalysis = async (photoUri) => {
  const marker = Performance.mark('photo-analysis-start');
  
  try {
    const result = await analyzePhoto(photoUri);
    Performance.measure('photo-analysis', marker);
    return result;
  } catch (error) {
    Performance.measure('photo-analysis-error', marker);
    throw error;
  }
};
```

This development guide ensures consistent, high-quality code across the entire Tree Care App project while maintaining performance, security, and maintainability standards.
