# Deployment Guide

## Overview

This guide covers deploying the Tree Care App to production using AWS services with a focus on reliability, scalability, and cost optimization.

## Prerequisites

### Required AWS Services Setup
- **AWS Account** with programmatic access
- **Domain Name** registered (e.g., treecare.app)
- **SSL Certificate** via AWS Certificate Manager
- **Stripe Account** for payment processing
- **Apple Developer Account** for iOS deployment
- **Google Play Console** for Android deployment

### Required Tools
```bash
# Install AWS CDK
npm install -g aws-cdk

# Install Serverless Framework (alternative)
npm install -g serverless

# Install React Native deployment tools
npm install -g @expo/cli
npm install -g react-native-cli

# Install deployment helpers
npm install -g aws-cli
```

## Infrastructure Deployment

### Phase 1: Core AWS Infrastructure

#### 1. Setup AWS CDK Project

```typescript
// infrastructure/lib/tree-care-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export class TreeCareStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'TreeCare-Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    const treesTable = new dynamodb.Table(this, 'TreesTable', {
      tableName: 'TreeCare-Trees',
      partitionKey: { name: 'treeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    // Add Global Secondary Index for user queries
    treesTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // S3 Bucket for photo storage
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: 'treecare-photos-prod',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'photo-lifecycle',
          transitions: [
            {
              storageClass: s3.StorageClass.STANDARD_IA,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'PhotosCDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(photosBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Lambda Functions
    const photoAnalysisFunction = new lambda.Function(this, 'PhotoAnalysisFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'photoAnalysis.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      timeout: cdk.Duration.seconds(300),
      memorySize: 3008,
      environment: {
        USERS_TABLE: usersTable.tableName,
        TREES_TABLE: treesTable.tableName,
        PHOTOS_BUCKET: photosBucket.bucketName,
        SAGEMAKER_ENDPOINT: 'tree-species-classifier',
      },
    });

    // Grant permissions
    usersTable.grantReadWriteData(photoAnalysisFunction);
    treesTable.grantReadWriteData(photoAnalysisFunction);
    photosBucket.grantReadWrite(photoAnalysisFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'TreeCareAPI', {
      restApiName: 'Tree Care API',
      description: 'API for Tree Care mobile app',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Resources
    const treesResource = api.root.addResource('trees');
    const photosResource = api.root.addResource('photos');
    
    // API Methods
    treesResource.addMethod('POST', new apigateway.LambdaIntegration(createTreeFunction));
    treesResource.addMethod('GET', new apigateway.LambdaIntegration(getTreesFunction));
    
    photosResource.addResource('analyze').addMethod('POST', 
      new apigateway.LambdaIntegration(photoAnalysisFunction)
    );
  }
}
```

#### 2. Deploy Infrastructure

```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy to development
cdk deploy TreeCareStack-dev --profile dev

# Deploy to production
cdk deploy TreeCareStack-prod --profile prod
```

### Phase 2: AI Model Deployment

#### 1. SageMaker Model Deployment

```python
# ai-models/deploy_models.py
import boto3
import sagemaker
from sagemaker.tensorflow import TensorFlowModel

def deploy_species_classifier():
    """Deploy species classification model to SageMaker endpoint"""
    
    # Create SageMaker session
    sess = sagemaker.Session()
    role = sagemaker.get_execution_role()
    
    # Create TensorFlow model
    model = TensorFlowModel(
        model_data='s3://treecare-ml-models/species-classifier/model.tar.gz',
        role=role,
        framework_version='2.8',
        py_version='py39',
        entry_point='inference.py',
        source_dir='species_classifier'
    )
    
    # Deploy to endpoint
    predictor = model.deploy(
        initial_instance_count=1,
        instance_type='ml.m5.large',
        endpoint_name='tree-species-classifier-prod',
        wait=True
    )
    
    return predictor.endpoint_name

def deploy_structure_analyzer():
    """Deploy structure analysis model"""
    
    sess = sagemaker.Session()
    role = sagemaker.get_execution_role()
    
    model = TensorFlowModel(
        model_data='s3://treecare-ml-models/structure-analyzer/model.tar.gz',
        role=role,
        framework_version='2.8',
        py_version='py39',
        entry_point='inference.py',
        source_dir='structure_analyzer'
    )
    
    # Use GPU instance for faster inference
    predictor = model.deploy(
        initial_instance_count=1,
        instance_type='ml.p3.2xlarge',
        endpoint_name='tree-structure-analyzer-prod',
        wait=True
    )
    
    return predictor.endpoint_name

if __name__ == '__main__':
    print("Deploying AI models...")
    
    species_endpoint = deploy_species_classifier()
    print(f"Species classifier deployed: {species_endpoint}")
    
    structure_endpoint = deploy_structure_analyzer()
    print(f"Structure analyzer deployed: {structure_endpoint}")
    
    print("All models deployed successfully!")
```

