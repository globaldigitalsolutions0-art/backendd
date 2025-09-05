/**
 * Test script for the server console API
 * 
 * This script tests the basic functionality of the server console API endpoints
 * Run with: node test-console.js
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:3001/api/console';
const USERNAME = 'admin';
const PASSWORD = 'admin123';

// Authentication token
const authToken = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}/${endpoint}`, options);
    const data = await response.json();
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`API error (${endpoint}):`, error.message);
    return { status: 500, error: error.message };
  }
}

// Test all endpoints
async function runTests() {
  console.log('\n🧪 TESTING SERVER CONSOLE API');
  console.log('============================');
  
  // Test 1: System Info
  console.log('\n📋 Test 1: Get System Info');
  const sysInfoResult = await apiRequest('system-info');
  if (sysInfoResult.status === 200) {
    console.log('✅ Success! System info retrieved');
    console.log('📊 Sample data:', {
      hostname: sysInfoResult.data.hostname,
      platform: sysInfoResult.data.platform,
      nodeVersion: sysInfoResult.data.nodeVersion
    });
  } else {
    console.log('❌ Failed to get system info:', sysInfoResult.status, sysInfoResult.data);
  }
  
  // Test 2: Database Connections
  console.log('\n📋 Test 2: Get Database Connections');
  const dbResult = await apiRequest('connections');
  if (dbResult.status === 200) {
    console.log('✅ Success! Database connection info retrieved');
    console.log('📊 Connection state:', dbResult.data.state);
    console.log('📊 Database name:', dbResult.data.name);
  } else {
    console.log('❌ Failed to get database info:', dbResult.status, dbResult.data);
  }
  
  // Test 3: Server Logs
  console.log('\n📋 Test 3: Get Server Logs');
  const logsResult = await apiRequest('logs?lines=5');
  if (logsResult.status === 200) {
    console.log('✅ Success! Server logs retrieved');
    console.log('📊 Log entries:', logsResult.data.logs.length);
    if (logsResult.data.logs.length > 0) {
      console.log('📊 Latest log:', logsResult.data.logs[logsResult.data.logs.length - 1]);
    }
  } else {
    console.log('❌ Failed to get logs:', logsResult.status, logsResult.data);
  }
  
  // Test 4: Authentication Failure
  console.log('\n📋 Test 4: Authentication Failure');
  const badAuthResult = await fetch(`${API_BASE}/system-info`);
  if (badAuthResult.status === 401) {
    console.log('✅ Success! Authentication required as expected');
  } else {
    console.log('❌ Failed test: Expected 401, got:', badAuthResult.status);
  }
  
  console.log('\n============================');
  console.log('🏁 Testing complete!\n');
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution failed:', err);
});