#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('environment') || 'dev';

// Create stack with environment-specific name
new InfrastructureStack(app, `TreeCareInfrastructure-${environment}`, {
  stackName: `TreeCareInfrastructure-${environment}`,
  description: `Tree Care App Infrastructure for ${environment} environment`,
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2'
  },
});