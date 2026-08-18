import express from 'express';
import { createPaymentOrder, verifyPayment, getPaymentStatus, confirmDirectPayment } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// POST /api/payments/create-order  — create Razorpay order for a booking
router.post('/create-order', createPaymentOrder);

// POST /api/payments/verify  — verify HMAC signature + mark booking Paid
router.post('/verify', verifyPayment);

// POST /api/payments/confirm-direct  — confirm direct UPI/Scanner payment
router.post('/confirm-direct', confirmDirectPayment);

// GET /api/payments/status/:orderId  — check payment status
router.get('/status/:orderId', getPaymentStatus);

export default router;
