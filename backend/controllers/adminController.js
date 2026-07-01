import Article from '../models/Article.js';
import Revision from '../models/Revision.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get Admin Panel Analytics
// @route   GET /admin/analytics
// @access  Private/Admin/Moderator
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Core Counts
    const totalUsers = await User.countDocuments({});
    const totalArticles = await Article.countDocuments({ status: 'Approved' });
    const pendingArticles = await Article.countDocuments({ status: 'Pending' });
    const totalEdits = await Revision.countDocuments({});

    // 2. Most Viewed Articles
    const mostViewed = await Article.find({ status: 'Approved' })
      .select('title slug views category')
      .populate('category', 'name')
      .sort({ views: -1 })
      .limit(5);

    // 3. Top Contributors (Grouped by Revisions)
    const topContributorsRaw = await Revision.aggregate([
      {
        $group: {
          _id: '$editor',
          editCount: { $sum: 1 },
        },
      },
      { $sort: { editCount: -1 } },
      { $limit: 5 },
    ]);

    // Populate user details manually since aggregate doesn't use Mongoose populate automatically
    const topContributors = await Promise.all(
      topContributorsRaw.map(async (item) => {
        const user = await User.findById(item._id).select('name role avatar');
        return {
          user,
          editCount: item.editCount,
        };
      })
    );

    // 4. Most Edited Articles
    const mostEditedRaw = await Revision.aggregate([
      {
        $group: {
          _id: '$article',
          editCount: { $sum: 1 },
        },
      },
      { $sort: { editCount: -1 } },
      { $limit: 5 },
    ]);

    const mostEdited = await Promise.all(
      mostEditedRaw.map(async (item) => {
        const article = await Article.findById(item._id).select('title slug');
        return {
          article,
          editCount: item.editCount,
        };
      })
    );

    // 5. Monthly growth of articles (Simulated grouping by date)
    const growth = await Article.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        totalArticles,
        pendingArticles,
        totalEdits,
      },
      analytics: {
        mostViewed,
        topContributors: topContributors.filter(tc => tc.user !== null),
        mostEdited: mostEdited.filter(me => me.article !== null),
        articleGrowth: growth,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending reviews
// @route   GET /admin/pending
// @access  Private/Admin/Moderator
export const getPendingReviews = async (req, res, next) => {
  try {
    const pending = await Article.find({ status: 'Pending' })
      .populate('category', 'name slug')
      .populate('author', 'name email role avatar')
      .sort({ updatedAt: 1 }); // Oldest first to review

    res.status(200).json({
      success: true,
      count: pending.length,
      pending,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve article / revision
// @route   POST /admin/pending/:id/approve
// @access  Private/Admin/Moderator
export const approveArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    if (article.status !== 'Pending') {
      res.status(400);
      return next(new Error('Article is not pending review'));
    }

    article.status = 'Approved';
    await article.save();

    // Send notification to author
    await Notification.create({
      recipient: article.author,
      type: 'ArticleApproved',
      message: `Your article "${article.title}" has been approved and is now live!`,
      link: `/articles/${article.slug}`,
      sender: req.user._id,
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'APPROVE_ARTICLE',
      performedBy: req.user._id,
      targetType: 'Article',
      targetId: article._id,
      details: `Approved article "${article.title}" (version ${article.version})`,
    });

    res.status(200).json({
      success: true,
      message: `Article "${article.title}" approved successfully.`,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject article / revision
// @route   POST /admin/pending/:id/reject
// @access  Private/Admin/Moderator
export const rejectArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    const { reason } = req.body;

    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    if (article.status !== 'Pending') {
      res.status(400);
      return next(new Error('Article is not pending review'));
    }

    article.status = 'Rejected';
    await article.save();

    // Send notification to author
    await Notification.create({
      recipient: article.author,
      type: 'ArticleRejected',
      message: `Your article "${article.title}" has been rejected. Reason: ${reason || 'Does not comply with community guidelines.'}`,
      link: '/dashboard',
      sender: req.user._id,
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'REJECT_ARTICLE',
      performedBy: req.user._id,
      targetType: 'Article',
      targetId: article._id,
      details: `Rejected article "${article.title}" (version ${article.version}). Reason: ${reason || 'No guidelines provided'}`,
    });

    res.status(200).json({
      success: true,
      message: `Article "${article.title}" rejected successfully.`,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reported articles/comments
// @route   GET /admin/reports
// @access  Private/Admin/Moderator
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name email role')
      .populate({
        path: 'article',
        select: 'title slug author',
        populate: { path: 'author', select: 'name' },
      })
      .populate({
        path: 'comment',
        select: 'content author',
        populate: { path: 'author', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve a report
// @route   PATCH /admin/reports/:id
// @access  Private/Admin/Moderator
export const resolveReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    let report = await Report.findById(req.params.id);

    if (!report) {
      res.status(404);
      return next(new Error('Report not found'));
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();

    // Create Audit Log
    await AuditLog.create({
      action: 'RESOLVE_REPORT',
      performedBy: req.user._id,
      targetType: 'Report',
      targetId: report._id,
      details: `Resolved report with status: ${status || report.status}. Notes: ${adminNotes || 'None'}`,
    });

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide revisions (activity logs)
// @route   GET /admin/logs
// @access  Private/Admin/Moderator
export const getSystemLogs = async (req, res, next) => {
  try {
    const logs = await Revision.find({})
      .populate('article', 'title slug')
      .populate('editor', 'name email role')
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Post Site Announcement
// @route   POST /admin/announcements
// @access  Private/Admin/Moderator
export const postAnnouncement = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400);
      return next(new Error('Announcement title and content are required'));
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'POST_ANNOUNCEMENT',
      performedBy: req.user._id,
      targetType: 'Announcement',
      targetId: announcement._id,
      details: `Created announcement: "${announcement.title}"`,
    });

    res.status(201).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get administrative audit logs
// @route   GET /admin/audit-logs
// @access  Private/Admin
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('performedBy', 'name email role avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
