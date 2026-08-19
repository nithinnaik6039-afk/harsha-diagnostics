import MLT from './src/models/MLT.js';
import User from './src/models/User.js';
import Test from './src/models/Test.js';
import Order from './src/models/Order.js';
import ServiceZone from './src/models/ServiceZone.js';
import ChatbotFAQ from './src/models/ChatbotFAQ.js';
import Partner from './src/models/Partner.js';
import Certificate from './src/models/Certificate.js';
import { sendOtp, verifyOtp, adminLogin, getAllMLTs, firebaseGoogleLogin } from './src/controllers/authController.js';
import { getTests } from './src/controllers/testController.js';
import { createOrder, getMyOrders, getOrderDetails, updateOrderStatus } from './src/controllers/orderController.js';
import { createPaymentOrder, confirmDirectPayment, getPaymentStatus } from './src/controllers/paymentController.js';
import { registerPartner, getPartnerOrders, updatePartnerEarnings } from './src/controllers/partnerController.js';
import { getCertificatesByMlt } from './src/controllers/certificateController.js';
import { assignPartner } from './src/controllers/dispatchController.js';

console.log('🚀 Running In-Process Full System Validation of All Models & Controllers...\n');

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
};

const mockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

const run = async () => {
  try {
    // 1. Test Model Queries
    console.log('1. Model Query Checks:');
    const allTests = await Test.find({ isActive: true });
    assert(allTests && allTests.length >= 11, `Test.find() returns ${allTests?.length} catalog tests`);

    const mltRajesh = await MLT.findOne({ phone: '1112223334' });
    assert(mltRajesh && mltRajesh.name === 'Rajesh Kumar', `MLT.findOne() found Rajesh Kumar (${mltRajesh?.phone})`);

    const userRahul = await User.findOne({ phone: '9876543210' });
    assert(userRahul && userRahul.name === 'Rahul Sharma', `User.findOne() found Rahul Sharma (${userRahul?.phone})`);

    const zone = await ServiceZone.findOne({ isActive: true });
    assert(zone && zone.name.includes('Anantapur'), `ServiceZone.findOne() found zone: ${zone?.name}`);

    const faqs = await ChatbotFAQ.find({ isActive: true });
    assert(faqs && faqs.length >= 2, `ChatbotFAQ.find() returns ${faqs?.length} FAQs`);

    // 2. Auth Controller - MLT OTP Flow
    console.log('\n2. MLT OTP Authentication Controller:');
    const mltSendReq = { body: { phone: '1112223334', role: 'mlt' } };
    const mltSendRes = mockRes();
    await sendOtp(mltSendReq, mltSendRes);
    assert(mltSendRes.statusCode === 200 && mltSendRes.data.success, 'sendOtp for MLT succeeds');

    const mltVerifyReq = { body: { phone: '1112223334', otp: '123456', role: 'mlt', name: 'Rajesh Kumar' } };
    const mltVerifyRes = mockRes();
    await verifyOtp(mltVerifyReq, mltVerifyRes);
    assert(mltVerifyRes.statusCode === 200 && mltVerifyRes.data.token && mltVerifyRes.data.user.name === 'Rajesh Kumar', 'verifyOtp for MLT issues JWT token without any buffering timeout');
    const mltId = mltVerifyRes.data.user._id;

    // 3. Auth Controller - MLT Google Login
    console.log('\n3. MLT Google Login Controller:');
    const mltGoogleReq = { body: { firebaseUid: 'google-mlt-uid-777', email: 'mlt_rajesh@harsha.com', role: 'mlt' } };
    const mltGoogleRes = mockRes();
    await firebaseGoogleLogin(mltGoogleReq, mltGoogleRes);
    assert(mltGoogleRes.statusCode === 200 && mltGoogleRes.data.success, 'firebaseGoogleLogin for MLT succeeds');

    // 4. Auth Controller - Customer OTP Flow
    console.log('\n4. Customer OTP Flow:');
    const custSendReq = { body: { phone: '9876543210', role: 'customer' } };
    const custSendRes = mockRes();
    await sendOtp(custSendReq, custSendRes);
    assert(custSendRes.statusCode === 200 && custSendRes.data.success, 'sendOtp for Customer succeeds');

    const custVerifyReq = { body: { phone: '9876543210', otp: '123456', role: 'customer' } };
    const custVerifyRes = mockRes();
    await verifyOtp(custVerifyReq, custVerifyRes);
    assert(custVerifyRes.statusCode === 200 && custVerifyRes.data.token && custVerifyRes.data.user.name === 'Rahul Sharma', 'verifyOtp for Customer succeeds');
    const customerId = custVerifyRes.data.user._id;

    // 5. Auth Controller - Admin Login
    console.log('\n5. Admin Login:');
    const adminReq = { body: { username: 'admin_super', password: 'super_secret_harsha_2026' } };
    const adminRes = mockRes();
    await adminLogin(adminReq, adminRes);
    assert(adminRes.statusCode === 200 && adminRes.data.success && adminRes.data.role === 'admin', 'adminLogin succeeds for Super Admin');

    // 6. Test Controller - Get Tests
    console.log('\n6. Test Controller:');
    const testsReq = { query: {} };
    const testsRes = mockRes();
    await getTests(testsReq, testsRes);
    assert(testsRes.statusCode === 200 && testsRes.data.count >= 11, 'getTests returns full diagnostic catalog');

    // 7. Order Controller - Booking Creation & Retrieval
    console.log('\n7. Order Controller Lifecycle:');
    const sampleTestId = allTests[0]._id;
    const createOrderReq = {
      user: { id: customerId, role: 'customer' },
      body: {
        patient: { name: 'Rahul Sharma', age: 32, gender: 'Male' },
        tests: [sampleTestId],
        address: {
          addressLine: 'Flat 302, Sri Krishna Nilayam, Court Road, Anantapur',
          coordinates: { lat: 14.6819, lng: 77.6006 }
        },
        slot: { date: new Date().toISOString(), time: '08:00 AM - 09:00 AM' },
        paymentMethod: 'UPI'
      },
      app: { get: () => null }
    };
    const createOrderRes = mockRes();
    await createOrder(createOrderReq, createOrderRes);
    assert(createOrderRes.statusCode === 201 && createOrderRes.data.success && createOrderRes.data.data._id, 'createOrder creates booking successfully');
    const createdOrderId = createOrderRes.data?.data?._id;

    // Get My Orders
    const getOrdersReq = { user: { id: customerId, role: 'customer' } };
    const getOrdersRes = mockRes();
    await getMyOrders(getOrdersReq, getOrdersRes);
    assert(getOrdersRes.statusCode === 200 && getOrdersRes.data.count >= 1, 'getMyOrders returns customer booking history');

    // Get Order Details
    const orderDetailsReq = { user: { id: customerId, role: 'customer' }, params: { id: createdOrderId } };
    const orderDetailsRes = mockRes();
    await getOrderDetails(orderDetailsReq, orderDetailsRes);
    assert(orderDetailsRes.statusCode === 200 && orderDetailsRes.data.success, 'getOrderDetails returns booking with populated fields');

    // Transition Order Status
    const updateStatusReq = {
      user: { id: customerId, role: 'customer' },
      params: { id: createdOrderId },
      body: { status: 'Assigned', mltId: mltId }
    };
    const updateStatusRes = mockRes();
    await updateOrderStatus(updateStatusReq, updateStatusRes);
    assert(updateStatusRes.statusCode === 200 && updateStatusRes.data.data.status === 'Assigned', 'updateOrderStatus transitions to Assigned');

    // 8. Payment Controller
    console.log('\n8. Payment Controller:');
    const createPayReq = { user: { id: customerId }, body: { orderId: createdOrderId } };
    const createPayRes = mockRes();
    await createPaymentOrder(createPayReq, createPayRes);
    assert(createPayRes.statusCode === 200 && createPayRes.data.success, 'createPaymentOrder creates Razorpay/Sim order');

    const confirmPayReq = {
      user: { id: customerId },
      body: { orderId: createdOrderId, paymentMethod: 'UPI', transactionId: 'UPI-TXN-998877' }
    };
    const confirmPayRes = mockRes();
    await confirmDirectPayment(confirmPayReq, confirmPayRes);
    assert(confirmPayRes.statusCode === 200 && confirmPayRes.data.data.status === 'Paid', 'confirmDirectPayment marks order Paid');

    const payStatusReq = { params: { orderId: createdOrderId } };
    const payStatusRes = mockRes();
    await getPaymentStatus(payStatusReq, payStatusRes);
    assert(payStatusRes.statusCode === 200 && payStatusRes.data.data.status === 'Paid', 'getPaymentStatus returns Paid status');

    // 9. Partner & Dispatch Controllers
    console.log('\n9. Partner & Dispatch Controllers:');
    const regPartnerReq = { body: { name: 'Express Driver 2', email: 'driver2@harsha.com', phone: '9888777666' } };
    const regPartnerRes = mockRes();
    await registerPartner(regPartnerReq, regPartnerRes);
    assert(regPartnerRes.statusCode === 201 && regPartnerRes.data.success, 'registerPartner registers new partner');
    const partnerId = regPartnerRes.data.data._id;

    const assignPartnerReq = { body: { orderId: createdOrderId }, app: { get: () => null } };
    const assignPartnerRes = mockRes();
    await assignPartner(assignPartnerReq, assignPartnerRes);
    assert(assignPartnerRes.statusCode === 200 && assignPartnerRes.data.success, 'assignPartner dispatches nearby partner/MLT');

    const partnerOrdersReq = { params: { partnerId } };
    const partnerOrdersRes = mockRes();
    await getPartnerOrders(partnerOrdersReq, partnerOrdersRes);
    assert(partnerOrdersRes.statusCode === 200 && partnerOrdersRes.data.success, 'getPartnerOrders returns available orders');

    // 10. Certificate Controller
    console.log('\n10. Certificate Controller:');
    await Certificate.create({
      mlt: mltId,
      title: 'Certified Phlebotomist License',
      imageUrl: 'https://example.com/cert.png'
    });
    const certReq = { params: { mltId } };
    const certRes = mockRes();
    await getCertificatesByMlt(certReq, certRes);
    assert(certRes.statusCode === 200 && certRes.data.success && certRes.data.data.length >= 1, 'getCertificatesByMlt returns MLT certificates');

    // Summary
    console.log('\n======================================================');
    console.log(`Full System In-Process Results: ${passed} passed, ${failed} failed`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
};

run();
