import Article from '../models/Article.js';
import Revision from '../models/Revision.js';
import Bookmark from '../models/Bookmark.js';
import Notification from '../models/Notification.js';
import Comment from '../models/Comment.js';

// @desc    Get user dashboard summary
// @route   GET /dashboard
// @access  Private
export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Articles Created by User (Approved or Pending)
    const articlesCreated = await Article.find({ author: userId, status: { $ne: 'Draft' } })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    // 2. Drafts Created by User
    const drafts = await Article.find({ author: userId, status: 'Draft' })
      .populate('category', 'name slug')
      .sort({ updatedAt: -1 });

    // 3. User Bookmarks
    const bookmarks = await Bookmark.find({ user: userId })
      .populate({
        path: 'article',
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'author', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    // 4. Edits/Revisions made by User (distinct articles)
    const revisions = await Revision.find({ editor: userId })
      .populate('article', 'title slug')
      .sort({ timestamp: -1 });

    // Get unique edited articles
    const uniqueEditedArticles = [];
    const seenArticles = new Set();
    revisions.forEach((rev) => {
      if (rev.article && !seenArticles.has(rev.article._id.toString())) {
        seenArticles.add(rev.article._id.toString());
        uniqueEditedArticles.push({
          _id: rev.article._id,
          title: rev.article.title,
          slug: rev.article.slug,
          version: rev.version,
          timestamp: rev.timestamp,
        });
      }
    });

    // 5. Unread and Read Notifications
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    // 6. Recent comments left by user
    const comments = await Comment.find({ author: userId })
      .populate('article', 'title slug')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        articlesCreatedCount: articlesCreated.length,
        draftsCount: drafts.length,
        bookmarksCount: bookmarks.length,
        totalEditsCount: revisions.length,
        uniqueEditedCount: uniqueEditedArticles.length,
      },
      articles: articlesCreated,
      drafts,
      bookmarks: bookmarks.map(b => b.article).filter(a => a !== null),
      editedArticles: uniqueEditedArticles,
      notifications,
      recentComments: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notifications as read
// @route   PATCH /dashboard/notifications/:id
// @access  Private
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    notification.readStatus = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   POST /dashboard/notifications/read-all
// @access  Private
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, readStatus: false },
      { $set: { readStatus: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
