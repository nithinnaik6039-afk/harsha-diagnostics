// src/routes/partnerRoutes.js
import express from 'express';
import { registerPartner, getPartnerOrders, updatePartnerEarnings } from '../controllers/partnerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Register a new delivery partner (no auth needed for registration)
router.post('/register', registerPartner);

// Protected routes: require a logged‑in partner (or admin) token
router.get('/:partnerId/orders', protect, getPartnerOrders);
router.patch('/:partnerId/earnings', protect, updatePartnerEarnings);

export default router;
