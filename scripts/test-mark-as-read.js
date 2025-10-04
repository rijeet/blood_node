#!/usr/bin/env node

/**
 * Test Mark as Read Functionality
 */

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testMarkAsRead() {
  console.log('🧪 Testing Mark as Read Functionality...\n');
  
  try {
    // First login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await makeRequest('/api/admin/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@bloodnode.com',
        password: 'admin123456'
      }
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Admin login failed:', loginResponse.data);
      return;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Get alerts first
    console.log('\n2. Getting alerts...');
    const alertsResponse = await makeRequest('/api/admin/security/alerts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (alertsResponse.status !== 200) {
      console.log('❌ Failed to get alerts:', alertsResponse.data);
      return;
    }
    
    const alerts = alertsResponse.data.data?.alerts || [];
    console.log(`✅ Found ${alerts.length} alerts`);
    
    if (alerts.length === 0) {
      console.log('⚠️  No alerts to test with');
      return;
    }
    
    // Find an unread alert
    const unreadAlert = alerts.find(alert => !alert.is_read);
    if (!unreadAlert) {
      console.log('⚠️  No unread alerts to test with');
      return;
    }
    
    console.log(`📋 Testing with alert: ${unreadAlert.title}`);
    console.log(`   Alert ID: ${unreadAlert._id}`);
    console.log(`   Currently read: ${unreadAlert.is_read}`);
    
    // Test mark as read
    console.log('\n3. Testing mark as read...');
    const markReadResponse = await makeRequest('/api/admin/security/alerts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        alert_id: unreadAlert._id,
        admin_id: 'admin@bloodnode.com'
      }
    });
    
    console.log(`   Mark Read Status: ${markReadResponse.status}`);
    console.log(`   Mark Read Response:`, markReadResponse.data);
    
    if (markReadResponse.status === 200) {
      console.log('✅ Alert marked as read successfully');
    } else {
      console.log('❌ Failed to mark alert as read');
    }
    
    // Verify the change
    console.log('\n4. Verifying change...');
    const verifyResponse = await makeRequest('/api/admin/security/alerts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (verifyResponse.status === 200) {
      const updatedAlerts = verifyResponse.data.data?.alerts || [];
      const updatedAlert = updatedAlerts.find(alert => alert._id === unreadAlert._id);
      
      if (updatedAlert) {
        console.log(`   Alert is now read: ${updatedAlert.is_read}`);
        if (updatedAlert.is_read) {
          console.log('✅ Verification successful - alert is marked as read');
        } else {
          console.log('❌ Verification failed - alert is still unread');
        }
      } else {
        console.log('❌ Could not find updated alert');
      }
    }
    
    console.log('\n✅ Mark as Read Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing mark as read:', error);
  }
}

testMarkAsRead();
