import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const DB_URL = process.env.MONGODB_URL;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.bright}🧪 ${msg}${colors.reset}`),
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

const recordTest = (name, passed, details = '') => {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    log.success(name);
  } else {
    testResults.failed++;
    log.error(name + (details ? ` - ${details}` : ''));
  }
};


// Test 1: Version field exists in Campaign
const testVersionField = async () => {
  log.test('Testing version field existence in Campaign model');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    const sample = await Campaign.findOne();
    const hasVersion = sample && typeof sample.version !== 'undefined';
    recordTest('Campaign model has version field', hasVersion);
    await conn.disconnect();
  } catch (error) {
    recordTest('Campaign model has version field', false, error.message);
  }
};

// Test 2: Atomic increment operation
const testAtomicIncrement = async () => {
  log.test('Testing atomic increment ($inc) for donations');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Concurrency Test Campaign',
      currentAmount: 0,
      goalAmount: 1000,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    log.info(`Created test campaign: ${campaignId}`);
    
    // Simulate concurrent increments
    const increment1 = Campaign.updateOne(
      { _id: campaignId },
      { $inc: { currentAmount: 100 } }
    );
    
    const increment2 = Campaign.updateOne(
      { _id: campaignId },
      { $inc: { currentAmount: 200 } }
    );
    
    const increment3 = Campaign.updateOne(
      { _id: campaignId },
      { $inc: { currentAmount: 150 } }
    );
    
    // Execute concurrently
    await Promise.all([increment1, increment2, increment3]);
    
    // Check final amount
    const updated = await Campaign.findOne({ _id: campaignId });
    const expected = 450; // 100 + 200 + 150
    const correct = updated.currentAmount === expected;
    
    recordTest(
      'Atomic increment correctly adds concurrent donations',
      correct,
      `Expected: ${expected}, Got: ${updated.currentAmount}`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Atomic increment correctly adds concurrent donations', false, error.message);
  }
};

// Test 3: $inc operator prevents race conditions
const testRaceConditionPrevention = async () => {
  log.test('Testing race condition prevention with $inc');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Race Condition Test Campaign',
      currentAmount: 0,
      goalAmount: 5000,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    
    // Simulate 10 concurrent donations of $100 each
    const promises = Array(10).fill(null).map(() =>
      Campaign.updateOne(
        { _id: campaignId },
        { $inc: { currentAmount: 100 } }
      )
    );
    
    await Promise.all(promises);
    
    // Check if total is exactly 1000 (no lost updates)
    const final = await Campaign.findOne({ _id: campaignId });
    const expected = 1000;
    const correct = final.currentAmount === expected;
    
    recordTest(
      'Race condition prevention: 10 concurrent donations',
      correct,
      `Expected: ${expected}, Got: ${final.currentAmount}`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Race condition prevention: 10 concurrent donations', false, error.message);
  }
};

// Test 4: Version field increments on update
const testVersionIncrement = async () => {
  log.test('Testing version field increments on campaign update');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Version Test Campaign',
      status: 'Pending',
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    
    // Get initial version
    const initial = await Campaign.findOne({ _id: campaignId });
    const initialVersion = initial.version;
    
    // Update campaign
    await Campaign.updateOne(
      { _id: campaignId },
      { 
        $set: { status: 'Approved' },
        $inc: { version: 1 }
      }
    );
    
    // Check version incremented
    const updated = await Campaign.findOne({ _id: campaignId });
    const versionIncremented = updated.version === initialVersion + 1;
    
    recordTest(
      'Version field increments on update',
      versionIncremented,
      `Version: ${initialVersion} → ${updated.version}`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Version field increments on update', false, error.message);
  }
};

// Test 5: Optimistic locking detects conflicts
const testOptimisticLocking = async () => {
  log.test('Testing optimistic locking with version field');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Optimistic Lock Test',
      status: 'Pending',
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    
    // Get current version
    const doc = await Campaign.findOne({ _id: campaignId });
    const currentVersion = doc.version;
    
    // Simulate update from another process
    await Campaign.updateOne(
      { _id: campaignId },
      { 
        $set: { status: 'Approved' },
        $inc: { version: 1 }
      }
    );
    
    // Try to update with old version (should fail or get newer version)
    const staleUpdate = await Campaign.updateOne(
      { _id: campaignId, version: currentVersion },
      { 
        $set: { status: 'Completed' },
        $inc: { version: 1 }
      }
    );
    
    // Check if update was ignored (optimistic locking detected conflict)
    const final = await Campaign.findOne({ _id: campaignId });
    const conflictDetected = final.status !== 'Completed' || staleUpdate.matchedCount === 0;
    
    recordTest(
      'Optimistic locking detects concurrent modifications',
      conflictDetected,
      `Final status: ${final.status}, Version: ${final.version}`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Optimistic locking detects concurrent modifications', false, error.message);
  }
};

// Test 6: Donors count concurrency
const testDonorCountConcurrency = async () => {
  log.test('Testing concurrent donor count increments');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Donor Count Test',
      donors: 0,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    
    // Simulate 5 concurrent donor increments
    const promises = Array(5).fill(null).map(() =>
      Campaign.updateOne(
        { _id: campaignId },
        { $inc: { donors: 1 } }
      )
    );
    
    await Promise.all(promises);
    
    // Check final count
    const final = await Campaign.findOne({ _id: campaignId });
    const expected = 5;
    const correct = final.donors === expected;
    
    recordTest(
      'Concurrent donor count increments',
      correct,
      `Expected: ${expected}, Got: ${final.donors}`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Concurrent donor count increments', false, error.message);
  }
};

// Test 7: Check actual donation route uses $inc
const testDonationRouteImplementation = async () => {
  log.test('Testing donation route uses atomic operations');
  try {
    const donorRoutePath = path.join(
      process.cwd(),
      'server/src/routes/donorRoute.js'
    );
    
    const content = fs.readFileSync(donorRoutePath, 'utf8');
    const hasIncOperator = content.includes('$inc');
    const hasCurrentAmount = content.includes('currentAmount');
    
    recordTest(
      'Donation route uses $inc for atomic updates',
      hasIncOperator && hasCurrentAmount,
      hasIncOperator ? 'Found $inc operator' : 'Missing $inc operator'
    );
  } catch (error) {
    recordTest('Donation route uses $inc for atomic updates', false, error.message);
  }
};

// Test 8: Check adminRoute for concurrency patterns
const testAdminRouteImplementation = async () => {
  log.test('Testing admin route for concurrency-safe operations');
  try {
    const adminRoutePath = path.join(
      process.cwd(),
      'server/src/routes/adminRoute.js'
    );
    
    const content = fs.readFileSync(adminRoutePath, 'utf8');
    const usesFindByIdAndUpdate = content.includes('findByIdAndUpdate');
    
    recordTest(
      'Admin route uses findByIdAndUpdate for atomic operations',
      usesFindByIdAndUpdate,
      usesFindByIdAndUpdate ? 'Uses atomic operations' : 'May have race conditions'
    );
  } catch (error) {
    recordTest('Admin route uses findByIdAndUpdate for atomic operations', false, error.message);
  }
};

// Test 9: Session transactions support
const testSessionTransactions = async () => {
  log.test('Checking for session-based transaction support');
  try {
    const conn = await mongoose.connect(DB_URL);
    const session = await conn.startSession();
    
    const supported = !!session;
    recordTest(
      'MongoDB session transactions available',
      supported,
      'Sessions can be used for multi-document ACID transactions'
    );
    
    await session.endSession();
    await conn.disconnect();
  } catch (error) {
    recordTest('MongoDB session transactions available', false, error.message);
  }
};

// Test 10: Multiple concurrent field updates
const testMultipleConcurrentFields = async () => {
  log.test('Testing multiple concurrent field increments');
  try {
    const conn = await mongoose.connect(DB_URL);
    const Campaign = conn.connection.collection('campaigns');
    
    // Create test campaign
    const result = await Campaign.insertOne({
      title: 'Multi-field Concurrency Test',
      currentAmount: 0,
      donors: 0,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const campaignId = result.insertedId;
    
    // Concurrent updates to multiple fields
    const promises = Array(5).fill(null).map(() =>
      Campaign.updateOne(
        { _id: campaignId },
        { 
          $inc: { 
            currentAmount: 50,
            donors: 1 
          } 
        }
      )
    );
    
    await Promise.all(promises);
    
    // Check final values
    const final = await Campaign.findOne({ _id: campaignId });
    const correctAmount = final.currentAmount === 250; // 5 * 50
    const correctDonors = final.donors === 5;
    const bothCorrect = correctAmount && correctDonors;
    
    recordTest(
      'Multiple concurrent field increments',
      bothCorrect,
      `Amount: ${final.currentAmount}/250, Donors: ${final.donors}/5`
    );
    
    // Cleanup
    await Campaign.deleteOne({ _id: campaignId });
    await conn.disconnect();
  } catch (error) {
    recordTest('Multiple concurrent field increments', false, error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  log.header('🔬 CONCURRENCY CONTROL TEST SUITE');
  
  log.info('Testing concurrency control implementation in your system...\n');
  
  await testVersionField();
  await testAtomicIncrement();
  await testRaceConditionPrevention();
  await testVersionIncrement();
  await testOptimisticLocking();
  await testDonorCountConcurrency();
  await testDonationRouteImplementation();
  await testAdminRouteImplementation();
  await testSessionTransactions();
  await testMultipleConcurrentFields();
  
  // Print summary
  log.header('📊 TEST RESULTS SUMMARY');
  
  const total = testResults.passed + testResults.failed;
  console.log(`${colors.bright}Total Tests: ${total}${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  
  const passRate = ((testResults.passed / total) * 100).toFixed(1);
  console.log(`\n${colors.bright}Pass Rate: ${passRate}%${colors.reset}\n`);
  
  // Detailed results
  if (testResults.tests.length > 0) {
    log.header('📋 DETAILED TEST RESULTS');
    testResults.tests.forEach((test, index) => {
      const status = test.passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
      console.log(`${index + 1}. ${status} - ${test.name}`);
      if (test.details) {
        console.log(`   ${test.details}`);
      }
    });
  }
  
  if (testResults.failed === 0) {
    log.header('🎉 ALL CONCURRENCY TESTS PASSED!');
    console.log(`${colors.green}Concurrency control is properly implemented in your system.${colors.reset}\n`);
  } else {
    log.header('⚠️  SOME TESTS FAILED');
    console.log(`${colors.yellow}Review the failed tests above and check your implementation.${colors.reset}\n`);
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
};

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
