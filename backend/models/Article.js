import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please associate a category with this article'],
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readingTime: {
      type: Number,
      default: 1,
    },
    references: [
      {
        title: { type: String, required: true },
        url: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to compute reading time (approx 200 words per minute)
articleSchema.pre('save', function (next) {
  if (this.content) {
    const words = this.content.split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

const Article = mongoose.model('Article', articleSchema);
export default Article;