#### 2. Model Deployment Script

```bash
#!/bin/bash
# scripts/deploy-ai-models.sh

echo "Starting AI model deployment..."

# Set AWS profile for production
export AWS_PROFILE=prod

# Upload model artifacts to S3
echo "Uploading model artifacts..."
aws s3 sync ai-models/trained-models/ s3://treecare-ml-models/ --delete

# Deploy models to SageMaker
echo "Deploying to SageMaker..."
cd ai-models
python deploy_models.py

# Update Lambda environment variables with new endpoints
echo "Updating Lambda configuration..."
aws lambda update-function-configuration \
  --function-name TreeCare-PhotoAnalysis-Prod \
  --environment Variables='{
    "SPECIES_ENDPOINT":"tree-species-classifier-prod",
    "STRUCTURE_ENDPOINT":"tree-structure-analyzer-prod"
  }'

echo "AI model deployment complete!"
```

### Phase 3: Backend API Deployment

#### 1. Serverless Framework Configuration

```yaml
# backend/serverless.yml
service: tree-care-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
  environment:
    STAGE: ${self:provider.stage}
    USERS_TABLE: TreeCare-Users-${self:provider.stage}
    TREES_TABLE: TreeCare-Trees-${self:provider.stage}
    PHOTOS_BUCKET: treecare-photos-${self:provider.stage}
    
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
      Resource:
        - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE}
        - arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TREES_TABLE}
    - Effect: Allow
      Action:
        - s3:GetObject
        - s3:PutObject
        - s3:DeleteObject
      Resource:
        - arn:aws:s3:::${self:provider.environment.PHOTOS_BUCKET}/*
    - Effect: Allow
      Action:
        - sagemaker:InvokeEndpoint
      Resource:
        - arn:aws:sagemaker:${self:provider.region}:*:endpoint/*

functions:
  analyzePhoto:
    handler: src/handlers/photoAnalysis.handler
    timeout: 300
    memorySize: 3008
    events:
      - http:
          path: /analyze
          method: post
          cors: true
          
  createTree:
    handler: src/handlers/trees.create
    events:
      - http:
          path: /trees
          method: post
          cors: true
          
  getTrees:
    handler: src/handlers/trees.list
    events:
      - http:
          path: /trees
          method: get
          cors: true

  generateRecommendations:
    handler: src/handlers/recommendations.generate
    timeout: 60
    events:
      - http:
          path: /recommendations/{treeId}
          method: get
          cors: true

plugins:
  - serverless-webpack
  - serverless-offline
  - serverless-domain-manager

custom:
  webpack:
    webpackConfig: webpack.config.js
    includeModules: true
    
  customDomain:
    domainName: api.treecare.app
    basePath: v1
    stage: ${self:provider.stage}
    createRoute53Record: true
```

#### 2. Backend Deployment Script

```bash
#!/bin/bash
# scripts/deploy-backend.sh

STAGE=${1:-dev}

echo "Deploying backend to stage: $STAGE"

# Set AWS profile
if [ "$STAGE" = "prod" ]; then
  export AWS_PROFILE=prod
else
  export AWS_PROFILE=dev
fi

# Navigate to backend directory
cd backend

# Install dependencies
npm ci

# Run tests
npm test

# Build the project
npm run build

# Deploy with Serverless
npx serverless deploy --stage $STAGE --verbose

# Update API Gateway custom domain (production only)
if [ "$STAGE" = "prod" ]; then
  npx serverless create_domain --stage $STAGE
fi

echo "Backend deployment complete!"
```

## Mobile App Deployment

### iOS Deployment

#### 1. Prepare iOS Build

```bash
# mobile/scripts/build-ios.sh
#!/bin/bash

echo "Building iOS app for production..."

# Clean previous builds
rm -rf ios/build
cd ios && xcodebuild clean && cd ..

# Install dependencies
npm ci

# Update version number
npm version patch

# Build for release
npx react-native run-ios --configuration Release

# Archive for App Store
cd ios
xcodebuild -workspace TreeCareApp.xcworkspace \
  -scheme TreeCareApp \
  -configuration Release \
  -archivePath "./build/TreeCareApp.xcarchive" \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath "./build/TreeCareApp.xcarchive" \
  -exportOptionsPlist "./ExportOptions.plist" \
  -exportPath "./build/"

echo "iOS build complete!"
```

