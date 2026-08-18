import express from 'express';
import { assignPartner } from '../controllers/dispatchController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected route to assign a partner to an order
router.post('/assign', protect, assignPartner);

export default router;
