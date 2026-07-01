import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Article from '../models/Article.js';

// @desc    Get comments for an article (Threaded Tree)
// @route   GET /comments/:articleId
// @access  Public
export const getCommentsByArticle = async (req, res, next) => {
  try {
    const comments = await Comment.find({ article: req.params.articleId })
      .populate('author', 'name role avatar')
      .sort({ createdAt: 1 }); // Oldest first for chronological reading

    // Build threaded comments tree
    const commentMap = {};
    const roots = [];

    comments.forEach((c) => {
      const commentObj = c.toObject();
      commentObj.replies = [];
      commentMap[commentObj._id.toString()] = commentObj;
    });

    comments.forEach((c) => {
      const commentObj = commentMap[c._id.toString()];
      if (commentObj.parentComment) {
        const parent = commentMap[commentObj.parentComment.toString()];
        if (parent) {
          parent.replies.push(commentObj);
        } else {
          // If parent not found (e.g. deleted and purged), threat as root
          roots.push(commentObj);
        }
      } else {
        roots.push(commentObj);
      }
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments: roots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a comment
// @route   POST /comments/:articleId
// @access  Private
export const createComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;
    const articleId = req.params.articleId;

    if (!content) {
      res.status(400);
      return next(new Error('Comment content cannot be empty'));
    }

    const article = await Article.findById(articleId);
    if (!article) {
      res.status(404);
      return next(new Error('Article not found'));
    }

    const comment = await Comment.create({
      article: articleId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    // Populate author details for immediate display on client
    const populatedComment = await Comment.findById(comment._id).populate('author', 'name role avatar');

    // Create notifications:
    // If it's a sub-reply, notify the parent comment author.
    // Otherwise, notify the article author (if not the same person).
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent && parent.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parent.author,
          type: 'CommentReceived',
          message: `${req.user.name} replied to your comment on "${article.title}".`,
          link: `/articles/${article.slug}?tab=discussion`,
          sender: req.user._id,
        });
      }
    } else if (article.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: article.author,
        type: 'CommentReceived',
        message: `${req.user.name} commented on your article "${article.title}".`,
        link: `/articles/${article.slug}?tab=discussion`,
        sender: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /comments/:id
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'Admin' || req.user.role === 'Moderator';

    if (!isAuthor && !isStaff) {
      res.status(403);
      return next(new Error('Not authorized to delete this comment'));
    }

    // Soft delete to preserve thread structure
    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a comment
// @route   POST /comments/:id/like
// @access  Private
export const toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      return next(new Error('Comment not found'));
    }

    const likedIndex = comment.likes.indexOf(req.user._id);

    if (likedIndex > -1) {
      // Unlike
      comment.likes.splice(likedIndex, 1);
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      likesCount: comment.likes.length,
      liked: likedIndex === -1,
    });
  } catch (error) {
    next(error);
  }
};