#### 2. App Store Upload

```bash
# Upload to App Store Connect
xcrun altool --upload-app \
  --type ios \
  --file "./build/TreeCareApp.ipa" \
  --username "your-apple-id@email.com" \
  --password "app-specific-password"
```

### Android Deployment

#### 1. Prepare Android Build

```bash
# mobile/scripts/build-android.sh
#!/bin/bash

echo "Building Android app for production..."

# Clean previous builds
cd android && ./gradlew clean && cd ..

# Install dependencies
npm ci

# Update version
npm version patch

# Build release APK
cd android
./gradlew assembleRelease

# Build App Bundle (recommended for Play Store)
./gradlew bundleRelease

echo "Android build complete!"
echo "APK: android/app/build/outputs/apk/release/app-release.apk"
echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
```

#### 2. Play Store Upload

```bash
# Upload to Google Play Console using fastlane
cd mobile
fastlane supply \
  --aab android/app/build/outputs/bundle/release/app-release.aab \
  --track production
```

### Expo Deployment (Alternative)

```bash
# For Expo-managed workflow
cd mobile

# Build for iOS
eas build --platform ios --profile production

# Build for Android  
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Database Migration & Setup

### Initial Data Setup

```javascript
// scripts/setup-production-data.js
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1'
});

async function setupSpeciesData() {
  console.log('Setting up species database...');
  
  const speciesData = require('./data/tree-species.json');
  
  for (const species of speciesData) {
    await dynamodb.put({
      TableName: 'TreeCare-Species-prod',
      Item: species
    }).promise();
  }
  
  console.log(`Loaded ${speciesData.length} species`);
}

async function setupPruningRules() {
  console.log('Setting up pruning rules...');
  
  const rulesData = require('./data/pruning-rules.json');
  
  for (const rule of rulesData) {
    await dynamodb.put({
      TableName: 'TreeCare-PruningRules-prod',
      Item: rule
    }).promise();
  }
  
  console.log(`Loaded ${rulesData.length} pruning rules`);
}

async function main() {
  try {
    await setupSpeciesData();
    await setupPruningRules();
    console.log('Production data setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
```

## Environment Configuration

### Production Environment Variables

```bash
# Production .env (never commit to git)
NODE_ENV=production
API_BASE_URL=https://api.treecare.app/v1
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe (production keys)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# SageMaker endpoints
SPECIES_CLASSIFIER_ENDPOINT=tree-species-classifier-prod
STRUCTURE_ANALYZER_ENDPOINT=tree-structure-analyzer-prod
HEALTH_ASSESSOR_ENDPOINT=tree-health-assessor-prod

# Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
NEW_RELIC_LICENSE_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# External APIs
WEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
PLANTNET_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Secrets Management

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "tree-care-app/production" \
  --description "Production secrets for Tree Care App" \
  --secret-string '{
    "stripe_secret_key": "your_stripe_secret_key_here",
    "stripe_webhook_secret": "whsec_...",
    "sentry_dsn": "https://...@sentry.io/...",
    "weather_api_key": "...",
    "plantnet_api_key": "..."
  }'
```

## Monitoring & Alerting

### CloudWatch Dashboards

```typescript
// infrastructure/lib/monitoring-stack.ts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TreeCareDashboard', {
      dashboardName: 'TreeCare-Production-Metrics',
    });

    // API metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: 'Tree Care API',
            },
            statistic: 'Sum',
          }),
        ],
      }),
    );

    // Lambda metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: 'TreeCare-PhotoAnalysis-Prod',
            },
            statistic: 'Average',
          }),
        ],
      }),
    );

    // Error rate alerts
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: 'TreeCare-PhotoAnalysis-Prod',
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
    });

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic');
    errorAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));
  }
}
```

### Application Monitoring

```javascript
// backend/src/utils/monitoring.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

