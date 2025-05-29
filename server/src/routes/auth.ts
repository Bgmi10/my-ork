import { Router } from 'express';
import { sendOTP, verifyOTP, logout, profile, updateProfile, deleteProfile } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { sendOtpSchema, verifyOtpSchema } from '../schemas/auth.schema';
import { authMiddleware } from '../middleware/authMiddleware';

const authRoutes = Router();

authRoutes.post('/send-otp', validate(sendOtpSchema), sendOTP);
authRoutes.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
authRoutes.post('/logout', authMiddleware, logout);
authRoutes.get('/profile', authMiddleware, profile);
authRoutes.put('/profile/update', authMiddleware, updateProfile);
authRoutes.delete('/profile/delete', authMiddleware, deleteProfile);

export default authRoutes;
