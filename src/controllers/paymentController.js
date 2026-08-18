// src/controllers/paymentController.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';

let razorpayInstance;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay payment order for an existing booking
 * POST /api/payments/create-order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const booking = await Order.findById(orderId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    if (booking.payment.method === 'CashOnCollection') {
      return res.status(400).json({ success: false, message: 'Cash on Collection bookings do not require online payment' });
    }

    if (booking.payment.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'This booking has already been paid' });
    }

    // Amount in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(booking.payment.amount * 100);

    const rzpOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `harsha_${orderId}`,
      notes: {
        bookingId: orderId,
        patientName: booking.patient.name
      }
    });

    booking.payment.razorpayOrderId = rzpOrder.id;
    await booking.save();

    return res.status(200).json({
      success: true,
      data: {
        rzpOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        qrToken: booking.qrToken,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId: orderId,
        patientName: booking.patient.name,
        description: `Harsha Diagnostics — ${booking.tests.length} Test(s)`
      }
    });
  } catch (error) {
    console.error('[Payment] createPaymentOrder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify Razorpay payment HMAC signature and mark booking Paid
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, message: 'All payment fields are required' });
    }

    // HMAC-SHA256: sign "orderId|paymentId" with key_secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.warn(`[Payment] INVALID signature for order ${orderId}`);
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    const booking = await Order.findById(orderId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.payment.status = 'Paid';
    booking.payment.razorpayPaymentId = razorpayPaymentId;
    booking.payment.transactionId = razorpayPaymentId;
    await booking.save();

    console.log(`[Payment] Payment verified for booking ${orderId} — pay ID: ${razorpayPaymentId}`);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: { orderId, paymentId: razorpayPaymentId, amount: booking.payment.amount, status: booking.payment.status }
    });
  } catch (error) {
    console.error('[Payment] verifyPayment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payment status for a booking
 * GET /api/payments/status/:orderId
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const booking = await Order.findById(req.params.orderId).select('payment patient');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    return res.status(200).json({
      success: true,
      data: {
        orderId: req.params.orderId,
        status: booking.payment.status,
        method: booking.payment.method,
        amount: booking.payment.amount,
        razorpayOrderId: booking.payment.razorpayOrderId,
        razorpayPaymentId: booking.payment.razorpayPaymentId
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm direct UPI/Scanner payment
 * POST /api/payments/confirm-direct
 */
export const confirmDirectPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body;

    if (!orderId || !paymentMethod || !transactionId) {
      return res.status(400).json({ success: false, message: 'orderId, paymentMethod, and transactionId are required' });
    }

    const booking = await Order.findById(orderId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    booking.payment.status = 'Paid';
    booking.payment.method = 'UPI';
    booking.payment.transactionId = transactionId;
    await booking.save();

    console.log(`[Payment] Direct payment verified for booking ${orderId} via ${paymentMethod} — trans ID: ${transactionId}`);

    return res.status(200).json({
      success: true,
      message: 'Direct payment confirmed',
      data: { orderId, paymentMethod, transactionId, amount: booking.payment.amount, status: booking.payment.status }
    });
  } catch (error) {
    console.error('[Payment] confirmDirectPayment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