class ApplicationMonitoring {
  static async trackApiCall(functionName, duration, success) {
    const params = {
      Namespace: 'TreeCareApp/API',
      MetricData: [
        {
          MetricName: 'Duration',
          Dimensions: [
            {
              Name: 'FunctionName',
              Value: functionName
            }
          ],
          Value: duration,
          Unit: 'Milliseconds',
          Timestamp: new Date()
        },
        {
          MetricName: success ? 'Success' : 'Error',
          Dimensions: [
            {
              Name: 'FunctionName', 
              Value: functionName
            }
          ],
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
  }

  static async trackUserEngagement(userId, action, metadata = {}) {
    const params = {
      Namespace: 'TreeCareApp/Engagement',
      MetricData: [
        {
          MetricName: action,
          Dimensions: [
            {
              Name: 'Action',
              Value: action
            }
          ],
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    };

    await cloudwatch.putMetricData(params).promise();
  }
}

module.exports = ApplicationMonitoring;
```

## Health Checks & Testing

### Production Health Checks

```javascript
// scripts/health-check.js
const axios = require('axios');

const API_BASE_URL = 'https://api.treecare.app/v1';

async function healthCheck() {
  const checks = [
    {
      name: 'API Gateway',
      url: `${API_BASE_URL}/health`,
      timeout: 5000
    },
    {
      name: 'Photo Analysis',
      url: `${API_BASE_URL}/analyze/health`,
      timeout: 10000
    },
    {
      name: 'Database',
      url: `${API_BASE_URL}/db/health`,
      timeout: 3000
    }
  ];

  const results = [];

  for (const check of checks) {
    try {
      const start = Date.now();
      const response = await axios.get(check.url, {
        timeout: check.timeout
      });
      const duration = Date.now() - start;

      results.push({
        name: check.name,
        status: 'healthy',
        duration: duration,
        statusCode: response.status
      });
    } catch (error) {
      results.push({
        name: check.name,
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  return results;
}

// Run health check
healthCheck().then(results => {
  console.log('Health Check Results:');
  results.forEach(result => {
    const status = result.status === 'healthy' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
    if (result.duration) {
      console.log(`   Response time: ${result.duration}ms`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const hasUnhealthy = results.some(r => r.status === 'unhealthy');
  process.exit(hasUnhealthy ? 1 : 0);
});
```

### Load Testing

```javascript
// scripts/load-test.js
const axios = require('axios');

async function loadTest() {
  const API_BASE_URL = 'https://api.treecare.app/v1';
  const CONCURRENT_REQUESTS = 50;
  const DURATION_SECONDS = 60;

  console.log(`Running load test: ${CONCURRENT_REQUESTS} concurrent requests for ${DURATION_SECONDS} seconds`);

  const startTime = Date.now();
  const endTime = startTime + (DURATION_SECONDS * 1000);
  
  let requestCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const makeRequest = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 10000
      });
      successCount++;
    } catch (error) {
      errorCount++;
    }
    requestCount++;
  };

  // Start concurrent requests
  const workers = Array(CONCURRENT_REQUESTS).fill().map(async () => {
    while (Date.now() < endTime) {
      await makeRequest();
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
  });

  await Promise.all(workers);

  console.log('Load Test Results:');
  console.log(`Total Requests: ${requestCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Success Rate: ${(successCount / requestCount * 100).toFixed(2)}%`);
  console.log(`Requests/Second: ${(requestCount / DURATION_SECONDS).toFixed(2)}`);
}

loadTest().catch(console.error);
```

## Backup & Disaster Recovery

### Database Backups

```bash
#!/bin/bash
# scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="treecare-backups-prod"

echo "Starting database backup: $TIMESTAMP"

# Export DynamoDB tables
aws dynamodb create-backup \
  --table-name TreeCare-Users-prod \
  --backup-name "users-backup-$TIMESTAMP"

aws dynamodb create-backup \
  --table-name TreeCare-Trees-prod \
  --backup-name "trees-backup-$TIMESTAMP"

# Schedule automated backups
aws events put-rule \
  --name TreeCare-DailyBackup \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED

echo "Database backup complete: $TIMESTAMP"
```

### S3 Cross-Region Replication

```typescript
// Enable cross-region replication for photos
const replicationBucket = new s3.Bucket(this, 'PhotosReplicationBucket', {
  bucketName: 'treecare-photos-backup',
  region: 'us-west-2', // Different region
});

photosBucket.addCorsRule({
  allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
  allowedOrigins: ['*'],
  allowedHeaders: ['*'],
});
```

This deployment guide provides a comprehensive roadmap for taking the Tree Care App from development to production with enterprise-grade reliability, monitoring, and disaster recovery capabilities.
