import express from 'express';
import {
  getUserDashboard,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUserDashboard);
router.patch('/notifications/:id', protect, markNotificationRead);
router.post('/notifications/read-all', protect, markAllNotificationsRead);

export default router;
