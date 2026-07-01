import express from 'express';
import {
  getCommentsByArticle,
  createComment,
  deleteComment,
  toggleLikeComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:articleId', getCommentsByArticle);
router.post('/:articleId', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleLikeComment);

export default router;
