// verify-endpoints.js - Endpoint validation script with Booking Logic
import { spawn } from 'child_process';
import http from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Starting integration endpoint validation (Phase 2 & 3)...');

const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: '5008', MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/harsha-diagnostics' },
  stdio: ['ignore', 'pipe', 'pipe']
});

// Helper to make HTTP GET/POST requests using native node http module
const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5008,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            rawBody: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

serverProcess.stdout.on('data', async (data) => {
  const output = data.toString();
  console.log(`[Server] ${output.trim()}`);

  if (output.includes('Server running') || output.includes('listening')) {
    console.log('\n📡 Server is ready. Running test requests...\n');
    try {
      // 1. Health check
      console.log('Testing GET /health...');
      const healthRes = await request('/health');
      if (healthRes.statusCode !== 200) throw new Error('Health check failed');
      console.log('✅ Health check passed.');

      // 2. Fetch seeded tests
      console.log('\nTesting GET /api/tests...');
      const testsRes = await request('/api/tests');
      if (testsRes.statusCode !== 200 || !testsRes.body.success) throw new Error('Fetch tests failed');
      console.log(`✅ Found ${testsRes.body.count} tests.`);

      // Get a valid test ID for booking
      const testId = testsRes.body.data[0]._id;
      const testName = testsRes.body.data[0].name;
      console.log(`Using test: "${testName}" (ID: ${testId})`);

      // 3. Send OTP
      console.log('\nTesting POST /api/auth/send-otp...');
      const sendOtpRes = await request('/api/auth/send-otp', 'POST', {
        phone: '9876543210',
        role: 'customer'
      });
      if (sendOtpRes.statusCode !== 200) throw new Error('Send OTP failed');
      console.log('✅ Send OTP request accepted.');

      // 4. Verify OTP (Register/Login)
      console.log('\nTesting POST /api/auth/verify-otp...');
      const verifyOtpRes = await request('/api/auth/verify-otp', 'POST', {
        phone: '9876543210',
        otp: '123456',
        role: 'customer',
        name: 'Test Patient'
      });
      if (verifyOtpRes.statusCode !== 200 || !verifyOtpRes.body.success) throw new Error('Verify OTP failed');
      const token = verifyOtpRes.body.token;
      console.log('✅ Login successful. Received token.');

      // 4b. Register Expo Push Token
      console.log('\nTesting PATCH /api/auth/push-token...');
      const pushTokenRes = await request('/api/auth/push-token', 'PATCH', {
        expoPushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
      }, token);
      if (pushTokenRes.statusCode !== 200 || !pushTokenRes.body.success) throw new Error('Push token registration failed');
      console.log('✅ Push token registered successfully.');

      // 4c. Update User Profile
      console.log('\nTesting PUT /api/auth/profile...');
      const profileUpdateRes = await request('/api/auth/profile', 'PUT', {
        firstName: 'Nithin',
        lastName: 'Naik',
        gender: 'Male',
        age: 29,
        email: 'customer.test@harsha.com',
        bloodGroup: 'O+',
        dob: '01/01/1997',
        emergencyContact: '9999999999'
      }, token);
      if (profileUpdateRes.statusCode !== 200 || !profileUpdateRes.body.success) throw new Error('Profile update failed');
      console.log('✅ Profile updated successfully:', profileUpdateRes.body.user.name, 'Age:', profileUpdateRes.body.user.age);

      // 4d. Google Login
      console.log('\nTesting POST /api/auth/firebase-google...');
      const googleLoginRes = await request('/api/auth/firebase-google', 'POST', {
        firebaseUid: 'test-google-uid-verify-9999',
        email: 'verify.google@harsha.com',
        name: 'Verify Google Patient'
      });
      if (googleLoginRes.statusCode !== 200 || !googleLoginRes.body.success) throw new Error('Google Login failed');
      console.log('✅ Google Login successful:', googleLoginRes.body.user.name, 'Phone fallback:', googleLoginRes.body.user.phone);

      // 5. Book Order - Close distance (0-3 km) -> should be FREE collection
      console.log('\nTesting POST /api/orders (0-3 km location)...');
      const closeOrderRes = await request('/api/orders', 'POST', {
        patient: { name: 'Test Patient', age: 30, gender: 'Male' },
        tests: [testId],
        address: {
          addressLine: 'MIG Bus Stand area, Anantapuramu',
          coordinates: { lat: 14.6830, lng: 77.6010 } // ~0.15 km away
        },
        slot: { date: '2026-07-10', time: '7:00 AM - 8:00 AM' },
        paymentMethod: 'UPI'
      }, token);

      console.log(`Response status: ${closeOrderRes.statusCode}`);
      console.log('Response body:', closeOrderRes.body);
      console.log('Collection charge applied:', closeOrderRes.body.data?.collectionCharge);
      console.log('Safety verification PIN:', closeOrderRes.body.data.safetyPin);
      if (closeOrderRes.statusCode !== 201 || closeOrderRes.body.data.collectionCharge !== 0) {
        throw new Error('Close booking distance charge calculation error');
      }
      console.log('✅ Close distance booking test passed (Free visit fee applied).');

      const orderId = closeOrderRes.body.data._id;

    // 5c. Test dispatch assign endpoint
    console.log('\nTesting POST /api/dispatch/assign...');
    const dispatchRes = await request('/api/dispatch/assign', 'POST', { orderId }, token);
    console.log(`Dispatch response status: ${dispatchRes.statusCode}`);
    console.log('Dispatch response body:', dispatchRes.body);
    if (dispatchRes.statusCode !== 200 || !dispatchRes.body.success) {
      throw new Error('Dispatch assign failed');
    }
    console.log('✅ Dispatch assign test passed. Partner assigned:', dispatchRes.body.partnerId);

      // 5b. Razorpay API Tests
      console.log('\nTesting POST /api/payments/create-order (Razorpay)...');
      const createOrderRes = await request('/api/payments/create-order', 'POST', { orderId }, token);
      if (createOrderRes.statusCode !== 200 || !createOrderRes.body.success) throw new Error('Razorpay create-order failed');
      
      const rzpOrderId = createOrderRes.body.data.rzpOrderId;
      console.log(`✅ Razorpay order created successfully. RZP Order ID: ${rzpOrderId}`);

      console.log('\nTesting POST /api/payments/verify (Razorpay HMAC-SHA256 Signature)...');
      // Mocking a successful payment by generating the valid signature using test secret
      const rzpPaymentId = 'pay_Mock1234567890';
      const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
      
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const verifyRes = await request('/api/payments/verify', 'POST', {
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: generatedSignature,
        orderId: orderId
      }, token);
      
      if (verifyRes.statusCode !== 200 || !verifyRes.body.success) {
        console.error('Razorpay verification error response:', verifyRes.body);
        throw new Error('Razorpay verification failed');
      }
      console.log('✅ Razorpay signature verified. Payment marked as Paid.');

      // 6. Book Order - Mid distance (3-5 km) -> should add ₹20 collection charge
      console.log('\nTesting POST /api/orders (3-5 km location)...');
      const midOrderRes = await request('/api/orders', 'POST', {
        patient: { name: 'Test Patient', age: 30, gender: 'Male' },
        tests: [testId],
        address: {
          addressLine: 'Subedari Colony, Anantapuramu',
          coordinates: { lat: 14.7100, lng: 77.6100 } // ~3.29 km away
        },
        slot: { date: '2026-07-10', time: '8:00 AM - 9:00 AM' },
        paymentMethod: 'CashOnCollection'
      }, token);

      console.log(`Response status: ${midOrderRes.statusCode}`);
      console.log('Collection charge applied:', midOrderRes.body.data.collectionCharge);
      if (midOrderRes.statusCode !== 201 || midOrderRes.body.data.collectionCharge !== 20) {
        throw new Error('Mid distance booking charge calculation error');
      }
      console.log('✅ Mid distance booking test passed (₹20 visit fee applied).');

      // 7. Book Order - Outside distance (>5 km) -> should be BLOCKED
      console.log('\nTesting POST /api/orders (>5 km location)...');
      const farOrderRes = await request('/api/orders', 'POST', {
        patient: { name: 'Test Patient', age: 30, gender: 'Male' },
        tests: [testId],
        address: {
          addressLine: 'Dharmavaram bypass road, AP',
          coordinates: { lat: 14.4100, lng: 77.7100 } // ~31 km away
        },
        slot: { date: '2026-07-10', time: '9:00 AM - 10:00 AM' },
        paymentMethod: 'UPI'
      }, token);

      console.log(`Response status: ${farOrderRes.statusCode}`);
      console.log('Message:', farOrderRes.body.message);
      if (farOrderRes.statusCode !== 400 || !farOrderRes.body.outsideZone) {
        throw new Error('Far location check failed to block booking');
      }
      console.log('✅ Outside service zone booking block test passed.');

      // 8. Fetch Order History
      console.log('\nTesting GET /api/orders (History)...');
      const historyRes = await request('/api/orders', 'GET', null, token);
      console.log(`Response status: ${historyRes.statusCode}`);
      console.log(`Found ${historyRes.body.count} orders in history.`);
      if (historyRes.statusCode !== 200 || historyRes.body.count < 2) {
        throw new Error('Order history fetch failed');
      }
      console.log('✅ Order history retrieval test passed.');

      // 9. Fetch Order Details
      console.log(`\nTesting GET /api/orders/${orderId} (Details)...`);
      const detailsRes = await request(`/api/orders/${orderId}`, 'GET', null, token);
      console.log(`Response status: ${detailsRes.statusCode}`);
      console.log('Safety Verification code matching:', detailsRes.body.data.safetyPin === closeOrderRes.body.data.safetyPin);
      console.log('Timeline state:', detailsRes.body.data.statusTimeline[0].status);
      if (detailsRes.statusCode !== 200 || detailsRes.body.data.safetyPin !== closeOrderRes.body.data.safetyPin) {
        throw new Error('Order details retrieval or PIN mismatch');
      }
      console.log('✅ Order details retrieval test passed.');

      // 10. Order Status State Machine Transition Tests
      console.log('\nTesting PATCH /api/orders/:id/status (State Machine Transitions)...');
      
      const pin = closeOrderRes.body.data.safetyPin;
      const mltMockId = '60c72b2f9b1d8a43288f6c44'; // Mock phlebotomist ObjectId

      // Test 10a: Invalid transition Booked -> Collected (Should fail with 400)
      console.log('Testing invalid jump: Booked -> Collected...');
      const invalidJumpRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Collected' }, token);
      console.log(`Response status: ${invalidJumpRes.statusCode} (Expected: 400)`);
      if (invalidJumpRes.statusCode !== 400) throw new Error('Allowed invalid state transition Booked -> Collected');

      // Test 10b: Valid transition Booked -> Assigned without mltId (Should fail with 400)
      console.log('Testing Assigned state without MLT ID...');
      const missingMltRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Assigned' }, token);
      console.log(`Response status: ${missingMltRes.statusCode} (Expected: 400)`);
      if (missingMltRes.statusCode !== 400) throw new Error('Allowed Assigned transition without phlebotomist ID');

      // Test 10c: Valid transition Booked -> Assigned (Should pass with 200)
      console.log('Testing valid transition: Booked -> Assigned...');
      const assignRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Assigned', mltId: mltMockId }, token);
      console.log(`Response status: ${assignRes.statusCode}`);
      if (assignRes.statusCode !== 200 || assignRes.body.data.status !== 'Assigned') throw new Error('Failed to transition to Assigned');

      // Test 10d: Valid transition Assigned -> OnTheWay (Should pass with 200)
      console.log('Testing valid transition: Assigned -> OnTheWay...');
      const onTheWayRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'OnTheWay' }, token);
      console.log(`Response status: ${onTheWayRes.statusCode}`);
      if (onTheWayRes.statusCode !== 200 || onTheWayRes.body.data.status !== 'OnTheWay') throw new Error('Failed to transition to OnTheWay');

      // Test 10e: Valid transition OnTheWay -> Arrived with wrong PIN (Should fail with 400)
      console.log('Testing Arrived state with incorrect PIN...');
      const wrongPinRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Arrived', safetyPin: '9999' }, token);
      console.log(`Response status: ${wrongPinRes.statusCode} (Expected: 400)`);
      if (wrongPinRes.statusCode !== 400) throw new Error('Allowed Arrived transition with wrong safety PIN');

      // Test 10f: Valid transition OnTheWay -> Arrived with correct PIN (Should pass with 200)
      console.log('Testing valid transition: OnTheWay -> Arrived with correct PIN...');
      const arriveRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Arrived', safetyPin: pin }, token);
      console.log(`Response status: ${arriveRes.statusCode}`);
      if (arriveRes.statusCode !== 200 || arriveRes.body.data.status !== 'Arrived') throw new Error('Failed to transition to Arrived with correct PIN');

      // Test 10g: Valid transition Arrived -> Collected (Should pass with 200)
      console.log('Testing valid transition: Arrived -> Collected...');
      const collectRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Collected' }, token);
      console.log(`Response status: ${collectRes.statusCode}`);
      if (collectRes.statusCode !== 200 || collectRes.body.data.status !== 'Collected') throw new Error('Failed to transition to Collected');

      // Test 10h: Valid transition Collected -> Submitted (Should pass with 200)
      console.log('Testing valid transition: Collected -> Submitted...');
      const submitRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { status: 'Submitted' }, token);
      console.log(`Response status: ${submitRes.statusCode}`);
      if (submitRes.statusCode !== 200 || submitRes.body.data.status !== 'Submitted') throw new Error('Failed to transition to Submitted');

      // Test 10i: Valid transition Submitted -> ReportReady (Should pass with 200)
      console.log('Testing valid transition: Submitted -> ReportReady with PDF link...');
      const reportRes = await request(`/api/orders/${orderId}/status`, 'PATCH', { 
        status: 'ReportReady',
        reportUrl: 'https://cloudinary.com/reports/harsha-123.pdf'
      }, token);
      console.log(`Response status: ${reportRes.statusCode}`);
      console.log('Updated Payment Status:', reportRes.body.data.payment.status);
      if (reportRes.statusCode !== 200 || reportRes.body.data.status !== 'ReportReady' || reportRes.body.data.payment.status !== 'Paid') {
        throw new Error('Failed to transition to ReportReady or set payment status to Paid');
      }
      console.log('✅ Status transitions state machine verified successfully.');

      console.log('\n🎉 ALL PHASE 2 ENDPOINTS COMPLETED AND VERIFIED WITHOUT ERRORS!\n');
      shutdown(0);
    } catch (err) {
      console.error('\n❌ Integration validation failed:', err.message);
      shutdown(1);
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server Error] ${data.toString()}`);
});

const shutdown = (code) => {
  console.log('Shutting down test server...');
  serverProcess.kill('SIGINT');
  process.exit(code);
};
