import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
