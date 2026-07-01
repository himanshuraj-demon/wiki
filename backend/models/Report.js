import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the report'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved'],
      default: 'Pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;
