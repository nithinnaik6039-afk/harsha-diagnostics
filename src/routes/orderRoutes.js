import express from 'express';
import { createOrder, getOrderDetails, getMyOrders, updateOrderStatus, declineOrder } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all order routes
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderDetails);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/decline', declineOrder);

export default router;
