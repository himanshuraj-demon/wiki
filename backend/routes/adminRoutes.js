import express from 'express';
import {
  getAnalytics,
  getPendingReviews,
  approveArticle,
  rejectArticle,
  getReports,
  resolveReport,
  getSystemLogs,
  postAnnouncement,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth protectors to all routes inside admin router
router.use(protect);
router.use(authorize('Admin', 'Moderator'));

router.get('/analytics', getAnalytics);
router.get('/pending', getPendingReviews);
router.post('/pending/:id/approve', approveArticle);
router.post('/pending/:id/reject', rejectArticle);

router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);

router.get('/logs', getSystemLogs);
router.get('/audit-logs', getAuditLogs);
router.post('/announcements', postAnnouncement);

export default router;
