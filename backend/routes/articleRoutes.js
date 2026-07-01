import express from 'express';
import {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleHistory,
  restoreArticleVersion,
  toggleLikeArticle,
  toggleBookmarkArticle,
} from '../controllers/articleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getArticles)
  .post(protect, createArticle);

router
  .route('/:id')
  .patch(protect, updateArticle)
  .delete(protect, authorize('Admin', 'Moderator'), deleteArticle);

router.get('/:slug', getArticleBySlug);
router.get('/:id/history', getArticleHistory);

// Authenticated features
router.post('/:id/restore', protect, authorize('Admin', 'Moderator'), restoreArticleVersion);
router.post('/:id/like', protect, toggleLikeArticle);
router.post('/:id/bookmark', protect, toggleBookmarkArticle);

export default router;
