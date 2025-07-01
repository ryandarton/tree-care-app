#!/usr/bin/env node

/**
 * Test script to validate project dependencies can be installed
 * This ensures npm workspaces are properly configured and all
 * packages can be installed without conflicts
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

const WORKSPACES = ['mobile', 'backend'];

async function validateDependencies() {
  console.log('🧪 Testing project dependency setup...\n');
  
  const tests = {
    rootPackageValid: false,
    workspacesConfigured: false,
    mobilePackageValid: false,
    backendPackageValid: false,
    dependenciesResolvable: false,
    installScriptExists: false
  };

  try {
    // Test 1: Check root package.json
    console.log('1. Validating root package.json...');
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      
      if (packageJson.name && packageJson.workspaces) {
        tests.rootPackageValid = true;
        console.log('   ✅ Root package.json is valid');
        console.log(`   Workspaces: ${packageJson.workspaces.join(', ')}`);
      } else {
        console.log('   ❌ Root package.json missing required fields');
      }
    } catch (error) {
      console.log('   ❌ Failed to read root package.json:', error.message);
    }

    // Test 2: Check workspace configuration
    console.log('\n2. Checking workspace packages...');
    tests.workspacesConfigured = true;
    
    for (const workspace of WORKSPACES) {
      try {
        const wsPackagePath = path.join(__dirname, '..', workspace, 'package.json');
        const wsPackage = JSON.parse(await fs.readFile(wsPackagePath, 'utf8'));
        
        if (wsPackage.name) {
          console.log(`   ✅ ${workspace}/package.json found: ${wsPackage.name}`);
          if (workspace === 'mobile') tests.mobilePackageValid = true;
          if (workspace === 'backend') tests.backendPackageValid = true;
        } else {
          console.log(`   ❌ ${workspace}/package.json missing name field`);
          tests.workspacesConfigured = false;
        }
      } catch (error) {
        console.log(`   ❌ Failed to read ${workspace}/package.json:`, error.message);
        tests.workspacesConfigured = false;
      }
    }

    // Test 3: Check install-all script
    console.log('\n3. Checking install scripts...');
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      
      if (packageJson.scripts && packageJson.scripts['install-all']) {
        tests.installScriptExists = true;
        console.log('   ✅ install-all script found');
        console.log(`   Command: ${packageJson.scripts['install-all']}`);
      } else {
        console.log('   ❌ install-all script not found in package.json');
      }
    } catch (error) {
      console.log('   ❌ Failed to check scripts:', error.message);
    }

    // Test 4: Test dependency resolution (dry run)
    console.log('\n4. Testing dependency resolution...');
    console.log('   Running npm install --dry-run to check for conflicts...');
    try {
      // First check if node_modules exists and clean it
      const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
      try {
        await fs.access(nodeModulesPath);
        console.log('   Cleaning existing node_modules...');
        await execAsync('rm -rf node_modules mobile/node_modules backend/node_modules');
      } catch {
        // node_modules doesn't exist, that's fine
      }

      // Try install with legacy peer deps first
      const { stdout, stderr } = await execAsync(
        'npm install --legacy-peer-deps --dry-run',
        { cwd: path.join(__dirname, '..') }
      );
      
      if (!stderr.includes('ERESOLVE')) {
        tests.dependenciesResolvable = true;
        console.log('   ✅ Dependencies can be resolved with --legacy-peer-deps');
      } else {
        console.log('   ❌ Dependency conflicts detected');
        console.log('   Error:', stderr.split('\n')[0]);
      }
    } catch (error) {
      console.log('   ❌ Dependency resolution failed:', error.message.split('\n')[0]);
      
      // Try to identify the specific conflict
      if (error.message.includes('react')) {
        console.log('\n   Detected React version conflict. Checking versions...');
        try {
          const mobilePackage = JSON.parse(
            await fs.readFile(path.join(__dirname, '..', 'mobile', 'package.json'), 'utf8')
          );
          console.log(`   Mobile React version: ${mobilePackage.dependencies.react}`);
          console.log(`   React Native version: ${mobilePackage.dependencies['react-native']}`);
        } catch {}
      }
    }

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
    console.log('\n❌ Dependency validation FAILED');
    console.log('\nRecommended fixes:');
    
    if (!tests.dependenciesResolvable) {
      console.log('1. Update package.json scripts to use --legacy-peer-deps:');
      console.log('   "install-all": "npm install --legacy-peer-deps && cd mobile && npm install --legacy-peer-deps && cd ../backend && npm install --legacy-peer-deps"');
      console.log('\n2. Or fix the specific dependency conflicts identified above');
    }
    
    if (!tests.workspacesConfigured) {
      console.log('3. Ensure all workspace directories have valid package.json files');
    }
    
    process.exit(1);
  } else {
    console.log('\n✅ All dependency tests PASSED! 🎉');
    console.log('\nYou can now run: npm run install-all');
    process.exit(0);
  }
}

// Run the validation
validateDependencies().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});