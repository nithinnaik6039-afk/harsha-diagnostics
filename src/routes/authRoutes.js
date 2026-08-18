import express from 'express';
import {
  sendOtp,
  verifyOtp,
  adminLogin,
  getAllMLTs,
  savePushToken,
  register,
  verifyRegisterOtp,
  updateProfile,
  firebaseGoogleLogin
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);
router.post('/register', register);
router.post('/verify-register', verifyRegisterOtp);
router.post('/firebase-google', firebaseGoogleLogin);
router.put('/profile', protect, updateProfile);
router.get('/mlts', protect, getAllMLTs);
router.patch('/push-token', protect, savePushToken);  // Save Expo push token

export default router;
