import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ArticleApproved', 'ArticleRejected', 'CommentReceived', 'RoleChanged', 'Mentioned'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
