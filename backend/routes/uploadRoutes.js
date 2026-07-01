import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// protect authentication and execute multer upload.single('image')
router.post('/', protect, upload.single('image'), uploadImage);

export default router;
