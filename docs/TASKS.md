# Tree Care App - TDD Development Tasks

## Progress Summary
- **Started**: July 1, 2025
- **Current Phase**: 1.1 Development Environment Setup
- **Repository**: https://github.com/ryandarton/tree-care-app
- **Completed Tasks**: 2/5 in Phase 1.1

## Key Findings & Decisions
1. **AWS Configuration**: Using profile `ryan-laptop-goal-app` in region `us-east-2`
2. **Dependency Management**: Using `--legacy-peer-deps` for all npm installs due to React version conflicts
3. **Package Fixes**:
   - `react-native-image-editor` → `@react-native-community/image-editor@^2.3.0`
   - `react-native-image-resizer` → version `^1.4.5` (not 3.0.0)
4. **Project Structure**: Created minimal `backend/` and `ai-models/` directories for npm workspaces

## Overview
This document outlines the complete Test-Driven Development (TDD) approach for building the Tree Care App from concept to deployment. Each task follows the Red-Green-Refactor cycle with frequent commits.

## TDD Workflow for Every Task
```
1. Write Test (Red) → 2. Run Test (Fail) → 3. Write Code → 4. Run Test (Pass) → 5. Refactor → 6. Review Docs → 7. Commit
```

## Git Branching Strategy

### Branch Structure
```
main                     # Stable, deployable code only
├── feature/testing-framework      # Phase 1.2: Jest, React Native Testing, Detox
├── feature/aws-infrastructure     # Phase 1.3: CDK, DynamoDB, S3, Cognito
├── feature/backend-foundation     # Phase 1.4: Lambda, API Gateway, health checks
├── feature/ci-cd-pipeline        # Phase 1.5: GitHub Actions workflows
├── feature/mobile-foundation     # Phase 2: Redux, Navigation, UI Components
├── feature/auth-flow            # Phase 2.4: Authentication screens and flow
├── feature/ai-integration       # Phase 3: Photo analysis, ML models
└── feature/monetization         # Phase 4: Stripe, ads, notifications
```

### Branching Workflow
1. **Create feature branch**: `git checkout -b feature/branch-name`
2. **Work in TDD cycles**: Test → Code → Commit (every 2-4 hours)
3. **Push regularly**: Every 3-5 commits to backup work
4. **PR when complete**: After completing major component/phase section
5. **Merge to main**: Only after PR approval and all tests passing
6. **Delete feature branch**: After successful merge

### Merge Strategy
- **Phase sections (1.1, 1.2, etc.)**: Feature branch → PR → Squash merge to main
- **Major phases (Phase 1, 2, etc.)**: Create release tag after completion
- **Hotfixes**: Direct to main with immediate PR for review

