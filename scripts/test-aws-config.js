#!/usr/bin/env node

/**
 * Test script to validate AWS CLI configuration
 * This ensures the AWS profile 'ryan-laptop-goal-app' is properly configured
 * before we start building infrastructure
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const AWS_PROFILE = 'ryan-laptop-goal-app';
const REQUIRED_REGION = 'us-east-1'; // Most services available here

async function validateAWSConfig() {
  console.log('🧪 Testing AWS CLI configuration...\n');
  
  const tests = {
    profileExists: false,
    credentialsValid: false,
    regionConfigured: false,
    servicesAccessible: false
  };

  try {
    // Test 1: Check if profile exists
    console.log('1. Checking if AWS profile exists...');
    try {
      const { stdout } = await execAsync('aws configure list-profiles');
      if (stdout.includes(AWS_PROFILE)) {
        tests.profileExists = true;
        console.log(`   ✅ Profile '${AWS_PROFILE}' found`);
      } else {
        console.log(`   ❌ Profile '${AWS_PROFILE}' not found`);
        console.log('   Available profiles:', stdout.trim().split('\n').join(', '));
      }
    } catch (error) {
      console.log('   ❌ Failed to list profiles:', error.message);
    }

    // Test 2: Check if credentials are valid
    console.log('\n2. Validating AWS credentials...');
    try {
      const { stdout } = await execAsync(
        `aws sts get-caller-identity --profile ${AWS_PROFILE} --output json`
      );
      const identity = JSON.parse(stdout);
      tests.credentialsValid = true;
      console.log(`   ✅ Credentials valid for account: ${identity.Account}`);
      console.log(`   User ARN: ${identity.Arn}`);
    } catch (error) {
      console.log('   ❌ Invalid credentials:', error.message);
    }

    // Test 3: Check region configuration
    console.log('\n3. Checking region configuration...');
    try {
      const { stdout } = await execAsync(
        `aws configure get region --profile ${AWS_PROFILE}`
      );
      const region = stdout.trim();
      if (region) {
        tests.regionConfigured = true;
        console.log(`   ✅ Region configured: ${region}`);
        if (region !== REQUIRED_REGION) {
          console.log(`   ⚠️  Warning: Expected region ${REQUIRED_REGION}, found ${region}`);
        }
      } else {
        console.log('   ❌ No region configured');
      }
    } catch (error) {
      console.log('   ❌ Failed to get region:', error.message);
    }

    // Test 4: Check access to required AWS services
    console.log('\n4. Testing access to required AWS services...');
    const servicesToTest = [
      { name: 'S3', command: 'aws s3api list-buckets --profile ' + AWS_PROFILE + ' --query "Buckets[0]"' },
      { name: 'DynamoDB', command: 'aws dynamodb list-tables --profile ' + AWS_PROFILE + ' --max-items 1' },
      { name: 'Lambda', command: 'aws lambda list-functions --profile ' + AWS_PROFILE + ' --max-items 1' },
      { name: 'Cognito', command: 'aws cognito-idp list-user-pools --profile ' + AWS_PROFILE + ' --max-results 1' }
    ];

    let allServicesAccessible = true;
    for (const service of servicesToTest) {
      try {
        await execAsync(service.command);
        console.log(`   ✅ ${service.name} accessible`);
      } catch (error) {
        allServicesAccessible = false;
        const errorMsg = error.stderr || error.message;
        console.log(`   ❌ ${service.name} not accessible:`, errorMsg.split('\n')[0]);
        // For S3, we might just not have any buckets yet, which is OK
        if (service.name === 'S3' && errorMsg.includes('NoSuchBucket')) {
          console.log(`      (This might be OK if no buckets exist yet)`);
        }
      }
    }
    tests.servicesAccessible = allServicesAccessible;

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY:');
  console.log('='.repeat(50));
  
  const allTestsPassed = Object.values(tests).every(test => test === true);
  
  Object.entries(tests).forEach(([testName, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
  });

  if (!allTestsPassed) {
    console.log('\n❌ AWS configuration validation FAILED');
    console.log('\nTo fix:');
    if (!tests.profileExists) {
      console.log(`1. Create the AWS profile: aws configure --profile ${AWS_PROFILE}`);
    }
    if (!tests.credentialsValid) {
      console.log('2. Ensure your AWS credentials are valid and not expired');
    }
    if (!tests.regionConfigured) {
      console.log(`3. Set the region: aws configure set region ${REQUIRED_REGION} --profile ${AWS_PROFILE}`);
    }
    if (!tests.servicesAccessible) {
      console.log('4. Check IAM permissions for the required services');
    }
    process.exit(1);
  } else {
    console.log('\n✅ All AWS configuration tests PASSED! 🎉');
    process.exit(0);
  }
}

// Run the validation
validateAWSConfig().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});