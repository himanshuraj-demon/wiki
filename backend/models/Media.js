import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: '',
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Media = mongoose.model('Media', mediaSchema);
export default Media;
