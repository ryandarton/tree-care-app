# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tree Care App - An AI-powered mobile application that helps homeowners train young trees into optimal canopy shapes through photo analysis, personalized pruning guidance, and smart scheduling.

## Architecture

### Tech Stack
- **Mobile**: React Native 0.72.4 + Expo SDK 49 + TypeScript
- **Backend**: AWS Lambda (Node.js) with Serverless Framework
- **Database**: DynamoDB (user data) + DocumentDB (species data)
- **AI/ML**: Custom TensorFlow models on AWS SageMaker + Bedrock
- **Storage**: S3 + CloudFront CDN
- **Auth**: AWS Cognito
- **Payments**: Stripe

### Project Structure
```
tree-care-app/          # Monorepo with npm workspaces
├── mobile/             # React Native app
├── backend/            # Serverless API
├── ai-models/          # Python ML models
├── infrastructure/     # AWS CDK/CloudFormation
└── docs/              # Documentation
```

## Essential Development Commands

### Quick Start
```bash
# Install all dependencies
npm run install-all

# Run mobile and backend together
npm run dev

# Run separately
npm run dev:mobile   # Expo dev server
npm run dev:backend  # Serverless offline
```

### Mobile Development
```bash
cd mobile
npm start            # Start Expo
npm run ios         # iOS simulator
npm run android     # Android emulator
npm test            # Run tests
npm run lint        # ESLint
npm run type-check  # TypeScript check
```

### Backend Development
```bash
cd backend
npm run dev              # Local serverless
npm run deploy:dev       # Deploy to AWS dev
npm run test             # Run tests
npm run invoke:local     # Test Lambda locally
npm run logs            # View CloudWatch logs
```

### Code Quality (from root)
```bash
npm run lint        # Lint entire project
npm run format      # Prettier format
npm test           # Run all tests
```

## Key Implementation Details

### Mobile App State Management
- Uses Redux Toolkit with slices for:
  - User authentication (authSlice)
  - Tree profiles (treesSlice)
  - Photo analysis (analysisSlice)
  - Notifications (notificationsSlice)

### Backend API Structure
- Lambda functions organized by domain:
  - `/auth/*` - User authentication
  - `/trees/*` - Tree CRUD operations
  - `/analysis/*` - AI analysis endpoints
  - `/recommendations/*` - Pruning guidance
  - `/subscriptions/*` - Stripe integration

### AI Models
Four custom models process tree photos:
1. Species Classifier - Identifies tree species
2. Structure Analyzer - Maps branches and canopy
3. Health Assessor - Detects diseases/stress
4. Shape Progress Tracker - Monitors pruning progress

### Environment Variables
- Mobile: Uses Expo's environment variable system
- Backend: Serverless environment variables per stage
- Both require AWS credentials for deployment

## Development Workflow

1. Always run `npm run install-all` after pulling changes
2. Use `npm run dev` to start both mobile and backend
3. Test Lambda functions locally before deploying
4. Run linting before committing: `npm run lint`
5. Deploy to dev first: `npm run deploy:dev`

## Business Logic

### Subscription Tiers
- **Free**: 3 trees max, ads enabled
- **Hobbyist** ($4.99/mo): 10 trees, no ads
- **Arborist** ($14.99/mo): Unlimited trees
- **Professional** ($29.99/mo): Multi-property support

### Core Features
- Photo capture and analysis
- Species identification
- Pruning recommendations with visual overlays
- Progress tracking
- Smart notification scheduling
- Community knowledge base

## Testing Strategy

- Mobile: Jest + React Native Testing Library + Detox (E2E)
- Backend: Jest with AWS SDK mocks
- AI Models: Python pytest with TensorFlow test utils
- Integration: Postman collections for API testing