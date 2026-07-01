import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getCategories)
  .post(protect, authorize('Admin', 'Moderator'), createCategory);

router
  .route('/:id')
  .patch(protect, authorize('Admin', 'Moderator'), updateCategory)
  .delete(protect, authorize('Admin', 'Moderator'), deleteCategory);

export default router;