### Branch Protection Rules
- **main**: Requires PR approval, all tests passing, no direct pushes
- **feature/***: Can push directly, regular backup pushes encouraged

## Documentation Review Process
Before each commit:
- [ ] Review relevant .md files in /docs
- [ ] Update documentation with any structural changes
- [ ] Document important findings or decisions
- [ ] Ensure README reflects current state
- [ ] Update CLAUDE.md if development workflow changes

## Commit Guidelines
- Commit after each test passes
- Commit message format: `test: [component] add test for [feature]` or `feat: [component] implement [feature]`
- Push to feature branch every 3-5 commits
- PR after each major component completion

---

## Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Development Environment Setup
**Branch**: `main` (foundation setup)
- [x] **TEST**: Write test for AWS CLI configuration validation
- [x] Configure AWS CLI with profile `ryan-laptop-goal-app`
- [x] **DOCS**: Review and update documentation
- [x] **COMMIT**: "test: add AWS CLI configuration validation test"
- [x] **TEST**: Write test for project dependency installation
- [x] Fix npm dependency conflicts with legacy peer deps
- [x] **DOCS**: Updated package.json with legacy-peer-deps, fixed package versions
- [x] **COMMIT**: "fix: resolve npm dependency conflicts with legacy peer deps"
- [ ] **TEST**: Write test for git hooks setup
- [ ] Setup pre-commit hooks for linting and type checking
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "chore: add pre-commit hooks"

### 1.2 Testing Framework Setup
**Branch**: `feature/testing-framework`
- [ ] **BRANCH**: Create feature branch from main
- [ ] **PR**: Submit PR to main when complete
- [ ] **TEST**: Write meta-test for Jest configuration
- [ ] Configure Jest for backend with AWS SDK mocks
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "test: setup Jest for backend testing"
- [ ] **TEST**: Write meta-test for React Native testing setup
- [ ] Configure Jest and React Native Testing Library for mobile
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "test: setup mobile testing framework"
- [ ] **TEST**: Write test for E2E framework initialization
- [ ] Setup Detox for E2E testing
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "test: configure Detox E2E framework"

### 1.3 AWS Infrastructure as Code
**Branch**: `feature/aws-infrastructure`
- [ ] **BRANCH**: Create feature branch from main
- [ ] **PR**: Submit PR to main when complete
- [ ] **TEST**: Write CDK snapshot tests for stack configuration
- [ ] Initialize AWS CDK project in infrastructure/
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "feat: initialize AWS CDK project"
- [ ] **TEST**: Write tests for DynamoDB table schemas
- [ ] Create DynamoDB tables (users, trees, photos, subscriptions)
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "feat: add DynamoDB table definitions"
- [ ] **TEST**: Write tests for S3 bucket policies
- [ ] Configure S3 buckets for photo storage with lifecycle rules
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "feat: configure S3 photo storage"
- [ ] **TEST**: Write tests for Cognito user pool configuration
- [ ] Setup Cognito user pools with MFA
- [ ] **DOCS**: Review and update documentation
- [ ] **COMMIT**: "feat: add Cognito authentication"

### 1.4 Backend API Foundation
**Branch**: `feature/backend-foundation`
- [ ] **BRANCH**: Create feature branch from main
- [ ] **PR**: Submit PR to main when complete
- [ ] **TEST**: Write tests for Lambda function handlers
- [ ] Create Lambda function boilerplate with error handling
- [ ] **COMMIT**: "feat: add Lambda function template"
- [ ] **TEST**: Write tests for API Gateway routes
- [ ] Configure API Gateway with CORS and rate limiting
- [ ] **COMMIT**: "feat: setup API Gateway configuration"
- [ ] **TEST**: Write integration tests for health check endpoint
- [ ] Implement /health endpoint
- [ ] **COMMIT**: "feat: add health check endpoint"

### 1.5 CI/CD Pipeline
**Branch**: `feature/ci-cd-pipeline`
- [ ] **BRANCH**: Create feature branch from main
- [ ] **PR**: Submit PR to main when complete
- [ ] **TEST**: Write tests for GitHub Actions workflow
- [ ] Create CI workflow for testing on push
- [ ] **COMMIT**: "ci: add testing workflow"
- [ ] **TEST**: Write tests for deployment validation
- [ ] Create CD workflow for AWS deployment
- [ ] **COMMIT**: "ci: add deployment workflow"

### Phase 1 Completion
- [ ] **MERGE**: All feature branches merged to main
- [ ] **TAG**: Create release tag `v1.0.0-phase1`
- [ ] **DEPLOY**: Deploy to development environment
- [ ] **DOCS**: Update Progress Summary in TASKS.md

---

## Phase 2: Mobile App Foundation (Week 3-4)

### 2.1 Redux Store Setup
- [ ] **TEST**: Write tests for auth slice reducers
- [ ] Implement auth slice (login, logout, token refresh)
- [ ] **COMMIT**: "feat: add Redux auth slice"
- [ ] **TEST**: Write tests for trees slice
- [ ] Implement trees slice (CRUD operations)
- [ ] **COMMIT**: "feat: add trees Redux slice"
- [ ] **TEST**: Write tests for Redux persistence
- [ ] Configure redux-persist for offline support
- [ ] **COMMIT**: "feat: add Redux persistence"

### 2.2 Navigation Structure
- [ ] **TEST**: Write tests for navigation flow
- [ ] Setup React Navigation with tab and stack navigators
- [ ] **COMMIT**: "feat: implement navigation structure"
- [ ] **TEST**: Write tests for auth navigation guard
- [ ] Implement authenticated route protection
- [ ] **COMMIT**: "feat: add auth navigation guards"

### 2.3 Core UI Components
- [ ] **TEST**: Write component tests for Button
- [ ] Create reusable Button component with variants
- [ ] **COMMIT**: "feat: add Button component"
- [ ] **TEST**: Write tests for Input components
- [ ] Create TextInput, DatePicker, and Select components
- [ ] **COMMIT**: "feat: add form input components"
- [ ] **TEST**: Write tests for Card component
- [ ] Create Card component for tree display
- [ ] **COMMIT**: "feat: add Card component"

### 2.4 Authentication Flow
- [ ] **TEST**: Write tests for login screen
- [ ] Implement login screen with form validation
- [ ] **COMMIT**: "feat: add login screen"
- [ ] **TEST**: Write tests for registration flow
- [ ] Implement multi-step registration
- [ ] **COMMIT**: "feat: add registration flow"
- [ ] **TEST**: Write integration tests for Cognito auth
- [ ] Connect auth screens to AWS Cognito
- [ ] **COMMIT**: "feat: integrate Cognito authentication"

### 2.5 Tree Management Screens
- [ ] **TEST**: Write tests for tree list screen
- [ ] Implement tree list with empty state
- [ ] **COMMIT**: "feat: add tree list screen"
- [ ] **TEST**: Write tests for add tree flow
- [ ] Create add tree wizard (photo, species, location)
- [ ] **COMMIT**: "feat: add tree creation flow"
- [ ] **TEST**: Write tests for tree detail view
- [ ] Implement tree detail screen with tabs
- [ ] **COMMIT**: "feat: add tree detail screen"

---

## Phase 3: AI Integration & Photo Analysis (Week 5-7)

### 3.1 Photo Capture & Upload
- [ ] **TEST**: Write tests for camera integration
- [ ] Implement camera capture with Expo Camera
- [ ] **COMMIT**: "feat: add camera capture"
- [ ] **TEST**: Write tests for image picker
- [ ] Add gallery selection option
- [ ] **COMMIT**: "feat: add image picker"
- [ ] **TEST**: Write tests for photo upload to S3
- [ ] Implement secure S3 upload with presigned URLs
- [ ] **COMMIT**: "feat: add S3 photo upload"

### 3.2 AI Model Deployment
- [ ] **TEST**: Write tests for SageMaker endpoint health
- [ ] Deploy species classifier to SageMaker
- [ ] **COMMIT**: "feat: deploy species classifier"
- [ ] **TEST**: Write tests for structure analyzer endpoint
- [ ] Deploy tree structure analyzer model
- [ ] **COMMIT**: "feat: deploy structure analyzer"
- [ ] **TEST**: Write tests for model response parsing
- [ ] Create model response handlers
- [ ] **COMMIT**: "feat: add model response handlers"

### 3.3 Analysis Pipeline
- [ ] **TEST**: Write tests for analysis Lambda function
- [ ] Implement photo analysis orchestration Lambda
- [ ] **COMMIT**: "feat: add analysis Lambda"
- [ ] **TEST**: Write integration tests for analysis flow
- [ ] Connect mobile app to analysis endpoint
- [ ] **COMMIT**: "feat: integrate analysis pipeline"
- [ ] **TEST**: Write tests for analysis result storage
- [ ] Store analysis results in DynamoDB
- [ ] **COMMIT**: "feat: add analysis persistence"

### 3.4 Visual Overlay System
- [ ] **TEST**: Write tests for SVG overlay generation
- [ ] Create pruning cut overlay component
- [ ] **COMMIT**: "feat: add pruning overlay"
- [ ] **TEST**: Write tests for overlay interactions
- [ ] Implement touch interactions for overlays
- [ ] **COMMIT**: "feat: add overlay interactions"
- [ ] **TEST**: Write tests for progress visualization
- [ ] Create before/after comparison view
- [ ] **COMMIT**: "feat: add progress comparison"

---

## Phase 4: Features & Monetization (Week 8-9)

### 4.1 Subscription Management
- [ ] **TEST**: Write tests for Stripe webhook handler
- [ ] Implement Stripe webhook Lambda
- [ ] **COMMIT**: "feat: add Stripe webhooks"
- [ ] **TEST**: Write tests for subscription tiers
- [ ] Implement tier management logic
- [ ] **COMMIT**: "feat: add subscription tiers"
- [ ] **TEST**: Write tests for payment flow
- [ ] Create subscription purchase screen
- [ ] **COMMIT**: "feat: add payment flow"

### 4.2 Notification System
- [ ] **TEST**: Write tests for notification scheduler
- [ ] Implement EventBridge scheduling rules
- [ ] **COMMIT**: "feat: add notification scheduler"
- [ ] **TEST**: Write tests for push notifications
- [ ] Setup Expo push notifications
- [ ] **COMMIT**: "feat: add push notifications"
- [ ] **TEST**: Write tests for notification preferences
- [ ] Create notification settings screen
- [ ] **COMMIT**: "feat: add notification settings"

### 4.3 Ad Integration
- [ ] **TEST**: Write tests for ad display logic
- [ ] Implement Google AdMob integration
- [ ] **COMMIT**: "feat: add AdMob integration"
- [ ] **TEST**: Write tests for ad-free logic
- [ ] Implement ad removal for paid tiers
- [ ] **COMMIT**: "feat: add ad-free experience"

### 4.4 Community Features
- [ ] **TEST**: Write tests for knowledge base API
- [ ] Create species knowledge endpoints
- [ ] **COMMIT**: "feat: add knowledge base API"
- [ ] **TEST**: Write tests for tips display
- [ ] Implement community tips screen
- [ ] **COMMIT**: "feat: add community tips"

---

## Phase 5: Testing, UAT & Deployment (Week 10-12)

### 5.1 Integration Testing
- [ ] **TEST**: Write E2E test for complete user journey
- [ ] Test: Register → Add Tree → Analyze → View Results
- [ ] **COMMIT**: "test: add user journey E2E"
- [ ] **TEST**: Write E2E test for subscription flow
- [ ] Test: Free tier limits → Upgrade → Verify access
- [ ] **COMMIT**: "test: add subscription E2E"
- [ ] **TEST**: Write performance tests
- [ ] Test API response times and app performance
- [ ] **COMMIT**: "test: add performance benchmarks"

### 5.2 Security Testing
- [ ] **TEST**: Write security tests for auth flow
- [ ] Test JWT validation and refresh
- [ ] **COMMIT**: "test: add auth security tests"
- [ ] **TEST**: Write tests for data encryption
- [ ] Verify S3 encryption and API security
- [ ] **COMMIT**: "test: add encryption tests"
- [ ] **TEST**: Write penetration test scenarios
- [ ] Test common vulnerabilities (OWASP)
- [ ] **COMMIT**: "test: add security test suite"

### 5.3 User Acceptance Testing
- [ ] **UAT Scenario 1**: New user onboarding
  - Register account
  - Add first tree with photo
  - Receive AI analysis
  - Set pruning reminder
- [ ] **UAT Scenario 2**: Subscription upgrade
  - Hit free tier limit
  - View pricing options
  - Complete payment
  - Access premium features
- [ ] **UAT Scenario 3**: Tree progress tracking
  - Take monthly photos
  - Compare progress
  - Adjust pruning plan
  - Share achievements
- [ ] **UAT Scenario 4**: Multi-tree management
  - Add 5+ trees
  - Filter and search
  - Bulk operations
  - Export data

### 5.4 Performance Optimization
- [ ] **TEST**: Write tests for image optimization
- [ ] Implement image compression and caching
- [ ] **COMMIT**: "perf: add image optimization"
- [ ] **TEST**: Write tests for offline mode
- [ ] Implement offline queue for analysis
- [ ] **COMMIT**: "feat: add offline support"
- [ ] **TEST**: Write tests for bundle size
- [ ] Optimize bundle with code splitting
- [ ] **COMMIT**: "perf: reduce bundle size"

### 5.5 Deployment Preparation
- [ ] **TEST**: Write tests for build process
- [ ] Create production build scripts
- [ ] **COMMIT**: "build: add production scripts"
- [ ] **TEST**: Write smoke tests for production
- [ ] Deploy to staging environment
- [ ] **COMMIT**: "deploy: staging environment"
- [ ] **TEST**: Write app store validation tests
- [ ] Prepare app store assets and metadata
- [ ] **COMMIT**: "docs: add app store assets"

### 5.6 Launch Checklist
- [ ] Production AWS resources provisioned
- [ ] SSL certificates configured
- [ ] Monitoring dashboards created
- [ ] Error tracking (Sentry) integrated
- [ ] Analytics (Mixpanel) configured
- [ ] App Store submission completed
- [ ] Google Play submission completed
- [ ] Documentation finalized
- [ ] Support channels established

---

## Acceptance Criteria

### Technical Criteria
- [ ] 80%+ test coverage across all packages
- [ ] All E2E tests passing
- [ ] API response time < 500ms (p95)
- [ ] App launch time < 3 seconds
- [ ] No critical security vulnerabilities
- [ ] Accessibility score > 90

### Business Criteria
- [ ] User can complete full journey in < 5 minutes
- [ ] AI analysis accuracy > 90%
- [ ] Payment flow success rate > 95%
- [ ] App store rating potential > 4.5 stars
- [ ] Supports 10,000+ concurrent users

### Quality Gates
- [ ] Code review approved by 2 developers
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] UAT sign-off received
- [ ] Legal/compliance review completed

---

## Testing Metrics Dashboard

```
┌─────────────────────────────────────────────────────┐
│  Test Coverage Goals                                │
├─────────────────────────────────────────────────────┤
│  Backend:    [████████░░] 80% target               │
│  Mobile:     [████████░░] 80% target               │
│  E2E:        [██████████] 100% critical paths      │
│  Security:   [██████████] 100% auth flows          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Test Types Distribution                            │
├─────────────────────────────────────────────────────┤
│  Unit Tests:        ~500 tests                     │
│  Integration:       ~150 tests                     │
│  E2E Tests:         ~50 scenarios                  │
│  Performance:       ~20 benchmarks                 │
│  Security:          ~30 scenarios                  │
└─────────────────────────────────────────────────────┘
```

---

## Notes
- Each task should result in a commit within 2-4 hours of starting
- Review and update documentation before EVERY commit
- Run `npm run lint` and `npm run type-check` before every commit
- **Branching**: Follow the documented Git strategy above
- **PRs**: Required for all feature branch merges to main
- **Tagging**: Create release tags after each phase completion
- **Protection**: Set up branch protection rules on main
- Keep Progress Summary and Key Findings sections updated

## Next Steps
Based on current progress, next recommended action:
1. Complete remaining task in Phase 1.1 (git hooks setup) in `main`
2. Create `feature/testing-framework` branch for Phase 1.2
3. Set up GitHub branch protection rules for `main`