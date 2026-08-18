import express from 'express';
import { getTests, getChatbotFAQs, createTest, updateTest, deleteTest } from '../controllers/testController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/tests', getTests);
router.get('/chatbot-faqs', getChatbotFAQs);

// Protected Admin CRUD Catalog routes
router.post('/tests', protect, createTest);
router.put('/tests/:id', protect, updateTest);
router.delete('/tests/:id', protect, deleteTest);

export default router;
