#!/usr/bin/env node
/**
 * Test script to validate git hooks setup
 * This follows TDD principles - write test first, then implement
 */

const fs = require('fs');
const path = require('path');

function testGitHooksSetup() {
  console.log('🧪 Testing git hooks setup...');
  
  const hooksDir = path.join(process.cwd(), '.git/hooks');
  const preCommitHook = path.join(hooksDir, 'pre-commit');
  
  // Test 1: Pre-commit hook file exists
  if (!fs.existsSync(preCommitHook)) {
    console.error('❌ FAIL: pre-commit hook file does not exist');
    process.exit(1);
  }
  console.log('✅ PASS: pre-commit hook file exists');
  
  // Test 2: Pre-commit hook is executable
  const stats = fs.statSync(preCommitHook);
  if (!(stats.mode & parseInt('755', 8))) {
    console.error('❌ FAIL: pre-commit hook is not executable');
    process.exit(1);
  }
  console.log('✅ PASS: pre-commit hook is executable');
  
  // Test 3: Pre-commit hook contains lint and type-check commands
  const hookContent = fs.readFileSync(preCommitHook, 'utf8');
  if (!hookContent.includes('npm run lint')) {
    console.error('❌ FAIL: pre-commit hook does not include lint command');
    process.exit(1);
  }
  console.log('✅ PASS: pre-commit hook includes lint command');
  
  if (!hookContent.includes('type-check')) {
    console.error('❌ FAIL: pre-commit hook does not include type-check command');
    process.exit(1);
  }
  console.log('✅ PASS: pre-commit hook includes type-check command');
  
  console.log('🎉 All git hooks tests passed!');
}

testGitHooksSetup();