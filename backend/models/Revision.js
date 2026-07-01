import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Summary cannot exceed 200 characters'],
    },
    contentSnapshot: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Revision = mongoose.model('Revision', revisionSchema);
export default Revision;
