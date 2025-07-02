# GitHub Actions Workflows

This directory contains the CI/CD pipelines for the Tree Care App.

## Workflows

### CI - Continuous Integration (`ci.yml`)

Triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

Jobs:
1. **Lint**: ESLint and TypeScript checking
2. **Test Backend**: Jest tests with AWS SDK mocks
3. **Test Mobile**: React Native tests
4. **Test Infrastructure**: CDK synthesis and tests
5. **Security Scan**: npm audit and Trivy scanning
6. **Build Validation**: Validates builds succeed
7. **Matrix Testing**: Tests on multiple Node versions and OS

### CD - Continuous Deployment (`cd.yml`)

Triggered on:
- Push to `main` (deploys to staging)
- Push to `develop` (deploys to dev)
- Manual workflow dispatch (choose environment)

Jobs:
1. **Deploy Infrastructure**: AWS CDK deployment
2. **Deploy Backend**: Serverless Framework deployment
3. **Deploy AI Models**: SageMaker deployment (staging/prod only)
4. **Smoke Tests**: Health check validation
5. **Production Approval**: Manual gate for prod deployments
6. **CDN Invalidation**: CloudFront cache clearing

## Required Secrets

Configure these in GitHub repository settings:

- `AWS_ACCESS_KEY_ID`: AWS credentials for deployment
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `API_ENDPOINT`: API Gateway endpoint for smoke tests
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront distribution ID

## Environment Protection Rules

- **dev**: Auto-deploy from develop branch
- **staging**: Auto-deploy from main branch
- **production**: Requires manual approval
- **production-approval**: Environment for prod gate

## Local Testing

Test workflows locally with [act](https://github.com/nektos/act):

```bash
# Test CI workflow
act -j lint

# Test with secrets
act -j deploy-backend -s AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
```