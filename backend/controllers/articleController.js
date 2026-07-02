import Article from '../models/Article.js';
import Revision from '../models/Revision.js';
import Category from '../models/Category.js';
import Bookmark from '../models/Bookmark.js';
import Notification from '../models/Notification.js';
import slugify from 'slugify';
import mongoose from 'mongoose';
import { sanitizeMarkdown } from '../utils/sanitizer.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all articles
// @route   GET /articles
// @access  Public
export const getArticles = async (req, res, next) => {
  try {
    const { category, tag, status, sort, limit = 10, page = 1 } = req.query;
    const query = {};

    // Filter by status. Default is Approved. 
    // Allow Admins/Moderators to filter by Draft/Pending/Rejected.
    if (status) {
      query.status = status;
    } else {
      query.status = 'Approved';
    }

    // Filter by Category slug
    if (category) {
      const catObj = await Category.findOne({ slug: category });
      if (catObj) {
        query.category = catObj._id;
      } else {
        return res.status(200).json({ success: true, count: 0, articles: [] });
      }
    }

    // Filter by tag
    if (tag) {
      query.tags = tag;
    }

    // Sorting
    let sortBy = { updatedAt: -1 };
    if (sort === 'views') {
      sortBy = { views: -1 };
    } else if (sort === 'likes') {
      sortBy = { likesCount: -1 }; // Note: we can sort manually or compute length, let's sort by views or date
    } else if (sort === 'title') {
      sortBy = { title: 1 };
    }

    const skipVal = (parseInt(page) - 1) * parseInt(limit);

    const articles = await Article.find(query)
      .populate('category', 'name slug')
      .populate('author', 'name role avatar')
      .sort(sortBy)
      .skip(skipVal)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(query);

    res.status(200).json({
      success: true,
      count: articles.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
      articles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single article by slug or ID
// @route   GET /articles/:slug
// @access  Public
export const getArticleBySlug = async (req, res, next) => {
  try {
    const isId = mongoose.Types.ObjectId.isValid(req.params.slug);
    const query = isId ? { _id: req.params.slug } : { slug: req.params.slug };

    const article = await Article.findOne(query)
      .populate('category', 'name slug')
      .populate('author', 'name role avatar bio department batch badges joinedDate')
      .populate('likes', 'name avatar')
      .populate('bookmarks', 'name');

    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    // Increment view count
    article.views += 1;
    await article.save();

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new article
// @route   POST /articles
// @access  Private
export const createArticle = async (req, res, next) => {
  try {
    const { title, category: categorySlugOrId, content, bannerImage, galleryImages, tags, references, status } = req.body;

    if (!title || !categorySlugOrId || !content) {
      res.status(400);
      return next(new Error('Title, category, and content are required'));
    }

    // Find category
    let categoryObj = await Category.findOne({ slug: categorySlugOrId });
    if (!categoryObj) {
      categoryObj = await Category.findById(categorySlugOrId);
    }
    if (!categoryObj) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    // Generate unique slug
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Article.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Status: if student or guest, it defaults to Pending (needs approval)
    // If admin or moderator, it defaults to Approved (live)
    // Unless requested status is Draft, which stays Draft
    let finalStatus = 'Approved';
    if (status === 'Draft') {
      finalStatus = 'Draft';
    } else if (req.user.role === 'Student' || req.user.role === 'Guest') {
      finalStatus = 'Pending';
    }

    const sanitizedContent = sanitizeMarkdown(content);

    const article = await Article.create({
      title,
      slug,
      category: categoryObj._id,
      content: sanitizedContent,
      bannerImage: bannerImage || '',
      galleryImages: galleryImages || [],
      author: req.user._id,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      references: references || [],
      status: finalStatus,
      version: 1,
    });

    // Create revision snapshot
    await Revision.create({
      article: article._id,
      editor: req.user._id,
      version: 1,
      summary: 'Initial page creation',
      contentSnapshot: sanitizedContent,
    });

    // Notify admins if pending
    if (finalStatus === 'Pending') {
      // Find one admin to notify or notify in system (notifications are fetched for admins)
      // Create a global notification log or assign recipient to any active Admin (or create it for a specific role)
      // For now, let's create a notification for the author as "Pending Approval"
      await Notification.create({
        recipient: req.user._id,
        type: 'Mentioned',
        message: `Your article "${title}" has been submitted and is pending review.`,
        link: `/articles/${slug}`,
        sender: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update article (and create revision)
// @route   PATCH /articles/:id
// @access  Private
export const updateArticle = async (req, res, next) => {
  try {
    const { title, category: categorySlugOrId, content, bannerImage, galleryImages, tags, references, summary, status } = req.body;
    let article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    // Check permissions
    // Guest can only edit drafts they created
    // Student can edit, but changes will trigger moderation queue (status becomes Pending)
    // Admin/Moderator can edit, changes are immediate (status stays Approved)
    const isAuthor = article.author.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'Admin' || req.user.role === 'Moderator';

    if (!isAuthor && !isStaff) {
      res.status(403);
      return next(new Error('Not authorized to edit this article'));
    }

    if (categorySlugOrId) {
      let categoryObj = await Category.findOne({ slug: categorySlugOrId });
      if (!categoryObj) {
        categoryObj = await Category.findById(categorySlugOrId);
      }
      if (categoryObj) {
        article.category = categoryObj._id;
      }
    }

    if (title && title !== article.title) {
      article.title = title;
      let baseSlug = slugify(title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (await Article.findOne({ slug, _id: { $ne: article._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      article.slug = slug;
    }

    if (bannerImage !== undefined) article.bannerImage = bannerImage;
    if (galleryImages !== undefined) article.galleryImages = galleryImages;
    if (tags !== undefined) article.tags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    if (references !== undefined) article.references = references;

    // Track if content changed
    let contentChanged = false;
    if (content) {
      const sanitizedContent = sanitizeMarkdown(content);
      if (sanitizedContent !== article.content) {
        article.content = sanitizedContent;
        article.version += 1;
        contentChanged = true;
      }
    }

    // Status logic
    if (status === 'Draft') {
      article.status = 'Draft';
    } else if (isStaff) {
      // If staff updates, keep approved (or update to requested status)
      article.status = status || 'Approved';
    } else {
      // Students/Guests updates go to Pending
      article.status = 'Pending';
    }

    await article.save();

    // Create revision snapshot
    if (contentChanged) {
      await Revision.create({
        article: article._id,
        editor: req.user._id,
        version: article.version,
        summary: summary || `Updated to version ${article.version}`,
        contentSnapshot: article.content,
      });

      // Notify the original author if someone else edited it
      if (article.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: article.author,
          type: 'CommentReceived',
          message: `${req.user.name} edited your article "${article.title}" (v${article.version}).`,
          link: `/articles/${article.slug}`,
          sender: req.user._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete article
// @route   DELETE /articles/:id
// @access  Private (Admin, Moderator)
export const deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    // Only Admin or Moderator can delete
    if (req.user.role !== 'Admin' && req.user.role !== 'Moderator') {
      res.status(403);
      return next(new Error('Only Admins or Moderators can delete articles'));
    }

    await Article.findByIdAndDelete(req.params.id);
    
    // Clean up revisions
    await Revision.deleteMany({ article: req.params.id });
    
    // Clean up bookmarks
    await Bookmark.deleteMany({ article: req.params.id });

    // Create Audit Log
    await AuditLog.create({
      action: 'DELETE_ARTICLE',
      performedBy: req.user._id,
      targetType: 'Article',
      targetId: article._id,
      details: `Deleted article "${article.title}" (slug: ${article.slug})`,
    });

    res.status(200).json({
      success: true,
      message: 'Article and its history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revision history of an article
// @route   GET /articles/:id/history
// @access  Public
export const getArticleHistory = async (req, res, next) => {
  try {
    const revisions = await Revision.find({ article: req.params.id })
      .populate('editor', 'name role avatar')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      revisions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore article to a specific version
// @route   POST /articles/:id/restore
// @access  Private (Admin, Moderator)
export const restoreArticleVersion = async (req, res, next) => {
  try {
    const { version } = req.body;
    
    if (!version) {
      res.status(400);
      return next(new Error('Please specify the version to restore'));
    }

    let article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    // Find the historical revision
    const revision = await Revision.findOne({ article: req.params.id, version });
    if (!revision) {
      res.status(404);
      return next(new Error(`Revision v${version} not found for this article`));
    }

    // Update article details with revision snapshot
    article.content = revision.contentSnapshot;
    article.version += 1;
    article.status = 'Approved'; // Reverting restores the article to live state
    await article.save();

    // Create a new revision document representing this restoration
    await Revision.create({
      article: article._id,
      editor: req.user._id,
      version: article.version,
      summary: `Restored to version ${version}`,
      contentSnapshot: revision.contentSnapshot,
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'RESTORE_ARTICLE',
      performedBy: req.user._id,
      targetType: 'Article',
      targetId: article._id,
      details: `Restored article "${article.title}" to version ${version}`,
    });

    res.status(200).json({
      success: true,
      article,
      message: `Restored to version ${version} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific revision version of an article
// @route   DELETE /articles/:id/revisions/:revisionId
// @access  Private (Admin Only)
export const deleteArticleRevision = async (req, res, next) => {
  try {
    const { id, revisionId } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    const revision = await Revision.findById(revisionId);
    if (!revision) {
      res.status(404);
      return next(new Error('Revision not found'));
    }

    if (revision.article.toString() !== id) {
      res.status(400);
      return next(new Error('Revision does not belong to this article'));
    }

    // Do not allow deleting the current active version of the article
    if (revision.version === article.version) {
      res.status(400);
      return next(new Error('Cannot delete the current active version of the article.'));
    }

    await Revision.findByIdAndDelete(revisionId);

    // Create Audit Log
    await AuditLog.create({
      action: 'DELETE_REVISION',
      performedBy: req.user._id,
      targetType: 'Article',
      targetId: article._id,
      details: `Deleted version v${revision.version} revision log of article "${article.title}"`,
    });

    res.status(200).json({
      success: true,
      message: `Revision v${revision.version} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike an article
// @route   POST /articles/:id/like
// @access  Private
export const toggleLikeArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    const likedIndex = article.likes.indexOf(req.user._id);

    if (likedIndex > -1) {
      // Already liked, so unlike it
      article.likes.splice(likedIndex, 1);
    } else {
      // Add like
      article.likes.push(req.user._id);
    }

    await article.save();

    res.status(200).json({
      success: true,
      likesCount: article.likes.length,
      liked: likedIndex === -1, // True if now liked, false if unliked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark / Unbookmark an article
// @route   POST /articles/:id/bookmark
// @access  Private
export const toggleBookmarkArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    const bookmarkedIndex = article.bookmarks.indexOf(req.user._id);
    let bookmarked = false;

    if (bookmarkedIndex > -1) {
      // Already bookmarked, remove it from article arrays
      article.bookmarks.splice(bookmarkedIndex, 1);
      // Remove bookmark from Bookmark model
      await Bookmark.findOneAndDelete({ user: req.user._id, article: article._id });
    } else {
      // Add bookmark
      article.bookmarks.push(req.user._id);
      await Bookmark.create({ user: req.user._id, article: article._id });
      bookmarked = true;
    }

    await article.save();

    res.status(200).json({
      success: true,
      bookmarksCount: article.bookmarks.length,
      bookmarked,
    });
  } catch (error) {
    next(error);
  }
};
