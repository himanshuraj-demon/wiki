import express from 'express';
import { getUsers, updateUser, deleteUser, getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public route
router.get('/profile/:email', getUserProfile);

router.route('/')
  .get(protect, authorize('Admin'), getUsers);

router.route('/:id')
  .patch(protect, updateUser)
  .delete(protect, authorize('Admin'), deleteUser);

export default router;
