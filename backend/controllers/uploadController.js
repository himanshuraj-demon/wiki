import Media from '../models/Media.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @desc    Upload an image
// @route   POST /upload
// @access  Private
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('No file uploaded'));
    }

    const localFilePath = req.file.path;
    
    // Upload to Cloudinary (falls back to local serving if not configured)
    const uploadResult = await uploadToCloudinary(localFilePath);

    // Save media log in db
    const media = await Media.create({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      media,
    });
  } catch (error) {
    next(error);
  }
};
